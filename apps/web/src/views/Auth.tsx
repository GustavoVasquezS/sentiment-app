import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { Sparkles, LogIn, UserPlus, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { authService } from "../services/authService";
import type { AuthUser } from "../services/types";

interface AuthProps {
  type: "login" | "register";
  handleSubmit: (e: FormEvent, user: AuthUser) => void;
  setCurrentView: (view: string) => void;
}

interface AuthFormData {
  nombre: string;
  apellido: string;
  correo: string;
  contraseña: string;
}

const EMPTY_FORM: AuthFormData = { nombre: "", apellido: "", correo: "", contraseña: "" };

function Auth({ type, handleSubmit, setCurrentView }: AuthProps) {
  const isLogin = type === "login";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState<AuthFormData>(EMPTY_FORM);

  useEffect(() => {
    setLoading(false);
    setError("");
    setSuccess("");
    setFormData(EMPTY_FORM);
  }, [type]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isLogin) {
        const result = await authService.login(formData.correo, formData.contraseña);
        if (result.success) {
          handleSubmit(e, result.user);
        }
      } else {
        const result = await authService.register(formData);
        if (result.success) {
          setSuccess("¡Cuenta creada con éxito! Redirigiendo al inicio de sesión...");
          setFormData(EMPTY_FORM);
          setTimeout(() => {
            setCurrentView("login");
          }, 2000);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-black text-white">SentimentAPI</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta"}</h2>
          <p className="text-gray-400">{isLogin ? "Inicia sesión para continuar" : "Comienza a analizar sentimientos hoy"}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/20 border-2 border-green-500/50 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-green-300 text-sm font-semibold">{success}</p>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-6">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    required
                    value={formData.nombre}
                    onChange={handleInputChange}
                    disabled={loading || !!success}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Juan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Apellido</label>
                  <input
                    type="text"
                    name="apellido"
                    required
                    value={formData.apellido}
                    onChange={handleInputChange}
                    disabled={loading || !!success}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Pérez"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Email</label>
              <input
                type="email"
                name="correo"
                required
                value={formData.correo}
                onChange={handleInputChange}
                disabled={loading || !!success}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Contraseña</label>
              <input
                type="password"
                name="contraseña"
                required
                value={formData.contraseña}
                onChange={handleInputChange}
                disabled={loading || !!success}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="••••••••"
              />
            </div>

            {isLogin && !success && (
              <div className="text-right -mt-2">
                <button
                  type="button"
                  onClick={() => setCurrentView("forgot-password")}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  disabled={loading}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            {!success && (
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isLogin ? "Iniciando sesión..." : "Registrando..."}
                  </>
                ) : (
                  <>
                    {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                    {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
                  </>
                )}
              </button>
            )}
          </form>

          {!success && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setCurrentView(isLogin ? "register" : "login")}
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                disabled={loading}
              >
                {isLogin ? "¿No tienes cuenta? Regístrate aquí" : "¿Ya tienes cuenta? Inicia sesión"}
              </button>
            </div>
          )}

          <div className="mt-4 text-center">
            <button
              onClick={() => setCurrentView("landing")}
              className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
              disabled={loading || !!success}
            >
              ← Volver al inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
