import { vi } from "vitest";
import { mlClient, type PredictResponse } from "../../src/clients/ml.client.js";

// Clasificación determinística por palabras clave, para no depender del
// microservicio Python real en tests de integración de sesion/csv — solo
// necesitamos que el contrato {prevision, probabilidad, review_required}
// se comporte de forma predecible, no que el modelo sea preciso.
export function classify(text: string): PredictResponse {
  const lower = text.toLowerCase();
  if (lower.includes("malo") || lower.includes("pesimo") || lower.includes("pésimo") || lower.includes("terrible")) {
    return { prevision: "Negativo", probabilidad: 0.9, review_required: false };
  }
  if (lower.includes("bueno") || lower.includes("excelente") || lower.includes("genial")) {
    return { prevision: "Positivo", probabilidad: 0.9, review_required: false };
  }
  return { prevision: "Neutro", probabilidad: 0.5, review_required: true };
}

// mlClient es un singleton (objeto plano exportado por ml.client.ts) — al
// espiar sus métodos acá, se intercepta también a los servicios que lo
// importan (sentiment.service.ts y, a través suyo, sesion/csv), sin
// necesidad de vi.mock ni sus reglas de hoisting.
export function mockMlClient() {
  vi.spyOn(mlClient, "predict").mockImplementation(async (text: string) => classify(text));
  vi.spyOn(mlClient, "predictBatch").mockImplementation(async (texts: string[]) => ({ results: texts.map(classify) }));
}

export function restoreMlClient() {
  vi.restoreAllMocks();
}
