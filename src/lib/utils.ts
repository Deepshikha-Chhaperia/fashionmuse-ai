import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const downloadImage = (url: string, filename: string) => {
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
};
