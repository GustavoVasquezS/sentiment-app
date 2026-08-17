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

// 60s en vez de un timeout corto: en producción services/ml corre en el
// plan Free de Render, que se duerme tras 15 min de inactividad y puede
// tardar hasta ~60s en despertar en el primer request (verificado: 41s en
// el deploy real). Un timeout corto reportaba "servicio no disponible"
// incluso cuando el servicio simplemente estaba despertando.
const TIMEOUT_MS = 60_000;

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
