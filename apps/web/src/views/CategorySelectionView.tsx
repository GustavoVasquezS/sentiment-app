import { useState, useEffect } from "react";
import { Sparkles, ChevronRight, Package, Grid3x3, Loader2, AlertCircle } from "lucide-react";
import { API_ENDPOINTS } from "../config/api";

export interface Categoria {
  categoriaId: number;
  nombreCategoria: string;
  descripcion?: string | null;
  totalProductos?: number;
}

interface CategoriaListResponse {
  data: Categoria[];
}

interface CategorySelectionViewProps {
  token: string;
  onCategorySelected: (categoria: Categoria) => void;
  onBack: () => void;
}

function CategorySelectionView({ token, onCategorySelected, onBack }: CategorySelectionViewProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCategorias();
  }, []);

  // Antes esta vista hardcodeaba http://localhost:8080/... — no funcionaba
  // apuntando a producción. Ahora usa la misma config que el resto de la app.
  const fetchCategorias = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CATEGORIAS, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Error al cargar categorías");

      const data: CategoriaListResponse = await response.json();
      setCategorias(data.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar categorías");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-xl text-white font-semibold">Cargando categorías...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] flex items-center justify-center p-6">
        <div className="bg-red-500/20 border-2 border-red-500/50 rounded-2xl p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-300 text-center">{error}</p>
          <button onClick={onBack} className="mt-6 w-full px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all">
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e]">
      <header className="bg-[#2d1b4e]/60 backdrop-blur-xl border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-black text-white">SentimentAPI</span>
              <p className="text-xs text-purple-300 font-medium">Selección de Categoría</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500/20 border border-purple-500/30 rounded-full mb-6">
            <Grid3x3 className="w-5 h-5 text-purple-400" />
            <span className="text-purple-300 font-semibold">Paso 1 de 2</span>
          </div>
          <h1 className="text-5xl font-black text-white mb-4">Selecciona una Categoría</h1>
          <p className="text-xl text-purple-300">Elige la categoría de productos que deseas analizar</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categorias.map((categoria) => (
            <button
              key={categoria.categoriaId}
              onClick={() => onCategorySelected(categoria)}
              className="group bg-gradient-to-br from-purple-600/20 to-purple-800/20 hover:from-purple-600/30 hover:to-purple-800/30 backdrop-blur-xl rounded-2xl p-8 border-2 border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 text-left"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <ChevronRight className="w-6 h-6 text-purple-400 group-hover:translate-x-1 transition-transform" />
              </div>

              <h3 className="text-2xl font-black text-white mb-2">{categoria.nombreCategoria}</h3>
              <p className="text-purple-300 text-sm mb-4 line-clamp-2">{categoria.descripcion}</p>

              <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold">
                <Package className="w-4 h-4" />
                <span>{categoria.totalProductos || 0} productos</span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={onBack}
            className="px-8 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 hover:text-white rounded-xl font-semibold transition-all border border-purple-500/30"
          >
            Volver al Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}

export default CategorySelectionView;
