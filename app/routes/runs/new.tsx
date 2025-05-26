import type { Route } from "./+types/new";
import React, { useState } from "react";
import type { BreadcrumbHandle } from "~/types/breadcrumb";
import { createWorker, type RecognizeResult } from "tesseract.js";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ScreenData {
  file: File;
  url: string;
  text?: string;
  error?: string;
}

type RoundStats = {
  recorded?: number;
  runType?: "farming" | "milestone" | "tourney";
  battleReport?: {
    gameTime?: number;
    realTime?: number;
    tier?: number;
    wave?: number;
    coinsEarned?: number;
    cashEarned?: number;
    cellsEarned?: number;
    rerollShardsEarned?: number;
    coinsPerHour?: number;
    cellsPerHour?: number;
    rerollShardsPerHour?: number;
  };
};

const statSections = ["Battle Report", "Combat"];

function textToStats(text: string): RoundStats {
  const lines = text.split("\n");
  const sections = statSections.map((section) => {
    const sectionIndex = lines.findIndex((line) => line === section);
    return {
      section,
      sectionIndex,
    };
  });
  console.dir(sections);
  let parsed: RoundStats = {};
  if (
    sections[0].sectionIndex > 0 &&
    sections[1].sectionIndex > sections[0].sectionIndex
  ) {
    // Battle Report
    const battleReportLines = lines.slice(
      sections[0].sectionIndex + 1,
      sections[1].sectionIndex
    );
    const realTime = parseTimeToSeconds(battleReportLines[1]);
    const realTimeHours = realTime / (60 * 60);
    const coinsEarned = parseAbbreviatedNumber(battleReportLines[5]);
    const coinsPerHour = coinsEarned ? coinsEarned / realTimeHours : undefined;
    const cellsEarned = parseAbbreviatedNumber(battleReportLines[9]);
    const cellsPerHour = cellsEarned ? cellsEarned / realTimeHours : undefined;
    const rerollShardsEarned = parseAbbreviatedNumber(battleReportLines[10]);
    const rerollShardsPerHour = rerollShardsEarned
      ? rerollShardsEarned / realTimeHours
      : undefined;
    parsed = {
      ...parsed,
      battleReport: {
        gameTime: parseTimeToSeconds(battleReportLines[0]),
        realTime,
        tier: parseInt(battleReportLines[2].replace("Tier ", ""), 10),
        wave: parseInt(battleReportLines[3].replace("Wave ", ""), 10),
        coinsEarned,
        cashEarned: parseAbbreviatedNumber(battleReportLines[6]),
        cellsEarned,
        rerollShardsEarned,
        coinsPerHour,
        cellsPerHour,
        rerollShardsPerHour,
      },
    };
  }
  return parsed;
}

function parseTimeToSeconds(input: string): number {
  const timeUnits: { [key: string]: number } = {
    d: 86400, // 24 * 60 * 60
    h: 3600, // 60 * 60
    m: 60,
    s: 1,
  };

  // Match segments like "2d", "13h", "30m", or just "27" (assume seconds)
  const regex = /(\d+)([dhms])?/g;
  let match: RegExpExecArray | null;
  let totalSeconds = 0;

  while ((match = regex.exec(input)) !== null) {
    const value = parseInt(match[1], 10);
    const unit = match[2] ?? "s"; // default to seconds if no unit
    const multiplier = timeUnits[unit] ?? 1;
    totalSeconds += value * multiplier;
  }

  return totalSeconds;
}

function parseAbbreviatedNumber(input: string): number | undefined {
  // Define magnitude suffixes and their powers
  const suffixMultipliers: { [key: string]: number } = {
    K: 1e3,
    M: 1e6,
    B: 1e9,
    T: 1e12,
    q: 1e15,
    Q: 1e18,
    s: 1e21,
    S: 1e24,
    O: 1e27,
    N: 1e30,
    d: 1e33,
    D: 1e36,
  };

  // Match a floating number followed by a single letter
  const match = input.match(/([\d.,]+)\s*([KMBTqQsSONdD])/);
  if (!match) return undefined;

  const num = parseFloat(match[1].replace(/,/g, ""));
  const suffix = match[2];
  const multiplier = suffixMultipliers[suffix];

  return num * multiplier;
}

