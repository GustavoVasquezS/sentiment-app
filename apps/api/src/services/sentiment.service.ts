import { mlClient, type PredictResponse } from "../clients/ml.client.js";

// Capa fina sobre el cliente ML — existe como service (y no llamar al
// cliente directo desde el controller) para poder mockearla fácil en tests
// de sentiment/sesion/csv sin pegarle al microservicio real.
export const sentimentService = {
  analizarTexto(texto: string): Promise<PredictResponse> {
    return mlClient.predict(texto);
  },

  analizarTextos(textos: string[]): Promise<PredictResponse[]> {
    return mlClient.predictBatch(textos).then((r) => r.results);
  },
};
