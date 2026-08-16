import { API_ENDPOINTS } from "../config/api";
import type { AnalyzedItem, ProductoDetectado, Sentiment } from "./types";

// Los mismos métodos públicos que el sentimentService original (App.jsx y
// HistoryView.jsx los llaman sin cambios), pero por dentro hablan JSON con
// el backend nuevo en vez de "Content-Type: text/plain" con el texto crudo
// como body — ese era el contrato del backend Java viejo.
function normalizeSentiment(prevision: string): Sentiment {
  const s = prevision?.toLowerCase().trim();
  if (s === "positivo" || s === "positive") return "positivo";
  if (s === "negativo" || s === "negative") return "negativo";
  return "neutral";
}

async function parseErrorOrThrow(response: Response, fallback: string): Promise<never> {
  const errorData = await response.json().catch(() => ({}));
  if (response.status === 401) throw new Error(errorData.message || "No autorizado. Iniciá sesión nuevamente.");
  if (response.status === 502) throw new Error("El servidor de IA no está disponible");
  throw new Error(errorData.message || fallback);
}

export const sentimentService = {
  async analyzeSingle(text: string) {
    const response = await fetch(API_ENDPOINTS.ANALYZE_SINGLE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: text }),
    });

    if (!response.ok) await parseErrorOrThrow(response, "Error al analizar el texto");

    const data = await response.json();
    return { text, sentiment: normalizeSentiment(data.prevision), score: data.probabilidad };
  },

  async analyzeBatch(text: string) {
    const textos = text.split("\n").filter((t) => t.trim());

    const response = await fetch(API_ENDPOINTS.ANALYZE_BATCH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textos }),
    });

    if (!response.ok) await parseErrorOrThrow(response, "Error al analizar los textos");

    const data = await response.json();

    return {
      isBatch: true as const,
      totalAnalyzed: data.results.length,
      items: data.results.map(
        (result: { prevision: string; probabilidad: number }, index: number): AnalyzedItem => ({
          text: textos[index] || "",
          sentiment: normalizeSentiment(result.prevision),
          score: result.probabilidad,
        })
      ),
    };
  },

  async analyzeWithMultipleProducts(textos: string[], token: string, productoIds: number[]) {
    const response = await fetch(API_ENDPOINTS.ANALYZE_MULTI_PRODUCTS, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ comentarios: textos, productosIds: productoIds }),
    });

    if (!response.ok) await parseErrorOrThrow(response, "Error en el análisis multiproducto");

    const data = await response.json();

    return {
      total: data.total ?? textos.length,
      sessionId: data.sessionId,
      comentarios: (data.comentarios || []).map(
        (r: { texto: string; sentimiento: string; probabilidad: number; productoAsociado?: string }): AnalyzedItem => ({
          text: r.texto,
          sentiment: normalizeSentiment(r.sentimiento),
          score: r.probabilidad || 0,
          productoAsociado: r.productoAsociado || null,
        })
      ),
      avgScore: data.avgScore || 0,
      positivos: data.positivos || 0,
      negativos: data.negativos || 0,
      neutrales: data.neutrales || 0,
      productosDetectados: (data.productosDetectados || []) as ProductoDetectado[],
    };
  },

  async analyzeCsvBatch(entradas: { texto: string; producto?: string; categoria?: string }[], token: string) {
    const response = await fetch(API_ENDPOINTS.ANALYZE_CSV_BATCH, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ entradas }),
    });

    if (!response.ok) await parseErrorOrThrow(response, "Error en el análisis batch CSV");

    const data = await response.json();

    return {
      isBatch: true as const,
      totalAnalyzed: data.total ?? entradas.length,
      sessionSaved: true,
      sessionId: data.sessionId,
      items: (data.comentarios || []).map(
        (r: { texto: string; sentimiento: string; probabilidad: number; productoAsociado?: string }): AnalyzedItem => ({
          text: r.texto,
          sentiment: normalizeSentiment(r.sentimiento),
          score: r.probabilidad || 0,
          productoAsociado: r.productoAsociado || null,
        })
      ),
      stats: {
        avgScore: data.avgScore || 0,
        positivos: data.positivos || 0,
        negativos: data.negativos || 0,
        neutrales: data.neutrales || 0,
      },
      productosDetectados: (data.productosDetectados || []) as ProductoDetectado[],
    };
  },

  async analyzeAndSave(comentarios: string[], token: string) {
    const response = await fetch(API_ENDPOINTS.ANALYZE_AND_SAVE, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ comentarios }),
    });

    if (!response.ok) await parseErrorOrThrow(response, "Error al analizar y guardar los comentarios");

    const data = await response.json();

    return {
      sessionId: data.sessionId,
      date: data.date,
      avgScore: data.avgScore,
      total: data.total,
      positivos: data.positivos,
      negativos: data.negativos,
      neutrales: data.neutrales,
      comentarios: (data.comentarios || []).map((c: { texto: string; sentimiento: string; probabilidad: number }) => ({
        text: c.texto,
        sentiment: c.sentimiento.toLowerCase(),
        score: c.probabilidad,
      })),
      productosDetectados: (data.productosDetectados || []) as ProductoDetectado[],
    };
  },

  // El backend pagina /sesion/historial (ver apps/api). Por ahora se pide
  // el máximo de una página (100) para preservar el comportamiento previo
  // de "mostrar todo el historial"; una futura UI de paginación puede
  // exponer page/pageSize en vez de pageSize fijo.
  async getHistory(token: string, page = 1, pageSize = 100) {
    const response = await fetch(`${API_ENDPOINTS.GET_HISTORY}?page=${page}&pageSize=${pageSize}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) await parseErrorOrThrow(response, "Error al obtener historial");

    const paginated = await response.json();
    return paginated.data;
  },
};
