import { useState, useEffect, type ChangeEvent } from "react";
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  Home,
  History,
  LogOut,
  BarChart3,
  FileText,
  ArrowLeft,
  Upload,
  X,
  Package,
  CheckCircle2,
  Grid3x3,
  ChevronRight,
  Plus,
  Loader2,
  Clock,
  Filter,
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { AnalysisResults } from "../types/analysis";
import type { AppUser } from "../types/analysis";
import type { StatItem, CsvEntrada } from "../types/analysis";
import type { Producto } from "./ProductSelectionView";

interface AnalysisViewProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  user: AppUser | null;
  isDemo: boolean;
  handleLogout: () => void;
  isBatchMode: boolean;
  text: string;
  setText: (text: string) => void;
  analyzing: boolean;
  analyzeSentiment: (csvEntradas?: CsvEntrada[] | null) => void;
  results: AnalysisResults | null;
  setResults: (results: AnalysisResults | null) => void;
  getStatistics: () => StatItem[] | null;
  getSentimentColor: (sentiment: string) => string;
  errorMessage: string;
  selectedProducts?: Producto[];
}

// Los productosDetectados llegan con distintos alias de campo según el
// origen (análisis simple con producto, multi-producto, o CSV batch) — se
// mantiene la lectura defensiva del original en vez de forzar un único
// contrato más estricto de lo que el backend realmente garantiza.
interface ProductoStatEntry {
  name: string;
  pctPositivo: number;
  pctNegativo: number;
  pctNeutral: number;
  positivo: number;
  negativo: number;
  neutral: number;
}

