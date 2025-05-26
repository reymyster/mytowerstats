import type { Route } from "./+types/new";
import React, { useState, useEffect } from "react";
import type { BreadcrumbHandle } from "~/types/breadcrumb";
import { createWorker, type RecognizeResult } from "tesseract.js";
import { formatRelative } from "date-fns";
import {
  abbreviateNumber,
  textToStats,
  calcStats,
  type RoundStats,
} from "~/lib/stats";

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
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ScreenData {
  file: File;
  url: string;
  text?: string;
  error?: string;
}

export const handle: BreadcrumbHandle = {
  breadcrumb: () => "New Run",
};

export default function NewRun() {
  const [screens, setScreens] = useState<ScreenData[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [stats, setStats] = useState<RoundStats>({ runType: "farming" });

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

  function calcAndSetStats(input: RoundStats) {
    const calculated = calcStats(input);
    setStats(calculated);
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
    let newStats: RoundStats = {
      ...textToStats(results[0].text ?? ""),
      recorded: results[0].file.lastModified,
    };
    calcAndSetStats(newStats);
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
        <div className="grid grid-cols-1 gap-2 2xl:grid-cols-2">
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
                      <img
                        src={s.url}
                        alt={s.file.name}
                        className="max-w-full"
                      />
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
          <Tabs defaultValue="meta" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="meta">Meta</TabsTrigger>
              <TabsTrigger value="battleReport">Battle Report</TabsTrigger>
            </TabsList>
            <TabsContent value="meta">
              <Card>
                <CardHeader>Meta</CardHeader>
                <CardContent className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <Label>Recorded</Label>
                    <Input
                      type="text"
                      value={
                        stats.recorded
                          ? formatRelative(new Date(stats.recorded), new Date())
                          : ""
                      }
                      readOnly={true}
                    />
                    <input
                      type="hidden"
                      name="metaRecorded"
                      value={stats.recorded ?? 0}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Run Type</Label>
                    <RadioGroup
                      defaultValue={stats.runType}
                      onValueChange={(e) =>
                        calcAndSetStats({
                          ...stats,
                          runType:
                            e === "tournament" ||
                            e === "farming" ||
                            e === "milestone"
                              ? e
                              : "farming",
                        })
                      }
                      className="flex flex-row"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="farming" id="rtFarming" />
                        <Label htmlFor="rtFarming">Farming</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="milestone" id="rtMilestone" />
                        <Label htmlFor="rtMilestone">Milestone</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="tournament" id="rtTournament" />
                        <Label htmlFor="rtTournament">Tournament</Label>
                      </div>
                    </RadioGroup>
                    <input
                      type="hidden"
                      name="metaRunType"
                      value={stats.runType}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="metaCoinsPerHourText">Coins / Hour</Label>
                    <Input
                      type="text"
                      id="metaCoinsPerHourText"
                      name="metaCoinsPerHourText"
                      value={`${abbreviateNumber(
                        stats.battleReport?.coinsPerHour ?? 0
                      )}/h`}
                      readOnly={true}
                    />
                    <input
                      type="hidden"
                      name="metaCoinsPerHour"
                      value={stats.battleReport?.coinsPerHour ?? 0}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="metaCellsPerHourText">Cells / Hour</Label>
                    <Input
                      type="text"
                      id="metaCellsPerHourText"
                      name="metaCellsPerHourText"
                      value={`${abbreviateNumber(
                        stats.battleReport?.cellsPerHour ?? 0
                      )}/h`}
                      readOnly={true}
                    />
                    <input
                      type="hidden"
                      name="metaCellsPerHour"
                      value={stats.battleReport?.cellsPerHour ?? 0}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="metaShardsPerHourText">
                      Reroll Shards / Hour
                    </Label>
                    <Input
                      type="text"
                      id="metaShardsPerHourText"
                      name="metaShardsPerHourText"
                      value={`${abbreviateNumber(
                        stats.battleReport?.rerollShardsPerHour ?? 0
                      )}/h`}
                      readOnly={true}
                    />
                    <input
                      type="hidden"
                      name="metaShardsPerHour"
                      value={stats.battleReport?.rerollShardsPerHour ?? 0}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="battleReport">
              <Card>
                <CardHeader>Battle Report</CardHeader>
                <CardContent className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="battleReportGameTimeText">Game Time</Label>
                    <Input
                      type="text"
                      id="battleReportGameTimeText"
                      name="battleReportGameTimeText"
                      value={stats.battleReport?.gameTimeText}
                      onChange={(e) =>
                        calcAndSetStats({
                          ...stats,
                          battleReport: {
                            ...stats.battleReport,
                            gameTimeText: e.target.value,
                          },
                        })
                      }
                    />
                    <input
                      type="hidden"
                      name="battleReportGameTime"
                      value={stats.battleReport?.gameTime}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="battleReportRealTimeText">Real Time</Label>
                    <Input
                      type="text"
                      id="battleReportRealTimeText"
                      name="battleReportRealTimeText"
                      value={stats.battleReport?.realTimeText}
                      onChange={(e) =>
                        calcAndSetStats({
                          ...stats,
                          battleReport: {
                            ...stats.battleReport,
                            realTimeText: e.target.value,
                          },
                        })
                      }
                    />
                    <input
                      type="hidden"
                      name="battleReportRealTime"
                      value={stats.battleReport?.realTime}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="battleReportTierText">Tier</Label>
                    <Input
                      type="text"
                      id="battleReportTierText"
                      name="battleReportTierText"
                      value={stats.battleReport?.tierText}
                      onChange={(e) =>
                        calcAndSetStats({
                          ...stats,
                          battleReport: {
                            ...stats.battleReport,
                            tierText: e.target.value,
                          },
                        })
                      }
                    />
                    <input
                      type="hidden"
                      name="battleReportTier"
                      value={stats.battleReport?.tier}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="battleReportWaveText">Wave</Label>
                    <Input
                      type="text"
                      id="battleReportWaveText"
                      name="battleReportWaveText"
                      value={stats.battleReport?.waveText}
                      onChange={(e) =>
                        calcAndSetStats({
                          ...stats,
                          battleReport: {
                            ...stats.battleReport,
                            waveText: e.target.value,
                          },
                        })
                      }
                    />
                    <input
                      type="hidden"
                      name="battleReportWave"
                      value={stats.battleReport?.wave}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="battleReportCoinsEarnedText">
                      Coins Earned
                    </Label>
                    <Input
                      type="text"
                      id="battleReportCoinsEarnedText"
                      name="battleReportCoinsEarnedText"
                      value={stats.battleReport?.coinsEarnedText}
                      onChange={(e) =>
                        calcAndSetStats({
                          ...stats,
                          battleReport: {
                            ...stats.battleReport,
                            coinsEarnedText: e.target.value,
                          },
                        })
                      }
                    />
                    <input
                      type="hidden"
                      name="battleReportCoinsEarned"
                      value={stats.battleReport?.coinsEarned}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="battleReportCashEarnedText">
                      Cash Earned
                    </Label>
                    <Input
                      type="text"
                      id="battleReportCashEarnedText"
                      name="battleReportCashEarnedText"
                      value={stats.battleReport?.cashEarnedText}
                      onChange={(e) =>
                        calcAndSetStats({
                          ...stats,
                          battleReport: {
                            ...stats.battleReport,
                            cashEarnedText: e.target.value,
                          },
                        })
                      }
                    />
                    <input
                      type="hidden"
                      name="battleReportCashEarned"
                      value={stats.battleReport?.cashEarned}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="battleReportCellsEarnedText">
                      Cells Earned
                    </Label>
                    <Input
                      type="text"
                      id="battleReportCellsEarnedText"
                      name="battleReportCellsEarnedText"
                      value={stats.battleReport?.cellsEarnedText}
                      onChange={(e) =>
                        calcAndSetStats({
                          ...stats,
                          battleReport: {
                            ...stats.battleReport,
                            cellsEarnedText: e.target.value,
                          },
                        })
                      }
                    />
                    <input
                      type="hidden"
                      name="battleReportCellsEarned"
                      value={stats.battleReport?.cellsEarned}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="battleReportRerollShardsEarnedText">
                      Reroll Shards Earned
                    </Label>
                    <Input
                      type="text"
                      id="battleReportRerollShardsEarnedText"
                      name="battleReportRerollShardsEarnedText"
                      value={stats.battleReport?.rerollShardsEarnedText}
                      onChange={(e) =>
                        calcAndSetStats({
                          ...stats,
                          battleReport: {
                            ...stats.battleReport,
                            rerollShardsEarnedText: e.target.value,
                          },
                        })
                      }
                    />
                    <input
                      type="hidden"
                      name="battleReportRerollShardsEarned"
                      value={stats.battleReport?.rerollShardsEarned}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
