export type Sentiment = "positivo" | "negativo" | "neutral";

export interface AuthUser {
  id: number;
  correo: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  token: string;
}

export interface RegisterInput {
  nombre: string;
  apellido: string;
  correo: string;
  contraseña: string;
}

export interface AnalyzedItem {
  text: string;
  sentiment: Sentiment;
  score: number;
  productoAsociado?: string | null;
}

export interface ProductoDetectado {
  nombreProducto: string;
  totalMencionesEnSesion: number;
  positivosEnSesion: number;
  negativosEnSesion: number;
  neutralesEnSesion: number;
  porcentajeMenciones: number;
}

export interface SesionStats {
  avgScore: number;
  positivos: number;
  negativos: number;
  neutrales: number;
}
