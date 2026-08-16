import { env } from "../config/env.js";
import { UpstreamMLError } from "../errors/AppError.js";

// Cliente al microservicio Python (services/ml). Contrato congelado,
// verificado directamente contra services/ml/main.py:
//   POST /predict       {text}       -> {prevision, probabilidad, review_required}
//   POST /predict/batch  {texts[]}    -> {results: PredictResponse[]}
export type Sentimiento = "Positivo" | "Neutro" | "Negativo";

export interface PredictResponse {
  prevision: Sentimiento;
  probabilidad: number;
  review_required: boolean;
}

const TIMEOUT_MS = 10_000;

async function callMlApi<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${env.ML_API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new UpstreamMLError();
  }

  if (!response.ok) {
    throw new UpstreamMLError();
  }

  return (await response.json()) as T;
}

export const mlClient = {
  predict(text: string): Promise<PredictResponse> {
    return callMlApi<PredictResponse>("/predict", { text });
  },
  predictBatch(texts: string[]): Promise<{ results: PredictResponse[] }> {
    return callMlApi<{ results: PredictResponse[] }>("/predict/batch", { texts });
  },
};
