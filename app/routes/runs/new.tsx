import type { Route } from "./+types/new";
import React, { useState, useEffect } from "react";
import { Form, redirect } from "react-router";
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
import { ConvexHttpClient } from "convex/browser";
import { api } from "convex/_generated/api";
import { getAuth } from "@clerk/react-router/ssr.server";

// Instantiate once per server (e.g. top of file)
const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL ?? "");

interface ScreenData {
  file: File;
  url: string;
  text?: string;
  error?: string;
}

export const handle: BreadcrumbHandle = {
  breadcrumb: () => "New Run",
};

export async function action(args: Route.ActionArgs) {
  const { userId } = await getAuth(args);
  let formData = await args.request.formData();
  let preStats = formData.get("stats") as string;
  let stats = JSON.parse(preStats) as RoundStats;

  const response = await convex.mutation(api.runs.create, {
    userId: userId!,
    recorded: stats.recorded,
    runType: stats.runType,
    battleReport: {
      text: {
        gameTime: stats.battleReport?.gameTimeText ?? "",
        realTime: stats.battleReport?.realTimeText ?? "",
        tier: stats.battleReport?.realTimeText ?? "",
        wave: stats.battleReport?.waveText ?? "",
        coinsEarned: stats.battleReport?.coinsEarnedText ?? "",
        cashEarned: stats.battleReport?.cashEarnedText ?? "",
        cellsEarned: stats.battleReport?.cellsEarnedText ?? "",
        rerollShardsEarned: stats.battleReport?.rerollShardsEarnedText ?? "",
      },
      values: {
        gameTime: stats.battleReport?.gameTime ?? 0,
        realTime: stats.battleReport?.realTime ?? 0,
        tier: stats.battleReport?.realTime ?? 0,
        wave: stats.battleReport?.wave ?? 0,
        coinsEarned: stats.battleReport?.coinsEarned ?? 0,
        cashEarned: stats.battleReport?.cashEarned ?? 0,
        cellsEarned: stats.battleReport?.cellsEarned ?? 0,
        rerollShardsEarned: stats.battleReport?.rerollShardsEarned ?? 0,
      },
    },
  });

  if (response) {
    return redirect("/runs");
  }

  return { success: false };
}

