import { Sparkles, BarChart3, FileText, History, LogOut } from "lucide-react";

interface DashboardUser {
  name?: string;
}

interface DashboardViewProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  user: DashboardUser | null;
  isDemo: boolean;
  handleLogout: () => void;
}

function DashboardView({ currentView, setCurrentView, user, isDemo, handleLogout }: DashboardViewProps) {
  if (currentView !== "dashboard" || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] flex flex-col">
      {/* Header */}
      <header className="bg-[#2d1b4e]/60 backdrop-blur-xl border-b border-purple-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl shadow-lg shadow-purple-500/50">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">SentimentAPI</h1>
                <p className="text-sm text-purple-300 font-medium">POWERED BY AI</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 hover:text-white rounded-xl font-semibold transition-all border border-purple-500/30"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center max-w-7xl mx-auto px-6 py-8 w-full">
        <div className="text-center mb-8">
          <p className="text-xl text-purple-200 font-medium">
            Análisis de sentimientos en tiempo real con inteligencia artificial avanzada
          </p>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-black text-white mb-6 leading-tight">Hola {user.name || "usuario"}!</h2>
          <div className="inline-block">
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white px-8 py-4 border-4 border-purple-400 rounded-2xl">
              Que deseas hacer hoy?
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-8">
          <button
            onClick={() => setCurrentView("analysis-simple")}
            className="group relative bg-gradient-to-br from-purple-600/20 to-purple-800/20 hover:from-purple-600/30 hover:to-purple-800/30 backdrop-blur-xl rounded-3xl p-10 border-2 border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30"
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="p-6 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl shadow-lg group-hover:shadow-purple-500/50 transition-shadow">
                <FileText className="w-16 h-16 text-white" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-white mb-2">Analisis</h3>
                <h3 className="text-3xl font-black text-white">simple</h3>
              </div>
            </div>
          </button>

          <button
            onClick={() => setCurrentView("analysis-batch")}
            className="group relative bg-gradient-to-br from-purple-600/20 to-purple-800/20 hover:from-purple-600/30 hover:to-purple-800/30 backdrop-blur-xl rounded-3xl p-10 border-2 border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30"
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="p-6 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl shadow-lg group-hover:shadow-purple-500/50 transition-shadow">
                <BarChart3 className="w-16 h-16 text-white" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-white mb-2">Analisis</h3>
                <h3 className="text-3xl font-black text-white">múltiple</h3>
              </div>
            </div>
          </button>

          {!isDemo ? (
            <button
              onClick={() => setCurrentView("history")}
              className="group relative bg-gradient-to-br from-purple-600/20 to-purple-800/20 hover:from-purple-600/30 hover:to-purple-800/30 backdrop-blur-xl rounded-3xl p-10 border-2 border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30"
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="p-6 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl shadow-lg group-hover:shadow-purple-500/50 transition-shadow">
                  <History className="w-16 h-16 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white mb-2">ver</h3>
                  <h3 className="text-3xl font-black text-white">historial</h3>
                </div>
              </div>
            </button>
          ) : (
            <div className="group relative bg-gradient-to-br from-gray-600/20 to-gray-800/20 backdrop-blur-xl rounded-3xl p-10 border-2 border-gray-500/30 opacity-50 cursor-not-allowed">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="p-6 bg-gradient-to-br from-gray-500 to-gray-600 rounded-3xl shadow-lg">
                  <History className="w-16 h-16 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white mb-2">ver</h3>
                  <h3 className="text-3xl font-black text-white mb-4">historial</h3>
                  <p className="text-sm text-gray-400">Solo para usuarios registrados</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {isDemo && (
          <div className="text-center">
            <div className="inline-block bg-purple-500/20 backdrop-blur-xl rounded-2xl px-8 py-6 border border-purple-400/30">
              <p className="text-purple-200 text-lg mb-4">
                🎯 Estás en <span className="font-bold text-white">modo DEMO</span>
              </p>
              <button
                onClick={() => setCurrentView("register")}
                className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-purple-500/50"
              >
                Registrarse para más funciones
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer Info */}
      <div className="max-w-7xl mx-auto px-6 py-6 text-center text-purple-300/60 text-sm">
        <p>Powered by AI • Análisis en tiempo real • {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}

export default DashboardView;
