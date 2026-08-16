import type { Sentiment } from "../services/types";

const COLORS: Record<Sentiment, string> = {
  positivo: "#10b981",
  negativo: "#ef4444",
  neutral: "#f59e0b",
};

export function getSentimentColor(s: string): string {
  return COLORS[s as Sentiment] || "#8b5cf6";
}