export default function NewRun({ actionData }: Route.ComponentProps) {
  const [screens, setScreens] = useState<ScreenData[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [stats, setStats] = useState<RoundStats>({
    recorded: Date.now(),
    runType: "farming",
  });

  async function onFilesChanged(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;

    // 1. Turn FileList → Array<File>
    const inputFiles = Array.from(e.target.files);

    // 2. Preprocess & rewrap as File
    const processedScreens = await Promise.all(
      inputFiles.map(async (origFile) => {
        // your existing preprocessImage util:
        // returns a Blob that’s resized, grayscale & compressed
        const blob = await preprocessImage(origFile, /*quality*/ 0.75);

        // wrap the blob in a File so it retains name + lastModified
        const processedFile = new File([blob], origFile.name, {
          type: blob.type,
          lastModified: origFile.lastModified,
        });
        console.log({
          originalSize: origFile.size,
          compressedSize: processedFile.size,
        });

        return {
          file: processedFile, // now has .name & .lastModified
          originalName: origFile.name, // for reference if you need it
          lastModified: origFile.lastModified, // easy sorting
          url: URL.createObjectURL(processedFile),
        };
      })
    );

    // 3. Sort however you like, e.g. by original timestamp
    processedScreens.sort((a, b) => a.lastModified - b.lastModified);

    // 4. Store in state for OCR + preview
    setScreens(processedScreens);
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

  // if (Object.keys(stats).length > 0) {
  //   console.log("%cStats", "color: green, font-size: 20px");
  //   console.table(stats);
  // }

  const allScreensProcessed =
    progress === 100 &&
    screens.length > 0 &&
    screens.every((s) => Boolean(s.text) || Boolean(s.error));

  return (
    <div className="p-4">
      <h2 className="text-2xl">New Run</h2>
      <div className="flex flex-row gap-2 lg:gap-4 items-center p-2 lg:p-4">
        <Form className="w-full flex flex-row gap-4" method="POST">
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={onFilesChanged}
          />
          {screens.length > 0 && (
            <React.Fragment>
              <Button
                type="button"
                onClick={runBatchOCR}
                disabled={progress > 0 && progress < 100}
              >
                Process {screens.length} Files
              </Button>
              <input type="hidden" name="stats" value={JSON.stringify(stats)} />
              <Button type="submit">Save</Button>
            </React.Fragment>
          )}
        </Form>
      </div>
      {progress > 0 && progress < 100 && <Progress value={progress} />}
      {allScreensProcessed && (
        <div className="grid grid-cols-1 gap-2 2xl:grid-cols-[2fr_1fr]">
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
                  <CardContent className="grid grid-cols-2 gap-2 max-h-[85svh] overflow-y-auto">
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
                    <div className="max-w-full overflow-y-auto">
                      <img
                        src={s.url}
                        alt={s.file.name}
                        className="max-w-full"
                      />
                    </div>
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
                      value={stats.battleReport?.gameTimeText ?? ""}
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
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="battleReportRealTimeText">Real Time</Label>
                    <Input
                      type="text"
                      id="battleReportRealTimeText"
                      name="battleReportRealTimeText"
                      value={stats.battleReport?.realTimeText ?? ""}
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
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="battleReportTierText">Tier</Label>
                    <Input
                      type="text"
                      id="battleReportTierText"
                      name="battleReportTierText"
                      value={stats.battleReport?.tierText ?? ""}
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
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="battleReportWaveText">Wave</Label>
                    <Input
                      type="text"
                      id="battleReportWaveText"
                      name="battleReportWaveText"
                      value={stats.battleReport?.waveText ?? ""}
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
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="battleReportCoinsEarnedText">
                      Coins Earned
                    </Label>
                    <Input
                      type="text"
                      id="battleReportCoinsEarnedText"
                      name="battleReportCoinsEarnedText"
                      value={stats.battleReport?.coinsEarnedText ?? ""}
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
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="battleReportCashEarnedText">
                      Cash Earned
                    </Label>
                    <Input
                      type="text"
                      id="battleReportCashEarnedText"
                      name="battleReportCashEarnedText"
                      value={stats.battleReport?.cashEarnedText ?? ""}
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
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="battleReportCellsEarnedText">
                      Cells Earned
                    </Label>
                    <Input
                      type="text"
                      id="battleReportCellsEarnedText"
                      name="battleReportCellsEarnedText"
                      value={stats.battleReport?.cellsEarnedText ?? ""}
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
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="battleReportRerollShardsEarnedText">
                      Reroll Shards Earned
                    </Label>
                    <Input
                      type="text"
                      id="battleReportRerollShardsEarnedText"
                      name="battleReportRerollShardsEarnedText"
                      value={stats.battleReport?.rerollShardsEarnedText ?? ""}
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
/**
 * Preprocess an image by converting to grayscale, and compressing.
 * @param file - The original image File
 * @param quality - JPEG/WebP quality between 0 and 1
 */
async function preprocessImage(file: File, quality = 0.75): Promise<Blob> {
  // 1. Load into an HTMLImageElement
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      res(image);
    };
    image.onerror = rej;
    image.src = url;
  });

  // 2. Calculate target dimensions
  const { width, height } = img;

  // 3. Draw & desaturate on a canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);

  // Grab pixel data, convert each pixel to its luminance
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Standard luminance formula
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = data[i + 1] = data[i + 2] = lum;
  }
  ctx.putImageData(imageData, 0, 0);

  // 4. Export as compressed JPEG (or change mimeType to 'image/webp')
  return new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
      },
      "image/jpeg",
      quality
    );
  });
}