function AnalysisView({
  currentView,
  setCurrentView,
  user,
  isDemo,
  handleLogout,
  isBatchMode,
  text,
  setText,
  analyzing,
  analyzeSentiment,
  results,
  setResults,
  getStatistics,
  getSentimentColor,
  errorMessage,
}: AnalysisViewProps) {
  // ==================== WIZARD: NUEVO FLUJO ====================
  // Step 1: Ingresar datos (textarea + CSV con 3 columnas)
  // Step 2: Filtrar categorías/productos extraídos
  // Step 3: Resultados
  const [step, setStep] = useState(1);

  const [csvEntradas, setCsvEntradas] = useState<CsvEntrada[]>([]);
  const [extractedCategories, setExtractedCategories] = useState<string[]>([]);
  const [extractedProducts, setExtractedProducts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedFilterProducts, setSelectedFilterProducts] = useState<Set<string>>(new Set());

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvError, setCsvError] = useState("");
  const [manualText, setManualText] = useState("");

  useEffect(() => {
    if (!isBatchMode || isDemo) {
      setStep(3);
    } else {
      setStep(1);
    }
  }, [isBatchMode, isDemo]);

  // Cuando results cambia (análisis completado o sesión histórica cargada), saltar a step 3
  useEffect(() => {
    if (results && isBatchMode && !isDemo) {
      setStep(3);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]);

  // ==================== CSV PARSER (3 columnas) ====================
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      setCsvError("Solo se permiten archivos .csv");
      return;
    }
    setCsvError("");
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        let textContent: string;
        try {
          textContent = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
        } catch {
          textContent = new TextDecoder("iso-8859-1").decode(buffer);
        }

        const lines = textContent.split(/\r\n|\n/).filter((line) => line.trim());
        if (lines.length === 0) {
          setCsvError("Archivo vacío");
          setCsvFile(null);
          return;
        }

        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
        const textoIndex = headers.indexOf("texto");
        const productoIndex = headers.indexOf("producto");
        const categoriaIndex = headers.indexOf("categoria") !== -1 ? headers.indexOf("categoria") : headers.indexOf("categoría");

        if (textoIndex === -1) {
          setCsvError('Falta columna "texto". Columnas esperadas: texto, producto, categoria');
          setCsvFile(null);
          return;
        }

        const entradas: CsvEntrada[] = [];
        const limit = Math.min(lines.length, 501);

        for (let i = 1; i < limit; i++) {
          const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

          const cleanValue = (val: string | undefined) => {
            if (!val) return "";
            let v = val.trim();
            if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
            v = v.replace(/""/g, '"');
            return v;
          };

          const texto = cleanValue(values[textoIndex]);
          const producto = productoIndex >= 0 ? cleanValue(values[productoIndex]) : "";
          const categoria = categoriaIndex >= 0 ? cleanValue(values[categoriaIndex]) : "";

          if (texto) {
            entradas.push({ texto, producto, categoria });
          }
        }

        if (entradas.length === 0) {
          setCsvError("No hay textos válidos en el CSV");
          setCsvFile(null);
          return;
        }

        setCsvEntradas(entradas);

        const cats = [...new Set(entradas.map((e) => e.categoria).filter((c): c is string => !!c))];
        const prods = [...new Set(entradas.map((e) => e.producto).filter((p): p is string => !!p))];
        setExtractedCategories(cats);
        setExtractedProducts(prods);
        setSelectedCategories(new Set(cats));
        setSelectedFilterProducts(new Set(prods));
        setText(entradas.map((e) => e.texto).join("\n"));
      } catch (error) {
        setCsvError("Error de lectura: " + (error instanceof Error ? error.message : String(error)));
        setCsvFile(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleClearFile = () => {
    setCsvFile(null);
    setCsvEntradas([]);
    setCsvError("");
    setText("");
    setExtractedCategories([]);
    setExtractedProducts([]);
    setSelectedCategories(new Set());
    setSelectedFilterProducts(new Set());
  };

  const handleManualTextAdd = () => {
    if (!manualText.trim()) return;
    const lines = manualText.split("\n").filter((l) => l.trim());
    const newEntradas: CsvEntrada[] = lines.map((line) => ({ texto: line.trim(), producto: "", categoria: "" }));
    const combined = [...csvEntradas, ...newEntradas];
    setCsvEntradas(combined);
    setText(combined.map((e) => e.texto).join("\n"));
    setManualText("");
  };

  const handleGoToFilter = () => {
    if (manualText.trim()) handleManualTextAdd();

    let currentEntradas = csvEntradas;
    if (currentEntradas.length === 0 && text.trim()) {
      currentEntradas = text
        .split("\n")
        .filter((l) => l.trim())
        .map((line) => ({ texto: line.trim(), producto: "", categoria: "" }));
      setCsvEntradas(currentEntradas);
    }

    const cats = [...new Set(currentEntradas.map((e) => e.categoria).filter((c): c is string => !!c))];
    const prods = [...new Set(currentEntradas.map((e) => e.producto).filter((p): p is string => !!p))];

    if (cats.length === 0 && prods.length === 0) {
      handleAnalyze(currentEntradas);
      return;
    }

    setExtractedCategories(cats);
    setExtractedProducts(prods);
    setSelectedCategories(new Set(cats));
    setSelectedFilterProducts(new Set(prods));
    setStep(2);
  };

  const handleAnalyze = (overrideEntradas: CsvEntrada[] | null = null) => {
    const entradas = overrideEntradas || csvEntradas;
    if (entradas.length === 0 && !text.trim()) return;

    let filteredEntradas = entradas;
    if (extractedCategories.length > 0 || extractedProducts.length > 0) {
      filteredEntradas = entradas.filter((e) => {
        if (!e.producto && !e.categoria) return true;
        if (e.categoria && !selectedCategories.has(e.categoria)) return false;
        if (e.producto && !selectedFilterProducts.has(e.producto)) return false;
        return true;
      });
    }

    if (filteredEntradas.length === 0) return;

    setStep(3);

    const hasMetadata = filteredEntradas.some((e) => e.producto || e.categoria);
    if (hasMetadata && user && !isDemo && user.token) {
      analyzeSentiment(filteredEntradas);
    } else {
      setText(filteredEntradas.map((e) => e.texto).join("\n"));
      setTimeout(() => analyzeSentiment(), 100);
    }
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const toggleProduct = (prod: string) => {
    setSelectedFilterProducts((prev) => {
      const next = new Set(prev);
      if (next.has(prod)) next.delete(prod);
      else next.add(prod);
      return next;
    });
  };

  const selectAllCategories = () => setSelectedCategories(new Set(extractedCategories));
  const selectNoneCategories = () => setSelectedCategories(new Set());
  const selectAllProducts = () => setSelectedFilterProducts(new Set(extractedProducts));
  const selectNoneProducts = () => setSelectedFilterProducts(new Set());

  const getFilteredCount = () => {
    if (csvEntradas.length === 0) return 0;
    return csvEntradas.filter((e) => {
      if (!e.producto && !e.categoria) return true;
      if (e.categoria && !selectedCategories.has(e.categoria)) return false;
      if (e.producto && !selectedFilterProducts.has(e.producto)) return false;
      return true;
    }).length;
  };

  // ==================== FUNCIONES DE ANÁLISIS POR PRODUCTO ====================
  const calculateProductStats = (): ProductoStatEntry[] => {
    if (results?.isBatch && results.productosDetectados && results.productosDetectados.length > 0) {
      return results.productosDetectados.map((p) => {
        const raw = p as unknown as Record<string, number | string | undefined>;
        const nombreProducto = (raw.nombreProducto as string) || (raw.producto as string) || (raw.name as string) || "Desconocido";
        const positivos = Number(raw.positivosEnSesion ?? raw.conteoPositivos ?? raw.positivosSesion ?? raw.positivos ?? 0);
        const negativos = Number(raw.negativosEnSesion ?? raw.conteoNegativos ?? raw.negativosSesion ?? raw.negativos ?? 0);
        const neutrales = Number(raw.neutralesEnSesion ?? raw.conteoNeutrales ?? raw.neutralesSesion ?? raw.neutrales ?? 0);
        const total = positivos + negativos + neutrales;
        const safeTotal = total || 1;

        return {
          name: nombreProducto,
          pctPositivo: parseFloat(((positivos / safeTotal) * 100).toFixed(1)),
          pctNegativo: parseFloat(((negativos / safeTotal) * 100).toFixed(1)),
          pctNeutral: parseFloat(((neutrales / safeTotal) * 100).toFixed(1)),
          positivo: positivos,
          negativo: negativos,
          neutral: neutrales,
        };
      });
    }

    if (!results?.isBatch || !results.items) return [];

    const statsMap: Record<string, { name: string; positivo: number; negativo: number; neutral: number; total: number }> = {};
    results.items.forEach((item) => {
      const prodName = item.productoAsociado || "General";
      if (!statsMap[prodName]) {
        statsMap[prodName] = { name: prodName, positivo: 0, negativo: 0, neutral: 0, total: 0 };
      }
      const sent = item.sentiment?.toLowerCase();
      if (sent === "positivo") statsMap[prodName].positivo++;
      else if (sent === "negativo") statsMap[prodName].negativo++;
      else statsMap[prodName].neutral++;
      statsMap[prodName].total++;
    });

    return Object.values(statsMap).map((p) => {
      const safeTotal = p.total || 1;
      return {
        ...p,
        pctPositivo: parseFloat(((p.positivo / safeTotal) * 100).toFixed(1)),
        pctNegativo: parseFloat(((p.negativo / safeTotal) * 100).toFixed(1)),
        pctNeutral: parseFloat(((p.neutral / safeTotal) * 100).toFixed(1)),
      };
    });
  };

  const getPieDataByProduct = () => {
    const productStats = calculateProductStats();
    const result: Record<string, { name: string; value: number; color: string }[]> = {};
    productStats.forEach((prod) => {
      result[prod.name] = [
        { name: "Negativo", value: prod.negativo, color: "#ef4444" },
        { name: "Neutral", value: prod.neutral, color: "#f59e0b" },
        { name: "Positivo", value: prod.positivo, color: "#10b981" },
      ];
    });
    return result;
  };

  const getStackedProductSentimentData = () => {
    const productStats = calculateProductStats();
    return productStats.map((p) => ({
      producto: p.name.length > 15 ? p.name.substring(0, 14) + "…" : p.name,
      productoFull: p.name,
      Positivo: p.positivo,
      Neutral: p.neutral,
      Negativo: p.negativo,
    }));
  };

  const renderDonutLabel = (props: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    name: string;
    value: number;
    percent: number;
  }) => {
    const { cx, cy, midAngle, outerRadius, name, percent } = props;
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 28;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="#e2e8f0" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={12} fontWeight="bold">
        {`${name} ${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  const renderProductBreakdownList = (sentimentType: "positivo" | "negativo" | "neutral") => {
    const productStats = calculateProductStats();
    const filtered = productStats.filter((p) => p[sentimentType] > 0);
    if (filtered.length === 0) return null;

    return (
      <div className="mt-3 pt-3 border-t border-white/10 w-full">
        <p className="text-[10px] text-white/50 uppercase font-bold mb-2">Desglose por Producto</p>
        <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
          {filtered.map((p) => (
            <div key={p.name} className="flex justify-between items-center text-xs">
              <span className="text-white/90 truncate max-w-[120px] font-medium" title={p.name}>
                {p.name}
              </span>
              <span className="font-mono font-bold bg-white/10 px-1.5 rounded text-white">{p[sentimentType]}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ==================== RENDER RESULTADOS ====================
  const renderDetailedResults = () => {
    if (!results) return null;

    if (!results.isBatch) {
      return (
        <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-xl rounded-2xl p-8 border-2 border-cyan-500/30 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <TrendingUp className="w-10 h-10 text-cyan-400" />
              <h3 className="text-3xl font-black text-white">Análisis Completado</h3>
            </div>
            <div className="bg-[#1a0b2e]/50 rounded-2xl p-8 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-cyan-400 font-bold text-lg">TEXTO ANALIZADO</span>
                <span className="text-purple-300 font-semibold">Confianza: {(results.score * 100).toFixed(1)}%</span>
              </div>
              <p className="text-white text-xl mb-6 italic">"{results.text}"</p>
              <div className="flex items-center justify-between bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-6 border border-purple-500/30">
                <div>
                  <p className="text-purple-300 text-sm font-semibold mb-1">SENTIMIENTO</p>
                  <p className="text-4xl font-black uppercase" style={{ color: getSentimentColor(results.sentiment) }}>
                    {results.sentiment}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-purple-300 text-sm font-semibold mb-1">PROBABILIDAD</p>
                  <p className="text-4xl font-black text-white">{(results.score * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const stats = getStatistics();
    if (!stats) return null;
    const pieDataByProduct = getPieDataByProduct();
    const hasProductData = !!(results.productosDetectados && results.productosDetectados.length > 0);
    const stackedData = getStackedProductSentimentData();

    return (
      <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-xl rounded-2xl p-8 border-2 border-cyan-500/30">
          <div className="flex items-center gap-4 mb-6">
            <TrendingUp className="w-10 h-10 text-cyan-400" />
            <h3 className="text-3xl font-black text-white">Análisis Completado</h3>
            {results.isHistorical && (
              <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/30 text-purple-300 text-xs font-bold rounded-full border border-purple-500/30">
                <History className="w-3.5 h-3.5" /> Sesión histórica
              </span>
            )}
          </div>

          <div className="text-center py-4 border-b border-white/10 mb-6">
            <p className="text-xl text-purple-200 mb-2">Textos Analizados</p>
            <p className="text-6xl font-black text-white">{results.totalAnalyzed}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-400/30 p-6 rounded-2xl flex flex-col items-center">
              <div className="mb-2 w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 font-bold text-xl">+</div>
              <p className="text-emerald-300 font-bold mb-1">POSITIVOS</p>
              <p className="text-4xl text-white font-black">{stats[0].value}</p>
              {hasProductData && renderProductBreakdownList("positivo")}
            </div>

            <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border border-amber-400/30 p-6 rounded-2xl flex flex-col items-center">
              <div className="mb-2 w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 font-bold text-xl">~</div>
              <p className="text-amber-300 font-bold mb-1">NEUTRALES</p>
              <p className="text-4xl text-white font-black">{stats[2].value}</p>
              {hasProductData && renderProductBreakdownList("neutral")}
            </div>

            <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-400/30 p-6 rounded-2xl flex flex-col items-center">
              <div className="mb-2 w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 font-bold text-xl">-</div>
              <p className="text-red-300 font-bold mb-1">NEGATIVOS</p>
              <p className="text-4xl text-white font-black">{stats[1].value}</p>
              {hasProductData && renderProductBreakdownList("negativo")}
            </div>
          </div>
        </div>

        {hasProductData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(pieDataByProduct).map(([productName, pieData]) => (
              <div key={productName} className="bg-[#2d1b4e]/60 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <h4 className="text-xl font-bold text-white">Distribución de Sentimientos</h4>
                </div>
                <p className="text-purple-300 text-sm mb-2">
                  Producto: <span className="font-bold text-white">{productName}</span>
                </p>

                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={renderDonutLabel as never}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div style={{ backgroundColor: "#1e1b4b", border: "1px solid #6366f1", borderRadius: "8px", padding: "8px 12px" }}>
                            {payload.map((entry, i) => (
                              <p key={i} style={{ color: entry.payload.color, fontWeight: "bold", margin: "2px 0" }}>
                                {entry.name} : {entry.value}
                              </p>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        )}

        {isBatchMode && stackedData.length > 0 && (
          <div className="bg-[#2d1b4e]/60 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <h4 className="text-xl font-bold text-white">Sentimientos por Producto</h4>
            </div>

            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stackedData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis
                  dataKey="producto"
                  stroke="#9ca3af"
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={stackedData.length > 4 ? -25 : 0}
                  textAnchor={stackedData.length > 4 ? "end" : "middle"}
                  height={stackedData.length > 4 ? 60 : 30}
                />
                <YAxis
                  stroke="#9ca3af"
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  label={{ value: "Comentarios", angle: -90, position: "insideLeft", fill: "#9ca3af", fontSize: 12 }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const displayLabel = (payload[0]?.payload as { productoFull?: string })?.productoFull || label;
                    return (
                      <div style={{ backgroundColor: "#1e1b4b", border: "1px solid #6366f1", borderRadius: "8px", padding: "8px 12px" }}>
                        <p style={{ color: "#fff", fontWeight: "bold", marginBottom: "4px" }}>{displayLabel}</p>
                        {payload.map((entry, i) => (
                          <p key={i} style={{ color: (entry.fill as string) || (entry.color as string), fontWeight: "bold", margin: "2px 0" }}>
                            {entry.name} : {entry.value}
                          </p>
                        ))}
                      </div>
                    );
                  }}
                />
                <Legend />
                <Bar dataKey="Positivo" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Neutral" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Negativo" stackId="a" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-xl rounded-2xl p-8 border-2 border-purple-500/30">
          <h4 className="text-2xl font-black text-white mb-6">Detalle de Comentarios</h4>
          <div className="space-y-4">
            {results.items.map((item, index) => (
              <div key={index} className="bg-[#1a0b2e]/50 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-lg font-bold text-sm">#{index + 1}</span>
                    <span
                      className="px-3 py-1 rounded-lg font-bold uppercase text-sm"
                      style={{ backgroundColor: `${getSentimentColor(item.sentiment)}20`, color: getSentimentColor(item.sentiment) }}
                    >
                      {item.sentiment}
                    </span>
                    {item.productoAsociado && (
                      <span className="inline-flex items-center gap-1 text-sm bg-blue-500/20 text-blue-300 px-3 py-1 rounded-lg border border-blue-500/30">
                        <Package className="w-3 h-3" /> {item.productoAsociado}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">{(item.score * 100).toFixed(0)}%</p>
                  </div>
                </div>
                <p className="text-white italic text-sm">"{item.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e]">
      <header className="bg-[#2d1b4e]/60 backdrop-blur-xl border-b border-purple-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">SentimentAPI</h1>
                <p className="text-sm text-purple-300 font-medium uppercase tracking-widest">Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isDemo ? (
                <>
                  <button
                    onClick={() => setCurrentView("demo-selection")}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 rounded-xl border border-purple-500/30 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Volver</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-xl border border-red-500/30 transition-all"
                  >
                    <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Salir</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setCurrentView("dashboard")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all ${currentView === "dashboard" ? "bg-purple-600 text-white border-purple-400" : "bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border-purple-500/30"}`}
                  >
                    <Home className="w-4 h-4" /> <span className="hidden sm:inline">Dashboard</span>
                  </button>
                  <button
                    onClick={() => setCurrentView("history")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all ${currentView === "history" ? "bg-purple-600 text-white border-purple-400" : "bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border-purple-500/30"}`}
                  >
                    <Clock className="w-4 h-4" /> <span className="hidden sm:inline">Historial</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-xl border border-red-500/30 transition-all"
                  >
                    <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Salir</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* ==================== PASO 1: INGRESAR DATOS ==================== */}
        {isBatchMode && !isDemo && step === 1 && (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full border border-purple-500/30 mb-4">
                <Upload className="w-4 h-4 text-purple-300" /> <span className="text-purple-300 font-bold text-sm">PASO 1 DE 2</span>
              </div>
              <h2 className="text-5xl font-black text-white mb-4">Ingresa tus datos</h2>
              <p className="text-purple-300 text-lg">Escribe tus comentarios o sube un archivo CSV</p>
            </div>

            <div className="max-w-4xl mx-auto space-y-8">
              <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-xl rounded-3xl p-8 border-2 border-purple-500/30">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  Texto manual {csvFile && "(adicional)"}
                </h3>
                <p className="text-purple-300 text-sm mb-4">Escribe comentarios manualmente, uno por línea</p>
                <textarea
                  value={csvFile ? manualText : text}
                  onChange={(e) => (csvFile ? setManualText(e.target.value) : setText(e.target.value))}
                  maxLength={10000}
                  placeholder="Escribe tus comentarios aquí (uno por línea)..."
                  className="w-full h-40 bg-[#1a0b2e]/50 border-2 border-purple-500/30 rounded-xl p-6 text-white placeholder-purple-300/60 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none text-base"
                />
                {csvFile && manualText.trim() && (
                  <button onClick={handleManualTextAdd} className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Agregar al lote
                  </button>
                )}
              </div>

              <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-xl rounded-3xl p-8 border-2 border-purple-500/30">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-purple-400" />
                  Cargar archivo CSV
                </h3>
                <p className="text-purple-300 text-sm mb-6">
                  Columnas: <span className="text-white font-mono">texto</span> (requerida),
                  <span className="text-white font-mono"> producto</span> (opcional),
                  <span className="text-white font-mono"> categoria</span> (opcional)
                </p>

                {!csvFile ? (
                  <div className="border-2 border-dashed border-purple-500/30 rounded-2xl p-10 text-center hover:border-purple-500/50 transition-all">
                    <Upload className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                    <label className="inline-block px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl cursor-pointer transition-all shadow-xl hover:scale-105">
                      <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                      Seleccionar archivo CSV
                    </label>
                  </div>
                ) : (
                  <div className="bg-[#1a0b2e]/50 border-2 border-green-500/30 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-8 h-8 text-green-400" />
                        <div>
                          <p className="text-white font-bold">{csvFile.name}</p>
                          <p className="text-green-300 text-sm">{csvEntradas.length} filas cargadas</p>
                          {extractedCategories.length > 0 && (
                            <p className="text-purple-300 text-xs mt-1">
                              {extractedCategories.length} categoría(s), {extractedProducts.length} producto(s) detectados
                            </p>
                          )}
                        </div>
                      </div>
                      <button onClick={handleClearFile} className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {csvError && (
                  <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-300">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" /> {csvError}
                  </div>
                )}
              </div>

              {(csvEntradas.length > 0 || text.trim()) && (
                <div className="flex items-center justify-between bg-[#2d1b4e]/60 rounded-2xl p-6 border border-purple-500/30">
                  <div className="text-white">
                    <p className="font-bold text-lg">
                      {csvEntradas.length > 0 ? csvEntradas.length : text.split("\n").filter((l) => l.trim()).length} comentarios listos
                    </p>
                    {extractedProducts.length > 0 && (
                      <p className="text-purple-300 text-sm">
                        {extractedProducts.length} productos, {extractedCategories.length} categorías
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleGoToFilter}
                    disabled={analyzing}
                    className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold text-lg shadow-xl hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {extractedProducts.length > 0 || extractedCategories.length > 0 ? "Filtrar y analizar" : "Analizar ahora"}
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {errorMessage && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-300">
                  <AlertCircle className="w-5 h-5" /> {errorMessage}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== PASO 2: FILTRAR CATEGORÍAS/PRODUCTOS ==================== */}
        {isBatchMode && !isDemo && step === 2 && (
          <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-right-8 duration-300">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 text-purple-300 hover:text-white mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Volver a datos
            </button>

            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full border border-purple-500/30 mb-4">
                <Filter className="w-4 h-4 text-purple-300" /> <span className="text-purple-300 font-bold text-sm">PASO 2 DE 2</span>
              </div>
              <h2 className="text-4xl font-black text-white mb-2">Filtra tus datos</h2>
              <p className="text-purple-300">Selecciona las categorías y productos que deseas incluir en el análisis</p>
            </div>

            <div className="space-y-8">
              {extractedCategories.length > 0 && (
                <div className="bg-[#2d1b4e]/30 border border-purple-500/30 rounded-3xl p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Grid3x3 className="w-6 h-6 text-purple-400" />
                      Categorías ({selectedCategories.size}/{extractedCategories.length})
                    </h3>
                    <div className="flex gap-2">
                      <button onClick={selectAllCategories} className="px-3 py-1.5 text-xs font-bold bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 rounded-lg transition-colors">
                        Todas
                      </button>
                      <button onClick={selectNoneCategories} className="px-3 py-1.5 text-xs font-bold bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors">
                        Ninguna
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {extractedCategories.map((cat) => {
                      const isSelected = selectedCategories.has(cat);
                      const count = csvEntradas.filter((e) => e.categoria === cat).length;
                      return (
                        <button
                          key={cat}
                          onClick={() => toggleCategory(cat)}
                          className={`p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                            isSelected ? "bg-purple-600/30 border-purple-400" : "bg-white/5 border-white/10 hover:border-purple-500/50"
                          }`}
                        >
                          <div>
                            <span className="text-white font-medium text-sm block">{cat}</span>
                            <span className="text-purple-300 text-xs">{count} comentarios</span>
                          </div>
                          {isSelected ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-purple-500/30 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {extractedProducts.length > 0 && (
                <div className="bg-[#2d1b4e]/30 border border-purple-500/30 rounded-3xl p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Package className="w-6 h-6 text-purple-400" />
                      Productos ({selectedFilterProducts.size}/{extractedProducts.length})
                    </h3>
                    <div className="flex gap-2">
                      <button onClick={selectAllProducts} className="px-3 py-1.5 text-xs font-bold bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 rounded-lg transition-colors">
                        Todos
                      </button>
                      <button onClick={selectNoneProducts} className="px-3 py-1.5 text-xs font-bold bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors">
                        Ninguno
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {extractedProducts.map((prod) => {
                      const isSelected = selectedFilterProducts.has(prod);
                      const count = csvEntradas.filter((e) => e.producto === prod).length;
                      return (
                        <button
                          key={prod}
                          onClick={() => toggleProduct(prod)}
                          className={`p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                            isSelected ? "bg-purple-600/30 border-purple-400" : "bg-white/5 border-white/10 hover:border-purple-500/50"
                          }`}
                        >
                          <div>
                            <span className="text-white font-medium text-sm block">{prod}</span>
                            <span className="text-purple-300 text-xs">{count} comentarios</span>
                          </div>
                          {isSelected ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-purple-500/30 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between bg-[#2d1b4e]/60 rounded-2xl p-6 border border-purple-500/30">
                <div className="text-white">
                  <p className="font-bold text-lg">
                    {getFilteredCount()} de {csvEntradas.length} comentarios seleccionados
                  </p>
                  <p className="text-purple-300 text-sm">
                    {selectedCategories.size} categoría(s), {selectedFilterProducts.size} producto(s)
                  </p>
                </div>
                <button
                  onClick={() => handleAnalyze()}
                  disabled={getFilteredCount() === 0 || analyzing}
                  className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold text-lg shadow-xl hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Analizando...
                    </>
                  ) : (
                    <>
                      Analizar <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== PASO 3: RESULTADOS / ANÁLISIS SIMPLE / DEMO ==================== */}
        {((isBatchMode && step === 3) || !isBatchMode) && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-300">
            {isBatchMode && !isDemo && !results && (
              <div className="mb-8 flex items-center justify-between">
                <button
                  onClick={() => {
                    setResults(null);
                    setStep(1);
                  }}
                  className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Volver
                </button>
              </div>
            )}

            {!results && (
              <>
                <div className="text-center mb-12">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    {isBatchMode ? <BarChart3 className="w-12 h-12 text-purple-400" /> : <FileText className="w-12 h-12 text-purple-400" />}
                    <h2 className="text-5xl font-black text-white">Análisis {isBatchMode ? "Múltiple" : "Simple"}</h2>
                  </div>
                  <p className="text-purple-300 text-lg">Procesando datos con modelos de lenguaje.</p>
                </div>

                <div className="max-w-4xl mx-auto">
                  <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-xl rounded-3xl p-8 border-2 border-purple-500/30 shadow-2xl">
                    {isBatchMode && isDemo ? (
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        maxLength={10000}
                        placeholder="Escribe tus comentarios aquí (uno por línea)..."
                        className="w-full h-56 bg-[#1a0b2e]/50 border-2 border-purple-500/30 rounded-xl p-6 text-white placeholder-purple-300/60 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none text-lg"
                      />
                    ) : !isBatchMode ? (
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        maxLength={500}
                        placeholder="Escribe aquí..."
                        className="w-full h-56 bg-[#1a0b2e]/50 border-2 border-purple-500/30 rounded-xl p-6 text-white placeholder-purple-300/60 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none text-lg"
                      />
                    ) : (
                      <div className="text-center py-12">
                        <Loader2 className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-4" />
                        <p className="text-white text-xl font-bold">Analizando comentarios...</p>
                        <p className="text-purple-300 mt-2">Esto puede tomar unos segundos</p>
                      </div>
                    )}

                    {errorMessage && (
                      <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-300">
                        <AlertCircle className="w-5 h-5" /> {errorMessage}
                      </div>
                    )}

                    {(isDemo || !isBatchMode) && (
                      <button
                        onClick={() => analyzeSentiment()}
                        disabled={!text.trim() || analyzing}
                        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold py-5 rounded-xl flex items-center justify-center gap-3 transition-all text-lg shadow-xl mt-6"
                      >
                        {analyzing ? "Analizando..." : "Analizar ahora"}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {renderDetailedResults()}

            {results && isBatchMode && !isDemo && (
              <div className="mt-8 text-center flex items-center justify-center gap-4">
                {results.isBatch && results.isHistorical && (
                  <button
                    onClick={() => setCurrentView("history")}
                    className="px-8 py-4 bg-white/5 hover:bg-white/10 text-purple-300 hover:text-white rounded-xl font-bold text-lg border border-purple-500/30 transition-all flex items-center gap-2"
                  >
                    <History className="w-5 h-5" /> Volver al historial
                  </button>
                )}
                <button
                  onClick={() => {
                    setResults(null);
                    setCsvEntradas([]);
                    setCsvFile(null);
                    setText("");
                    setManualText("");
                    setStep(1);
                  }}
                  className="px-8 py-4 bg-purple-600/30 hover:bg-purple-600/50 text-white rounded-xl font-bold text-lg border border-purple-500/30 transition-all"
                >
                  Nuevo análisis
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default AnalysisView;
