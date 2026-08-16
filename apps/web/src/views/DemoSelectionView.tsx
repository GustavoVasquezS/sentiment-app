import { Sparkles, BarChart3, FileText, ArrowLeft, Zap } from "lucide-react";

interface DemoSelectionViewProps {
  setCurrentView: (view: string) => void;
  handleBackToLanding: () => void;
}

function DemoSelectionView({ setCurrentView, handleBackToLanding }: DemoSelectionViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e]">
      {/* Header */}
      <header className="bg-[#2d1b4e]/60 backdrop-blur-xl border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-2xl font-black text-white">SentimentAPI</span>
                <p className="text-xs text-purple-300 font-medium">MODO DEMO</p>
              </div>
            </div>

            <button
              onClick={handleBackToLanding}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 hover:text-white rounded-xl font-semibold transition-all border border-purple-500/30"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Demo Banner */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500/20 border border-purple-500/30 rounded-full mb-6">
            <Zap className="w-5 h-5 text-purple-400" />
            <span className="text-purple-300 font-semibold">Modo Demo Activado</span>
          </div>
          <h2 className="text-6xl sm:text-7xl font-black text-white mb-6 leading-tight">¡Prueba el poder de la IA!</h2>
          <p className="text-xl text-purple-300 max-w-3xl mx-auto">
            Selecciona el tipo de análisis que deseas probar. Sin registro, sin límites.
          </p>
        </div>

        {/* Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          <button
            onClick={() => setCurrentView("demo-simple")}
            className="group relative bg-gradient-to-br from-purple-600/20 to-purple-800/20 hover:from-purple-600/30 hover:to-purple-800/30 backdrop-blur-xl rounded-3xl p-12 border-2 border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30"
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="p-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl shadow-lg group-hover:shadow-purple-500/50 transition-shadow">
                <FileText className="w-20 h-20 text-white" />
              </div>
              <div>
                <h3 className="text-4xl font-black text-white mb-3">Análisis</h3>
                <h3 className="text-4xl font-black text-white mb-4">Simple</h3>
                <p className="text-purple-300 text-lg">Analiza un texto individual y conoce su sentimiento al instante</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setCurrentView("demo-batch")}
            className="group relative bg-gradient-to-br from-purple-600/20 to-purple-800/20 hover:from-purple-600/30 hover:to-purple-800/30 backdrop-blur-xl rounded-3xl p-12 border-2 border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30"
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="p-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl shadow-lg group-hover:shadow-purple-500/50 transition-shadow">
                <BarChart3 className="w-20 h-20 text-white" />
              </div>
              <div>
                <h3 className="text-4xl font-black text-white mb-3">Análisis</h3>
                <h3 className="text-4xl font-black text-white mb-4">Múltiple</h3>
                <p className="text-purple-300 text-lg">Procesa múltiples textos y visualiza estadísticas completas</p>
              </div>
            </div>
          </button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 text-center">
            <div className="text-4xl font-black text-purple-400 mb-2">100%</div>
            <div className="text-purple-200 font-semibold">Gratis</div>
            <div className="text-sm text-purple-300/60 mt-2">Sin registro necesario</div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 text-center">
            <div className="text-4xl font-black text-pink-400 mb-2">∞</div>
            <div className="text-pink-200 font-semibold">Sin Límites</div>
            <div className="text-sm text-pink-300/60 mt-2">Prueba todo lo que quieras</div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 text-center">
            <div className="text-4xl font-black text-cyan-400 mb-2">IA</div>
            <div className="text-cyan-200 font-semibold">Tecnología Real</div>
            <div className="text-sm text-cyan-300/60 mt-2">Misma IA que usuarios registrados</div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-2xl px-8 py-6 border border-purple-400/30">
            <p className="text-purple-200 text-lg mb-4">
              ¿Te gusta lo que ves? <span className="font-bold text-white">Regístrate para acceder al historial y más funciones</span>
            </p>
            <button
              onClick={handleBackToLanding}
              className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-purple-500/50"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <div className="max-w-7xl mx-auto px-6 py-8 text-center text-purple-300/60 text-sm">
        <p>Modo Demo • Sin restricciones • {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}

export default DemoSelectionView;
