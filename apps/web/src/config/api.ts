const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/project/api/v2";

export const API_ENDPOINTS = {
  // Autenticación
  REGISTER: `${API_BASE_URL}/usuario`,
  LOGIN: `${API_BASE_URL}/usuario/login`,
  FORGOT_PASSWORD: `${API_BASE_URL}/usuario/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/usuario/reset-password`,

  // Análisis de Sentimientos
  ANALYZE_SINGLE: `${API_BASE_URL}/sentiment/analyze`,
  ANALYZE_BATCH: `${API_BASE_URL}/sentiment/analyze/batch`,

  // Sesiones
  ANALYZE_AND_SAVE: `${API_BASE_URL}/sesion/analizar`,
  ANALYZE_CSV_BATCH: `${API_BASE_URL}/sesion/analizar-csv-batch`,
  ANALYZE_MULTI_PRODUCTS: `${API_BASE_URL}/sesion/analizar-con-lista-productos`,
  GET_SESSIONS: `${API_BASE_URL}/sesion`,
  GET_HISTORY: `${API_BASE_URL}/sesion/historial`,

  // Categorías y Productos
  CATEGORIAS: `${API_BASE_URL}/categoria`,
  PRODUCTOS: `${API_BASE_URL}/producto`,
  PRODUCTOS_POR_CATEGORIA: `${API_BASE_URL}/producto/por-categoria`,
} as const;

export default API_BASE_URL;
