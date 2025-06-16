import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Turn camelCase to Title Case with Spaces
 */
export function camelCaseToLabel(camel: string): string {
  const withSpaces = camel
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2") // insert space before capitals
    .replace(/([a-zA-Z])([0-9])/g, "$1 $2"); // insert space letter→digit
  if (withSpaces.startsWith("hp ")) return "HP" + withSpaces.slice(2);
  if (withSpaces.startsWith("coins From "))
    return "Coins from " + withSpaces.slice(11);
  if (withSpaces.startsWith("cash From "))
    return "Cash from " + withSpaces.slice(10);
  if (withSpaces.startsWith("destroyed By "))
    return "Destroyed by " + withSpaces.slice(13);
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}
