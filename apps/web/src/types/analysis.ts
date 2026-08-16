import type { AnalyzedItem, ProductoDetectado, SesionStats } from "../services/types";

// El backend/servicios usan formas bastante libres (varios alias de campo
// por compatibilidad histórica: positivosEnSesion/conteoPositivos/etc en
// productosDetectados) — se modela lo esencial y se deja lugar a campos
// extra sin forzar un contrato más estricto del que el propio backend da.

export interface SingleAnalysisResult {
  isBatch?: false;
  text: string;
  sentiment: string;
  score: number;
}

export interface BatchAnalysisResult {
  isBatch: true;
  totalAnalyzed: number;
  sessionSaved?: boolean;
  sessionId?: number;
  isHistorical?: boolean;
  items: AnalyzedItem[];
  stats?: SesionStats;
  productosDetectados?: ProductoDetectado[];
}

export type AnalysisResults = SingleAnalysisResult | BatchAnalysisResult;

export interface StatItem {
  name: string;
  value: number;
  color: string;
  percentage: string;
}

export interface CsvEntrada {
  texto: string;
  producto?: string;
  categoria?: string;
}

export interface AppUser {
  id?: number;
  email: string;
  name: string;
  token?: string;
}
