import {
  Fragment,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import { Form, useSubmit } from "react-router";

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
import { defaultFieldValues, type FieldValue } from "~/lib/runs/field-values";
import { camelCaseToLabel } from "~/lib/utils";

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

export function RunInfo() {
  const [meta, setMeta] = useState<MetaValues>({
    recorded: 0,
    runType: "farming",
  });
  const [screens, setScreens] = useState<ScreenData[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [fieldValues, setFieldValues] =
    useState<FieldValue>(defaultFieldValues);
  const submit = useSubmit();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();

    formData.append("meta", JSON.stringify(meta));
    formData.append("fieldValues", JSON.stringify(fieldValues));

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

    submit(formData, { method: "POST" });
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
    if (!e.target.files) return;

    const inputFiles = Array.from(e.target.files);

    const processedScreens = await Promise.all(
      inputFiles.map(async (origFile) => {
        const blob = await preprocessImage(origFile, /* quality */ 0.4);

        const processedFile = new File([blob], origFile.name, {
          type: blob.type,
          lastModified: origFile.lastModified,
        });
        console.log({
          filename: origFile.name,
          originalSize: origFile.size,
          compressedSize: processedFile.size,
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

  return (
    <div>
      <div className="flex flex-row gap-2 lg:gap-4 items-center p-2 lg:p-4">
        <Form className="w-full flex flex-row gap-4" method="POST">
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={onFilesChanged}
          />
          {screens.length > 0 && (
            <Fragment>
              <Button type="button" disabled={progress > 0 && progress < 100}>
                Process {screens.length} Files
              </Button>
              <input
                type="hidden"
                name="fieldValues"
                value={JSON.stringify(fieldValues)}
              />
              <Button type="submit">Save</Button>
            </Fragment>
          )}
        </Form>
      </div>
      {progress > 0 && progress < 100 && <Progress value={progress} />}
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
                  {s.file.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {screens.map((s, i) => (
              <TabsContent key={i} value={`${i}`}>
                <Card>
                  <CardHeader>{s.file.name}</CardHeader>
                  <CardContent className="overflow-y-auto max-h-[85svh]">
                    <img src={s.url} alt={s.file.name} className="max-w-full" />
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}
        <Tabs defaultValue="meta" className="w-full">
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
            <TabsTrigger value="meta">Meta</TabsTrigger>
            {sectionNames.map((s) => (
              <TabsTrigger key={s} value={s}>
                {camelCaseToLabel(s)}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="meta">
            <Card>
              <CardHeader>Meta</CardHeader>
              <CardContent className="flex flex-col gap-6"></CardContent>
            </Card>
          </TabsContent>
          {sectionNames.map((section) => (
            <TabsContent value={section} key={section}>
              <Card>
                <CardHeader>{camelCaseToLabel(section)}</CardHeader>
                <CardContent className="flex flex-col gap-6">
                  {Object.values(allLabelsToKeys)
                    .filter((v) => v.section === section)
                    .map((value) => (
                      <div key={value.key} className="flex flex-col gap-2">
                        <Label>{camelCaseToLabel(value.key)}</Label>
                        <Input
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
