export type RoundStats = {
  recorded: number;
  runType: "farming" | "milestone" | "tournament";
  battleReport?: {
    gameTimeText?: string;
    gameTime?: number;
    realTimeText?: string;
    realTime?: number;
    realTimeHours?: number;
    tierText?: string;
    tier?: number;
    waveText?: string;
    wave?: number;
    coinsEarnedText?: string;
    coinsEarned?: number;
    cashEarnedText?: string;
    cashEarned?: number;
    cellsEarnedText?: string;
    cellsEarned?: number;
    rerollShardsEarnedText?: string;
    rerollShardsEarned?: number;
    coinsPerHour?: number;
    cellsPerHour?: number;
    rerollShardsPerHour?: number;
  };
};

function extractValueGenerator(lines: string[]) {
  return (label: string): string | undefined => {
    if (!label || !lines || !lines.length) return undefined;

    const lbl = `${label} `;
    const line = lines.find((line) => line.startsWith(lbl));
    if (!line) return undefined;
    return line.replace(lbl, "");
  };
}

const statSections = ["Battle Report", "Combat"];

export function textToStats(text: string): RoundStats {
  const lines = text.split("\n");
  const sections = statSections.map((section) => {
    const sectionIndex = lines.findIndex((line) => line === section);
    return {
      section,
      sectionIndex,
    };
  });
  let parsed: RoundStats = { recorded: Date.now(), runType: "farming" };
  if (
    sections[0].sectionIndex > 0 &&
    sections[1].sectionIndex > sections[0].sectionIndex
  ) {
    // Battle Report
    const battleReportLines = lines.slice(
      sections[0].sectionIndex + 1,
      sections[1].sectionIndex
    );
    const extractValue = extractValueGenerator(battleReportLines);
    parsed = {
      ...parsed,
      battleReport: {
        gameTimeText: extractValue("Game Time"),
        realTimeText: extractValue("Real Time"),
        tierText: extractValue("Tier"),
        waveText: extractValue("Wave"),
        coinsEarnedText: extractValue("Coins Earned"),
        cashEarnedText: extractValue("Cash Earned"),
        cellsEarnedText: extractValue("Cells Earned"),
        rerollShardsEarnedText: extractValue("Reroll Shards Earned"),
      },
    };
  }
  return parsed;
}

function parseTimeToSeconds(input: string | undefined): number | undefined {
  if (!input) return undefined;

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

function formatSecondsToDuration(seconds: number): string {
  const units = [
    { label: "d", value: 86400 },
    { label: "h", value: 3600 },
    { label: "m", value: 60 },
    { label: "s", value: 1 },
  ];

  const parts: string[] = [];

  for (const { label, value } of units) {
    const amount = Math.floor(seconds / value);
    if (amount > 0 || parts.length > 0 || label === "s") {
      parts.push(`${amount}${label}`);
      seconds %= value;
    }
  }

  return parts.join(" ");
}

function parseAbbreviatedNumber(input: string | undefined): number | undefined {
  if (typeof input === "undefined" || input.length === 0) return undefined;

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

export function abbreviateNumber(num: number, decimals = 2): string {
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

function parseInteger(input: string | undefined): number | undefined {
  if (typeof input === "undefined" || input.length === 0) return undefined;

  const n = parseInt(input, 10);
  if (isNaN(n)) return undefined;

  return n;
}

export function calcStats(input: RoundStats): RoundStats {
  let { battleReport, ...rest } = input;

  if (battleReport) {
    const {
      gameTimeText,
      realTimeText,
      tierText,
      waveText,
      coinsEarnedText,
      cashEarnedText,
      cellsEarnedText,
      rerollShardsEarnedText,
    } = battleReport;

    const gameTime = parseTimeToSeconds(gameTimeText);
    const realTime = parseTimeToSeconds(realTimeText);
    const realTimeHours = realTime ? realTime / (60 * 60) : undefined;
    const tier = parseInteger(tierText);
    const wave = parseInteger(waveText);
    const coinsEarned = parseAbbreviatedNumber(coinsEarnedText);
    const cashEarned = parseAbbreviatedNumber(cashEarnedText);
    const cellsEarned = parseAbbreviatedNumber(cellsEarnedText);
    const rerollShardsEarned = parseAbbreviatedNumber(rerollShardsEarnedText);

    const coinsPerHour =
      coinsEarned && realTimeHours ? coinsEarned / realTimeHours : undefined;
    const cellsPerHour =
      cellsEarned && realTimeHours ? cellsEarned / realTimeHours : undefined;
    const rerollShardsPerHour =
      rerollShardsEarned && realTimeHours
        ? rerollShardsEarned / realTimeHours
        : undefined;

    battleReport = {
      ...battleReport,
      gameTime,
      realTime,
      realTimeHours,
      tier,
      wave,
      coinsEarned,
      cashEarned,
      cellsEarned,
      rerollShardsEarned,
      coinsPerHour,
      cellsPerHour,
      rerollShardsPerHour,
    };
  }

  return { ...rest, battleReport };
}
