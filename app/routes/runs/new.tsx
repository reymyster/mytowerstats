import type { Route } from "./+types/new";
import React, { useState } from "react";
import type { BreadcrumbHandle } from "~/types/breadcrumb";
import { createWorker, type RecognizeResult } from "tesseract.js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

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

  function onFilesChanged(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;

    const files = Array.from(e.target.files).map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
    }));
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
    setScreens(results);
  }

  console.table(screens);

  const successTexts = screens.filter((s) => s.text);
  const errorTexts = screens.filter((s) => s.error);

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
      {errorTexts.length > 0 && (
        <div className="border border-red-700 mt-2 p-2">
          <pre>
            {successTexts.map((screen, i) => (
              <span key={i}>{screen.error}</span>
            ))}
          </pre>
        </div>
      )}
      {successTexts.length > 0 && (
        <div className="border border-green-700 mt-2 p-2">
          <pre>
            {successTexts.map((screen, i) => (
              <span key={i}>{screen.text}</span>
            ))}
          </pre>
        </div>
      )}
    </div>
  );
}
