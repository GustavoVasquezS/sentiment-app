import { Sparkles, Menu, X, Home, Clock, LogOut } from "lucide-react";

interface NavbarUser {
  name?: string;
  email?: string;
}

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  user: NavbarUser | null;
  isDemo: boolean;
  handleLogout: () => void;
  showMobileMenu: boolean;
  setShowMobileMenu: (show: boolean) => void;
}

function Navbar({ currentView, setCurrentView, user, isDemo, handleLogout, showMobileMenu, setShowMobileMenu }: NavbarProps) {
  return (
    <nav
      className={
        currentView === "landing"
          ? "fixed top-0 w-full bg-slate-900/80 backdrop-blur-xl border-b border-purple-500/20 z-50"
          : "bg-slate-900/80 backdrop-blur-xl border-b border-purple-500/20"
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white">SentimentAPI</span>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {!user ? (
              <>
                <button onClick={() => setCurrentView("login")} className="px-6 py-2.5 text-white hover:text-purple-300 font-semibold">
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => setCurrentView("register")}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold"
                >
                  Registrarse
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setCurrentView("dashboard")}
                  className={`px-4 py-2 rounded-lg font-semibold flex gap-2 ${currentView === "dashboard" ? "bg-purple-600 text-white" : "text-gray-300 hover:text-white"}`}
                >
                  <Home className="w-4 h-4" /> Dashboard
                </button>

                {!isDemo && (
                  <button
                    onClick={() => setCurrentView("history")}
                    className={`px-4 py-2 rounded-lg font-semibold flex gap-2 ${currentView === "history" ? "bg-purple-600 text-white" : "text-gray-300 hover:text-white"}`}
                  >
                    <Clock className="w-4 h-4" /> Historial
                  </button>
                )}

                <button onClick={handleLogout} className="px-4 py-2 text-gray-300 hover:text-white rounded-lg font-semibold flex gap-2">
                  <LogOut className="w-4 h-4" /> Salir
                </button>
              </>
            )}
          </div>

          <button className="md:hidden text-white" onClick={() => setShowMobileMenu(!showMobileMenu)}>
            {showMobileMenu ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
