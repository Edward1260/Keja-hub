import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type TrustScoreInfo = {
  score: number;
  label: string;
  color: string;
};

export function getTrustScoreInfo(score: number): TrustScoreInfo {
  if (score >= 90) return { score, label: 'Elite', color: 'text-green-500' };
  if (score >= 70) return { score, label: 'Reliable', color: 'text-blue-500' };
  if (score >= 50) return { score, label: 'Average', color: 'text-orange-500' };
  return { score, label: 'Caution', color: 'text-red-500' };
}
