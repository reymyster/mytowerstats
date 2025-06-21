import { camelCaseToLabel } from "../utils";

export type FieldConfig = {
  readonly label: string;
  readonly validate: (raw: string) => boolean;
  readonly parse: (raw: string) => number;
};

const reLargeNumber =
  /^\s*\$?(\d+(?:\.\d+)?)\s*([KMBTqQsSOND]|aa|ab|ac|ad)?\s*$/;

export function validateLargeNumber(raw: string): boolean {
  return reLargeNumber.test(raw);
}

export function parseLargeNumber(raw: string): number {
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
    D: 1e33,
    aa: 1e36,
    ab: 1e39,
    ac: 1e42,
    ad: 1e45,
  };

  const match = raw.match(reLargeNumber);
  if (!match) return NaN;

  const num = parseFloat(match[1].replace(/,/g, ""));
  const suffix = match[2];
  const multiplier = suffixMultipliers[suffix] ?? 1;

  return num * multiplier;
}

export function defaultLargeNumberConfig(key: string): FieldConfig {
  const label = camelCaseToLabel(key);
  return {
    label,
    validate: validateLargeNumber,
    parse: parseLargeNumber,
  };
}

export function defaultIntegerConfig(key: string): FieldConfig {
  const label = camelCaseToLabel(key);
  return {
    label,
    validate(raw) {
      return /^\s*\d+\s*$/.test(raw);
    },
    parse(raw) {
      return parseInt(raw.trim(), 10);
    },
  };
}

const reIntegerPlus = /^\s*(\d+)([+])?\s*$/;
export function defaultIntegerPlusConfig(key: string): FieldConfig {
  const label = camelCaseToLabel(key);
  return {
    label,
    validate(raw) {
      return reIntegerPlus.test(raw);
    },
    parse(raw) {
      const match = raw.match(reIntegerPlus);
      if (!match) return NaN;

      const num = parseInt(match[1], 10);
      const suffix = Boolean(match[2]) ? 0.5 : 0;

      return num + suffix;
    },
  };
}

export function defaultStringConfig(key: string): FieldConfig {
  const label = camelCaseToLabel(key);
  return {
    label,
    validate(raw) {
      return typeof raw === "string" && raw.trim().length > 0;
    },
    parse(raw) {
      return NaN;
    },
  };
}

export function parseTimeToSeconds(input: string): number {
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

export function defaultTimespanConfig(key: string): FieldConfig {
  const label = camelCaseToLabel(key);
  return {
    label,
    validate(raw) {
      return /^\s*((\d)+[dhms]?\s?)+$/.test(raw);
    },
    parse: parseTimeToSeconds,
  };
}