function abbreviateNumber(num: number, decimals = 2): string {
  const suffixes: { suffix: string; value: number }[] = [
    { suffix: "D", value: 1e36 },
    { suffix: "d", value: 1e33 },
    { suffix: "N", value: 1e30 },
    { suffix: "O", value: 1e27 },
    { suffix: "S", value: 1e24 },
    { suffix: "s", value: 1e21 },
    { suffix: "Q", value: 1e18 },
    { suffix: "q", value: 1e15 },
    { suffix: "T", value: 1e12 },
    { suffix: "B", value: 1e9 },
    { suffix: "M", value: 1e6 },
    { suffix: "K", value: 1e3 },
  ];

  for (const { suffix, value } of suffixes) {
    if (num >= value) {
      const abbreviated = (num / value).toFixed(decimals);
      return `${abbreviated}${suffix}`;
    }
  }

  return num.toString();
}

export const handle: BreadcrumbHandle = {
  breadcrumb: () => "New Run",
};

export default function NewRun() {
  const [screens, setScreens] = useState<ScreenData[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [stats, setStats] = useState<RoundStats>({});

  function onFilesChanged(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;

    const files = Array.from(e.target.files)
      .map((f) => ({
        file: f,
        url: URL.createObjectURL(f),
      }))
      .toSorted((a, b) => a.file.lastModified - b.file.lastModified);
    setScreens(files);
  }

  async function runBatchOCR() {
    const worker = await createWorker("eng", undefined, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          setProgress(Math.round(m.progress * 100));
        }
      },
    });

    const results = await Promise.all(
      screens.map(async (screen, i) => {
        try {
          const {
            data: { text },
          }: RecognizeResult = await worker.recognize(screen.url);
          return { ...screen, text };
        } catch (e: any) {
          return { ...screen, error: e.message || "OCR failed" };
        }
      })
    );

    await worker.terminate();
    const stats = textToStats(results[0].text ?? "");
    setStats(stats);
    setScreens(results);
  }

  if (Object.keys(stats).length > 0) {
    console.log("%cStats", "color: green, font-size: 20px");
    console.table(stats);
  }

  const allScreensProcessed =
    progress === 100 &&
    screens.length > 0 &&
    screens.every((s) => Boolean(s.text) || Boolean(s.error));

  return (
    <div className="p-4">
      <h2 className="text-2xl">New Run</h2>
      <div className="flex flex-row gap-2 lg:gap-4 items-center p-2 lg:p-4">
        <Input
          type="file"
          accept="image/*"
          multiple
          onChange={onFilesChanged}
        />
        {screens.length > 0 && (
          <Button
            onClick={runBatchOCR}
            disabled={progress > 0 && progress < 100}
          >
            Process {screens.length} Files
          </Button>
        )}
      </div>
      {progress > 0 && progress < 100 && <Progress value={progress} />}
      {allScreensProcessed && (
        <Tabs defaultValue="0" className="w-full">
          <TabsList
            className="grid w-full grid-cols-(--file-count)"
            style={
              {
                "--file-count": `repeat(${screens.length}, minmax(0, 1fr))`,
              } as React.CSSProperties
            }
          >
            {screens.map((s, i) => (
              <TabsTrigger key={i} value={`${i}`}>
                {s.file.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {screens.map((s, i) => (
            <TabsContent key={i} value={`${i}`}>
              <Card>
                <CardHeader>{s.file.name}</CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  <div className="max-w-full overflow-y-auto">
                    <img src={s.url} alt={s.file.name} className="max-w-full" />
                  </div>
                  {Boolean(s.text) && (
                    <div className="border border-green-700 p-2">
                      <pre>{s.text}</pre>
                    </div>
                  )}
                  {Boolean(s.error) && (
                    <div className="border border-red-700 p-2">
                      <pre>{s.error}</pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
