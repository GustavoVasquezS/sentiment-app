import { useState, useEffect, type FormEvent } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Landing from "./views/Landing";
import Auth from "./views/Auth";
import DashboardView from "./views/DashboardView";
import AnalysisView from "./views/AnalysisView";
import HistoryView, { type HistorySession } from "./views/HistoryView";
import DemoSelectionView from "./views/DemoSelectionView";
import CategorySelectionView, { type Categoria } from "./views/CategorySelectionView";
import ProductSelectionView, { type Producto } from "./views/ProductSelectionView";
import ForgotPasswordView from "./views/ForgotPasswordView";
import ResetPasswordView from "./views/ResetPasswordView";
import { sentimentService } from "./services/sentimentService";
import Footer from "./components/Footer";
import { getSentimentColor } from "./utils/sentiment";
import type { AnalysisResults, AppUser, CsvEntrada, StatItem } from "./types/analysis";
import type { AnalyzedItem, AuthUser, ProductoDetectado } from "./services/types";

const STORAGE_KEY = "sentimentapi_user";

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error("Error al cargar usuario desde localStorage:", error);
      return null;
    }
  });

  const [isDemo, setIsDemo] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [text, setText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingHistoricalSession, setPendingHistoricalSession] = useState<AnalysisResults | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<Categoria | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Producto[]>([]);

  useEffect(() => {
    if (user && !isDemo) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } catch (error) {
        console.error("Error al guardar usuario en localStorage:", error);
      }
    } else if (!user) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user, isDemo]);

  useEffect(() => {
    // Si hay una sesión histórica pendiente, cargarla en vez de limpiar
    if (pendingHistoricalSession) {
      setResults(pendingHistoricalSession);
      setPendingHistoricalSession(null);
      setText("");
      setErrorMessage("");
      return;
    }
    setText("");
    setResults(null);
    setErrorMessage("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const loadSessionFromHistory = (session: HistorySession) => {
    // El backend guarda "sentimiento" con la capitalización del modelo ML
    // (Positivo/Neutro/Negativo) tal cual, sin normalizar a los valores en
    // minúscula que usa el resto del front — mismo comportamiento que en
    // el código original.
    const items: AnalyzedItem[] = (session.comentarios || []).map((c) => {
      const comentario = c as { texto: string; sentimiento: string; probabilidad: number; productoAsociado?: string };
      return {
        text: comentario.texto,
        sentiment: comentario.sentimiento as AnalyzedItem["sentiment"],
        score: comentario.probabilidad,
        productoAsociado: comentario.productoAsociado || null,
      };
    });

    const restoredResults: AnalysisResults = {
      isBatch: true,
      totalAnalyzed: session.total || items.length,
      sessionSaved: true,
      sessionId: session.sessionId,
      isHistorical: true,
      items,
      stats: {
        avgScore: session.avgScore,
        positivos: session.positivos || 0,
        negativos: session.negativos || 0,
        neutrales: session.neutrales || 0,
      },
      productosDetectados: (session.productosDetectados as ProductoDetectado[] | undefined) || [],
    };

    setPendingHistoricalSession(restoredResults);
    navigate("/analysis-batch");
  };

  const analyzeSentiment = async (csvEntradas: CsvEntrada[] | null = null) => {
    if (!text.trim() && !csvEntradas) return;

    setAnalyzing(true);
    setErrorMessage("");

    const isBatchMode = location.pathname === "/analysis-batch" || location.pathname === "/demo-batch";

    try {
      if (isBatchMode) {
        if (csvEntradas && csvEntradas.length > 0 && user && !isDemo && user.token) {
          const result = await sentimentService.analyzeCsvBatch(csvEntradas, user.token);
          setResults(result);
        } else if (user && !isDemo && user.token && selectedProducts.length > 0) {
          const comentarios = text.split("\n").filter((t) => t.trim());
          const productosIds = selectedProducts.map((p) => p.productoId);

          const result = await sentimentService.analyzeWithMultipleProducts(comentarios, user.token, productosIds);

          setResults({
            isBatch: true,
            totalAnalyzed: result.total,
            sessionSaved: true,
            sessionId: result.sessionId,
            items: result.comentarios || [],
            stats: {
              avgScore: result.avgScore,
              positivos: result.positivos,
              negativos: result.negativos,
              neutrales: result.neutrales,
            },
            productosDetectados: result.productosDetectados || [],
          });
        } else {
          const comentarios = text.split("\n").filter((t) => t.trim());
          if (comentarios.length === 0) {
            setErrorMessage("No hay textos válidos para analizar.");
            setAnalyzing(false);
            return;
          }

          if (user && !isDemo && user.token) {
            const result = await sentimentService.analyzeAndSave(comentarios, user.token);
            setResults({
              isBatch: true,
              totalAnalyzed: result.total || comentarios.length,
              sessionSaved: true,
              sessionId: result.sessionId,
              items: result.comentarios || [],
              stats: {
                avgScore: result.avgScore || 0,
                positivos: result.positivos || 0,
                negativos: result.negativos || 0,
                neutrales: result.neutrales || 0,
              },
              productosDetectados: result.productosDetectados || [],
            });
          } else {
            const result = await sentimentService.analyzeBatch(text);
            setResults(result);
          }
        }
      } else {
        const result = await sentimentService.analyzeSingle(text);
        setResults(result);
      }
    } catch (error) {
      console.error("❌ Error en análisis:", error);
      setErrorMessage(error instanceof Error ? error.message : "Error al analizar el texto");
      setResults(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const getStatistics = (): StatItem[] | null => {
    if (!results?.isBatch) return null;

    if (results.stats) {
      const { positivos, negativos, neutrales } = results.stats;
      const total = positivos + negativos + neutrales;
      const safeTotal = total === 0 ? 1 : total;

      return [
        { name: "Positivo", value: positivos, color: "#10b981", percentage: ((positivos / safeTotal) * 100).toFixed(1) },
        { name: "Negativo", value: negativos, color: "#ef4444", percentage: ((negativos / safeTotal) * 100).toFixed(1) },
        { name: "Neutral", value: neutrales, color: "#f59e0b", percentage: ((neutrales / safeTotal) * 100).toFixed(1) },
      ];
    }

    const items = results.items || [];
    if (items.length === 0) return null;

    const counts = { positivo: 0, negativo: 0, neutral: 0 };

    items.forEach((item) => {
      const sentiment = item.sentiment?.toLowerCase().trim();
      if (sentiment === "positivo") counts.positivo++;
      else if (sentiment === "negativo") counts.negativo++;
      else counts.neutral++;
    });

    const total = items.length;
    const safeTotal = total === 0 ? 1 : total;

    return [
      { name: "Positivo", value: counts.positivo, color: "#10b981", percentage: ((counts.positivo / safeTotal) * 100).toFixed(1) },
      { name: "Negativo", value: counts.negativo, color: "#ef4444", percentage: ((counts.negativo / safeTotal) * 100).toFixed(1) },
      { name: "Neutral", value: counts.neutral, color: "#f59e0b", percentage: ((counts.neutral / safeTotal) * 100).toFixed(1) },
    ];
  };

  const handleLogin = (e: FormEvent, userData: AuthUser) => {
    e.preventDefault();

    const newUser: AppUser = {
      id: userData.id,
      email: userData.correo,
      name: userData.nombreCompleto || `${userData.nombre} ${userData.apellido}`,
      token: userData.token,
    };

    setUser(newUser);
    setIsDemo(false);
    navigate("/dashboard");
  };

  const handleRegister = (e: FormEvent) => {
    e.preventDefault();
    navigate("/login");
  };

  const handleLogout = () => {
    setUser(null);
    setIsDemo(false);
    localStorage.removeItem(STORAGE_KEY);
    navigate("/");
    setText("");
    setResults(null);
    setErrorMessage("");
    setSelectedCategory(null);
    setSelectedProducts([]);
  };

  const handleDemoStart = () => {
    setUser({ email: "demo@sentimentapi.com", name: "Demo" });
    setIsDemo(true);
    navigate("/demo-selection");
  };

  const handleBackToLanding = () => {
    setUser(null);
    setIsDemo(false);
    localStorage.removeItem(STORAGE_KEY);
    navigate("/");
    setText("");
    setResults(null);
    setErrorMessage("");
    setSelectedCategory(null);
    setSelectedProducts([]);
  };

  const setCurrentView = (view: string) => {
    navigate(`/${view}`);
  };

  const handleCategorySelected = (category: Categoria) => {
    setSelectedCategory(category);
    navigate("/product-selection");
  };

  const handleProductsSelected = (products: Producto[]) => {
    setSelectedProducts(products);
    navigate("/analysis-batch");
  };

  const analysisProps = {
    setCurrentView,
    user,
    isDemo,
    handleLogout,
    handleBackToLanding,
    text,
    setText,
    analyzing,
    analyzeSentiment,
    results,
    setResults,
    getStatistics,
    getSentimentColor,
    errorMessage,
    selectedProducts,
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <Routes>
          <Route
            path="/"
            element={<Landing setCurrentView={setCurrentView} handleDemoStart={handleDemoStart} showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />}
          />

          <Route path="/login" element={<Auth type="login" handleSubmit={handleLogin} setCurrentView={setCurrentView} />} />

          <Route path="/register" element={<Auth type="register" handleSubmit={handleRegister} setCurrentView={setCurrentView} />} />

          <Route path="/forgot-password" element={<ForgotPasswordView setCurrentView={setCurrentView} />} />

          <Route path="/reset-password" element={<ResetPasswordView setCurrentView={setCurrentView} />} />

          <Route
            path="/demo-selection"
            element={
              user && isDemo ? (
                <DemoSelectionView setCurrentView={setCurrentView} handleBackToLanding={handleBackToLanding} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/dashboard"
            element={
              user && !isDemo ? (
                <DashboardView currentView="dashboard" setCurrentView={setCurrentView} user={user} isDemo={isDemo} handleLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/category-selection"
            element={
              user && !isDemo ? (
                <CategorySelectionView token={user.token!} onCategorySelected={handleCategorySelected} onBack={() => navigate("/dashboard")} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/product-selection"
            element={
              user && !isDemo && selectedCategory ? (
                <ProductSelectionView
                  token={user.token!}
                  categoria={selectedCategory}
                  onProductsSelected={handleProductsSelected}
                  onBack={() => navigate("/category-selection")}
                />
              ) : (
                <Navigate to="/category-selection" replace />
              )
            }
          />

          <Route
            path="/analysis-simple"
            element={
              user && !isDemo ? <AnalysisView currentView="analysis-simple" isBatchMode={false} {...analysisProps} /> : <Navigate to="/" replace />
            }
          />

          <Route
            path="/analysis-batch"
            element={
              user && !isDemo ? <AnalysisView currentView="analysis-batch" isBatchMode={true} {...analysisProps} /> : <Navigate to="/" replace />
            }
          />

          <Route
            path="/demo-simple"
            element={user && isDemo ? <AnalysisView currentView="demo-simple" isBatchMode={false} {...analysisProps} /> : <Navigate to="/" replace />}
          />

          <Route
            path="/demo-batch"
            element={user && isDemo ? <AnalysisView currentView="demo-batch" isBatchMode={true} {...analysisProps} /> : <Navigate to="/" replace />}
          />

          <Route
            path="/history"
            element={
              user && !isDemo ? (
                <HistoryView token={user.token!} setCurrentView={setCurrentView} onLoadSession={loadSessionFromHistory} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
