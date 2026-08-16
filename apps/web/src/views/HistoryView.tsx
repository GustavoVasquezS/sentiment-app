import { useState, useEffect } from "react";
import { ArrowLeft, Database, BarChart, Zap, Calendar, TrendingUp, Loader2, AlertCircle, Eye, MessageSquare, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";
import { sentimentService } from "../services/sentimentService";

export interface HistorySession {
  sessionId: number;
  date: string;
  avgScore: number;
  total: number;
  positivos: number;
  negativos: number;
  neutrales: number;
  comentarios?: unknown[];
  productosDetectados?: unknown[];
}

interface ChartDatum {
  name: string;
  Positivo: number;
  Neutral: number;
  Negativo: number;
  totalComentarios: number;
  fecha: string;
}

interface HistoryStats {
  totalSesiones: number;
  totalTextos: number;
  efectividad: number | string;
  ultimaCarga: string;
}

interface HistoryViewProps {
  token: string;
  setCurrentView: (view: string) => void;
  onLoadSession?: (session: HistorySession) => void;
}

const EMPTY_STATS: HistoryStats = { totalSesiones: 0, totalTextos: 0, efectividad: 0, ultimaCarga: "Hoy" };

const MOCK_CHART_DATA: ChartDatum[] = [
  { name: "#1", Positivo: 60, Neutral: 25, Negativo: 15, totalComentarios: 20, fecha: "10/02/2026" },
  { name: "#2", Positivo: 45, Neutral: 30, Negativo: 25, totalComentarios: 30, fecha: "11/02/2026" },
  { name: "#3", Positivo: 70, Neutral: 15, Negativo: 15, totalComentarios: 25, fecha: "12/02/2026" },
  { name: "#4", Positivo: 55, Neutral: 20, Negativo: 25, totalComentarios: 18, fecha: "13/02/2026" },
  { name: "#5", Positivo: 75, Neutral: 15, Negativo: 10, totalComentarios: 22, fecha: "14/02/2026" },
];

function HistoryView({ token, setCurrentView, onLoadSession }: HistoryViewProps) {
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<ChartDatum[]>([]);
  const [rawSessions, setRawSessions] = useState<HistorySession[]>([]);
  const [stats, setStats] = useState<HistoryStats>(EMPTY_STATS);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data: HistorySession[] = await sentimentService.getHistory(token);

      if (data && Array.isArray(data)) {
        processData(data);
      } else {
        setHistoryData([]);
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar el historial.");
    } finally {
      setLoading(false);
    }
  };

  const processData = (data: HistorySession[]) => {
    // Orden cronológico (más antigua primero) para "Ver análisis"
    const chronological = [...data].reverse();
    setRawSessions(chronological);

    const totalSesiones = data.length;
    const totalTextos = data.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const totalPositivos = data.reduce((acc, curr) => acc + (curr.positivos || 0), 0);
    const efectividad = totalTextos > 0 ? ((totalPositivos / totalTextos) * 100).toFixed(1) : 0;

    const hoy = new Date();
    const lastDate = hoy.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });

    setStats({ totalSesiones, totalTextos, efectividad, ultimaCarga: lastDate });

    const chartData: ChartDatum[] = chronological.map((session, index) => {
      const total = session.total || 1;
      const pos = session.positivos || 0;
      const neg = session.negativos || 0;
      const neu = session.neutrales || 0;
      return {
        name: `#${index + 1}`,
        Positivo: parseFloat(((pos / total) * 100).toFixed(1)),
        Neutral: parseFloat(((neu / total) * 100).toFixed(1)),
        Negativo: parseFloat(((neg / total) * 100).toFixed(1)),
        totalComentarios: total,
        fecha: new Date(session.date).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
      };
    });

    setHistoryData(chartData);
  };

  const displayData = historyData.length > 0 ? historyData : MOCK_CHART_DATA;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] p-6">
      {/* Header de Navegación */}
      <div className="max-w-7xl mx-auto mb-8 flex items-center justify-between">
        <button
          onClick={() => setCurrentView("dashboard")}
          className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-lg border border-white/10"
        >
          <ArrowLeft className="w-5 h-5" /> Volver al Dashboard
        </button>
        <h1 className="text-xl font-bold text-white tracking-widest uppercase opacity-80">SentimentAPI History</h1>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Título Principal */}
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <h2 className="text-4xl font-black text-white flex items-center gap-3 mb-2">
            <TrendingUp className="w-10 h-10 text-cyan-400" />
            Trayectoria Evolutiva
          </h2>
          <p className="text-purple-300 text-lg">Análisis de tendencias temporales y volumen histórico de trabajo.</p>
        </div>

        {/* Tarjetas de Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#2d1b4e]/40 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-6 hover:bg-[#2d1b4e]/60 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-500/20 rounded-2xl group-hover:scale-110 transition-transform">
                <Database className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">Sesiones Totales</span>
            </div>
            <p className="text-4xl font-black text-white mb-1">{stats.totalSesiones}</p>
            <p className="text-sm text-purple-400">Registros en BD</p>
          </div>

          <div className="bg-[#2d1b4e]/40 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-6 hover:bg-[#2d1b4e]/60 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-500/20 rounded-2xl group-hover:scale-110 transition-transform">
                <BarChart className="w-6 h-6 text-indigo-400" />
              </div>
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Total Análisis</span>
            </div>
            <p className="text-4xl font-black text-white mb-1">{stats.totalTextos}</p>
            <p className="text-sm text-indigo-400">Textos procesados</p>
          </div>

          <div className="bg-[#2d1b4e]/40 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-6 hover:bg-[#2d1b4e]/60 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-cyan-500/20 rounded-2xl group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-cyan-400" />
              </div>
              <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">Efectividad Positiva</span>
            </div>
            <p className="text-4xl font-black text-white mb-1">{stats.efectividad}%</p>
            <p className="text-sm text-cyan-400">Satisfacción global</p>
          </div>

          <div className="bg-[#2d1b4e]/40 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-6 hover:bg-[#2d1b4e]/60 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-500/20 rounded-2xl group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Última Revisión</span>
            </div>
            <p className="text-4xl font-black text-white mb-1">{stats.ultimaCarga}</p>
            <p className="text-sm text-emerald-400">Actualización</p>
          </div>
        </div>

        {/* Gráfico Principal */}
        <div className="bg-gradient-to-br from-purple-900/20 to-[#1a0b2e] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Evolución del Sentimiento por Sesión
          </h3>
          <p className="text-purple-400 text-sm mb-6">Porcentaje de comentarios positivos, neutrales y negativos en cada análisis</p>

          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradPositivo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradNeutral" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradNegativo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis
                  stroke="#9ca3af"
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e1b4b", border: "1px solid #6366f1", borderRadius: "12px", color: "#fff" }}
                  formatter={(value, name) => [`${value}%`, name]}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload as ChartDatum | undefined;
                    return item ? `Sesión ${label} — ${item.fecha} (${item.totalComentarios} comentarios)` : label;
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />
                <Area
                  type="monotone"
                  dataKey="Positivo"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#gradPositivo)"
                  dot={{ r: 5, fill: "#1a0b2e", stroke: "#10b981", strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: "#10b981" }}
                  animationDuration={2000}
                />
                <Area
                  type="monotone"
                  dataKey="Neutral"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  fill="url(#gradNeutral)"
                  dot={{ r: 5, fill: "#1a0b2e", stroke: "#f59e0b", strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: "#f59e0b" }}
                  animationDuration={2000}
                />
                <Area
                  type="monotone"
                  dataKey="Negativo"
                  stroke="#ef4444"
                  strokeWidth={3}
                  fill="url(#gradNegativo)"
                  dot={{ r: 5, fill: "#1a0b2e", stroke: "#ef4444", strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: "#ef4444" }}
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {loading && (
          <div className="text-center py-10">
            <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto mb-4" />
            <p className="text-purple-300">Cargando historial detallado...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-400 justify-center py-4 bg-red-400/10 rounded-xl border border-red-400/20">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        {/* Tabla de Sesiones */}
        {!loading && rawSessions.length > 0 && (
          <div className="bg-gradient-to-br from-purple-900/20 to-[#1a0b2e] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-400" />
              Sesiones de Análisis
            </h3>
            <p className="text-purple-400 text-sm mb-6">Haz clic en "Ver análisis" para reabrir los resultados completos de cualquier sesión</p>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-purple-300 text-xs font-bold uppercase tracking-wider py-3 px-4">#</th>
                    <th className="text-left text-purple-300 text-xs font-bold uppercase tracking-wider py-3 px-4">Fecha</th>
                    <th className="text-center text-purple-300 text-xs font-bold uppercase tracking-wider py-3 px-4">Comentarios</th>
                    <th className="text-center text-emerald-300 text-xs font-bold uppercase tracking-wider py-3 px-4">Positivos</th>
                    <th className="text-center text-amber-300 text-xs font-bold uppercase tracking-wider py-3 px-4">Neutrales</th>
                    <th className="text-center text-red-300 text-xs font-bold uppercase tracking-wider py-3 px-4">Negativos</th>
                    <th className="text-center text-purple-300 text-xs font-bold uppercase tracking-wider py-3 px-4">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rawSessions.map((session, index) => {
                    const total = session.total || 0;
                    const safeTotal = total === 0 ? 1 : total;
                    const pctPos = (((session.positivos || 0) / safeTotal) * 100).toFixed(0);
                    const pctNeu = (((session.neutrales || 0) / safeTotal) * 100).toFixed(0);
                    const pctNeg = (((session.negativos || 0) / safeTotal) * 100).toFixed(0);
                    const fecha = new Date(session.date).toLocaleString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <tr key={session.sessionId ?? index} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4">
                          <span className="text-white font-bold">#{index + 1}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-white text-sm">{fecha}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-white font-bold">{total}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">{session.positivos || 0}</span>
                            <span className="text-emerald-400/60 text-xs">({pctPos}%)</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Minus className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-amber-400 font-bold">{session.neutrales || 0}</span>
                            <span className="text-amber-400/60 text-xs">({pctNeu}%)</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <ThumbsDown className="w-3.5 h-3.5 text-red-400" />
                            <span className="text-red-400 font-bold">{session.negativos || 0}</span>
                            <span className="text-red-400/60 text-xs">({pctNeg}%)</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => onLoadSession?.(session)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm rounded-xl transition-all hover:scale-105 shadow-lg"
                          >
                            <Eye className="w-4 h-4" />
                            Ver análisis
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryView;
