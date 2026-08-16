import { Sparkles, Zap, Brain, BarChart3, Menu, X } from "lucide-react";

interface LandingProps {
  setCurrentView: (view: string) => void;
  handleDemoStart: () => void;
  showMobileMenu: boolean;
  setShowMobileMenu: (show: boolean) => void;
}

function Landing({ setCurrentView, handleDemoStart, showMobileMenu, setShowMobileMenu }: LandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-slate-900/80 backdrop-blur-xl border-b border-purple-500/20 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black text-white">SentimentAPI</span>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => setCurrentView("login")}
                className="px-5 py-2 text-white hover:text-purple-300 font-semibold transition-all text-sm"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => setCurrentView("register")}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl text-sm"
              >
                Registrarse
              </button>
            </div>

            <button className="md:hidden text-white" onClick={() => setShowMobileMenu(!showMobileMenu)}>
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {showMobileMenu && (
          <div className="md:hidden bg-slate-800 border-t border-purple-500/20">
            <div className="px-4 py-4 space-y-3">
              <button
                onClick={() => {
                  setCurrentView("login");
                  setShowMobileMenu(false);
                }}
                className="w-full px-6 py-3 text-white text-left font-semibold hover:bg-slate-700 rounded-lg transition-all"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => {
                  setCurrentView("register");
                  setShowMobileMenu(false);
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold"
              >
                Registrarse
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-purple-300 text-xs font-semibold">Análisis de sentimientos con IA • Multilingüe: Español & Português</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
            Descubre el poder del
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> análisis de sentimientos</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Analiza opiniones, reseñas y comentarios en <span className="font-bold text-white">español y portugués</span> al instante con
            nuestra inteligencia artificial avanzada. Obtén insights valiosos de tus datos en segundos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <button
              onClick={() => setCurrentView("register")}
              className="px-7 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-base rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105"
            >
              Comenzar Gratis
            </button>
            <button
              onClick={handleDemoStart}
              className="px-7 py-3 bg-white/10 backdrop-blur-sm text-white text-base rounded-lg font-bold hover:bg-white/20 transition-all border border-white/20"
            >
              Ver Demo
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition-all">
              <div className="p-2.5 bg-purple-500/20 rounded-xl w-fit mb-3 mx-auto">
                <Brain className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">IA Avanzada</h3>
              <p className="text-gray-400 text-sm">Modelos de última generación entrenados con millones de textos</p>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-pink-500/50 transition-all">
              <div className="p-2.5 bg-pink-500/20 rounded-xl w-fit mb-3 mx-auto">
                <Zap className="w-7 h-7 text-pink-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Análisis Instantáneo</h3>
              <p className="text-gray-400 text-sm">Resultados en segundos, procesa miles de textos simultáneamente</p>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-cyan-500/50 transition-all">
              <div className="p-2.5 bg-cyan-500/20 rounded-xl w-fit mb-3 mx-auto">
                <BarChart3 className="w-7 h-7 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Estadísticas Detalladas</h3>
              <p className="text-gray-400 text-sm">Visualiza tendencias y patrones con gráficas interactivas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Landing;
