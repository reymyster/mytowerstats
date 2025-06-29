import {
  Fragment,
  useMemo,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import { Form, useSubmit } from "react-router";
import { createWorker, type RecognizeResult } from "tesseract.js";
import { formatRelative } from "date-fns";

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

import {
  sectionNames,
  allLabelsToKeys,
  configsBySection,
  type KeysBySection,
} from "~/lib/runs/all-labels-map";
import { getDefaultFieldValue, type FieldValue } from "~/lib/runs/field-values";
import { sortedLabels } from "~/lib/runs/sorted-labels";
import { camelCaseToLabel } from "~/lib/utils";
import type { FieldConfig } from "~/lib/runs/helpers";
import type { Doc } from "convex/_generated/dataModel";

interface ScreenData {
  file: File;
  originalName: string;
  lastModified: number;
  url: string;
  size: number;
  text?: string;
  error?: string;
}

interface MetaValues {
  recorded: number;
  runType: string;
}

interface RunInfoProps {
  data?: {
    header: Doc<"runs">;
    values: Doc<"runValues">;
    screens: (Doc<"runScreens"> & { url: string | null })[];
  };
}

export function RunInfo({ data }: RunInfoProps) {
  const editing = Boolean(data);
  const defaultFieldValues = useMemo(
    () => getDefaultFieldValue(data?.values),
    [data]
  );
  const [meta, setMeta] = useState<MetaValues>({
    recorded: data?.header?.recorded ?? 0,
    runType: data?.header?.runType ?? "farming",
  });
  const [currentSection, setSection] = useState<string>("meta");
  const [screens, setScreens] = useState<ScreenData[]>(
    data?.screens?.map(
      (s) =>
        ({
          originalName: s.filename,
          lastModified: s.lastModified,
          url: s.url,
          size: s.size,
        } as ScreenData)
    ) ?? []
  );
  const [progress, setProgress] = useState<number>(0);
  const [fieldValues, setFieldValues] =
    useState<FieldValue>(defaultFieldValues);
  const submit = useSubmit();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();

    for (let i = 0; i < sectionNames.length; i++) {
      const sectionName = sectionNames[i];
      const sectionKeys = Object.values(allLabelsToKeys)
        .filter((v) => v.section === sectionName)
        .map((v) => v.key);

      const configsByKey = configsBySection[sectionName] as Record<
        string,
        FieldConfig
      >;

      for (let j = 0; j < sectionKeys.length; j++) {
        const key = sectionKeys[j];
        const config = configsByKey[key];

        const value = fieldValues[sectionName][key];

        if (!value) {
          setSection(sectionName);
          alert(`${camelCaseToLabel(key)} cannot be blank.`);
          return;
        }

        if (!config.validate(value)) {
          setSection(sectionName);
          alert(`Invalid value for ${camelCaseToLabel(key)}`);
          return;
        }
      }
    }

    formData.append("meta", JSON.stringify(meta));
    formData.append("fieldValues", JSON.stringify(fieldValues));

    if (!editing) {
      screens.forEach((screen) => {
        formData.append("screenshots", screen.file, screen.originalName);
      });

      const fileInfo = screens.map(
        ({ originalName: filename, size, lastModified }) => ({
          filename,
          size,
          lastModified,
        })
      );
      formData.append("fileInfo", JSON.stringify(fileInfo));
    }

    submit(formData, { method: "POST", encType: "multipart/form-data" });
  }

  function getValueByKey({
    section,
    key,
  }: {
    section: string;
    key: string;
  }): string {
    return fieldValues[section][key];
  }

  function setValueByKey(k: { section: string; key: string }, v: string) {
    setFieldValues((prev) => ({
      ...prev,
      [k.section]: {
        ...prev[k.section],
        [k.key]: v,
      },
    }));
  }

  async function onFilesChanged(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || editing) return;

    const inputFiles = Array.from(e.target.files);

    if (!inputFiles.length) return;

    const processedScreens = await Promise.all(
      inputFiles.map(async (origFile) => {
        const blob = await preprocessImage(origFile, /* quality */ 0.45);

        const processedFile = new File([blob], origFile.name, {
          type: blob.type,
          lastModified: origFile.lastModified,
        });

        return {
          file: processedFile,
          originalName: origFile.name,
          lastModified: origFile.lastModified,
          url: URL.createObjectURL(processedFile),
          size: processedFile.size,
        };
      })
    );

    processedScreens.sort((a, b) => a.lastModified - b.lastModified);

    const fiveMinutes = 1000 * 60 * 5;
    if (
      processedScreens[processedScreens.length - 1].lastModified -
        processedScreens[0].lastModified >
      fiveMinutes
    ) {
      alert(
        "Warning, first and last screenshots are more than 5 minutes apart!"
      );
    }

    setScreens(processedScreens);
  }

  async function runOCR() {
    let completedScreens = 0;

    const worker = await createWorker("eng", undefined, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          if (completedScreens === screens.length) {
            setProgress(100);
            return;
          }

          const progress = Math.round(
            ((completedScreens + m.progress) / screens.length) * 100
          );
          setProgress(progress);
        }
      },
    });

    const results = await Promise.all(
      screens.map(async (screen) => {
        try {
          const {
            data: { text },
          }: RecognizeResult = await worker.recognize(screen.url);
          completedScreens++;
          return { ...screen, text };
        } catch (e: any) {
          return { ...screen, error: e.message || "OCR failed" };
        }
      })
    );

    await worker.terminate();
    const resultText = results
      .filter((s) => Boolean(s.text))
      .map((s) => s.text ?? "")
      .join("\n");
    processText(resultText);
    setScreens(results);
    setMeta((prev) => ({ ...prev, recorded: results[0].file.lastModified }));
  }

  function processText(text: string) {
    const lines = text.split("\n");

    lines.forEach((line) => {
      const label = sortedLabels.find((l) => line.startsWith(`${l} `));

      if (!label) return;

      const key = allLabelsToKeys[label];
      const value = line.replace(`${label} `, "");
      setValueByKey(key, value);
    });
  }

  return (
    <div>
      <div className="flex flex-row gap-2 lg:gap-4 items-center p-2 lg:p-4">
        <Form className="w-full flex flex-row gap-4" method="POST">
          {!editing && (
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={onFilesChanged}
              disabled={screens.length > 0}
            />
          )}
          {screens.length > 0 && (
            <Fragment>
              <Button
                type="button"
                disabled={progress > 0 && progress < 100}
                onClick={runOCR}
              >
                Process {screens.length} Files
              </Button>
              <input
                type="hidden"
                name="fieldValues"
                value={JSON.stringify(fieldValues)}
              />
              <Button type="button" onClick={onSubmit}>
                Save
              </Button>
            </Fragment>
          )}
        </Form>
      </div>
      {progress > 0 && progress < 100 && (
        <Progress value={progress} className="mb-2" />
      )}
      <div className="grid grid-cols-1 gap-2 2xl:grid-cols-[2fr_1fr]">
        {screens.length > 0 && (
          <Tabs defaultValue="0" className="w-full">
            <TabsList
              className="grid w-full grid-cols-(--file-count)"
              style={
                {
                  "--file-count": `repeat(${screens.length}, minmax(0, 1fr))`,
                } as CSSProperties
              }
            >
              {screens.map((s, i) => (
                <TabsTrigger key={i} value={`${i}`}>
                  {s.originalName}
                </TabsTrigger>
              ))}
            </TabsList>
            {screens.map((s, i) => (
              <TabsContent key={i} value={`${i}`}>
                <Card>
                  <CardHeader>{s.originalName}</CardHeader>
                  <CardContent className="overflow-y-auto max-h-[75svh]">
                    <img
                      src={s.url}
                      alt={s.originalName}
                      className="max-w-full"
                      loading="lazy"
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}
        <Tabs className="w-full" value={currentSection}>
          <TabsList
            className="grid w-full grid-cols-(--section-count)"
            style={
              {
                "--section-count": `repeat(${
                  sectionNames.length + 1
                }, minmax(0, 1fr))`,
              } as CSSProperties
            }
          >
            <TabsTrigger value="meta" onClick={() => setSection("meta")}>
              Meta
            </TabsTrigger>
            {sectionNames.map((s) => (
              <TabsTrigger key={s} value={s} onClick={() => setSection(s)}>
                {camelCaseToLabel(s)}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="meta">
            <Card>
              <CardHeader>Meta</CardHeader>
              <CardContent className="flex flex-col gap-6 overflow-y-auto max-h-[75svh]">
                <div className="flex flex-col gap-2">
                  <Label>Recorded</Label>
                  <Input
                    type="text"
                    readOnly={true}
                    value={
                      meta.recorded
                        ? formatRelative(new Date(meta.recorded), new Date())
                        : ""
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Run Type</Label>
                  <RadioGroup
                    defaultValue={meta.runType}
                    onValueChange={(e) =>
                      setMeta((prev) => ({ ...prev, runType: e }))
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
              </CardContent>
            </Card>
          </TabsContent>
          {sectionNames.map((section) => (
            <TabsContent value={section} key={section}>
              <Card>
                <CardHeader>{camelCaseToLabel(section)}</CardHeader>
                <CardContent className="flex flex-col gap-6 overflow-y-auto max-h-[75svh]">
                  {Object.values(allLabelsToKeys)
                    .filter((v) => v.section === section)
                    .map((value) => (
                      <div key={value.key} className="flex flex-col gap-2">
                        <Label>{camelCaseToLabel(value.key)}</Label>
                        <Input
                          className="font-mono"
                          type="text"
                          value={getValueByKey({ section, key: value.key })}
                          onChange={(e) =>
                            setValueByKey(
                              { section, key: value.key },
                              e.target.value
                            )
                          }
                        />
                      </div>
                    ))}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
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
