import { useState, useEffect } from "react";
import { Sparkles, Plus, X, Check, Package, Loader2, AlertCircle, ChevronLeft } from "lucide-react";
import { API_ENDPOINTS } from "../config/api";
import type { Categoria } from "./CategorySelectionView";

export interface Producto {
  productoId: number;
  nombreProducto: string;
  totalMenciones?: number;
}

interface PaginatedResponse<T> {
  data: T[];
}

interface ProductSelectionViewProps {
  token: string;
  categoria: Categoria;
  onProductsSelected: (productos: Producto[]) => void;
  onBack: () => void;
}

function ProductSelectionView({ token, categoria, onProductsSelected, onBack }: ProductSelectionViewProps) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Producto[]>([]);
  const [creatingProduct, setCreatingProduct] = useState(false);

  useEffect(() => {
    fetchProductos();
  }, []);

  // Antes hardcodeaba http://localhost:8080/... — ahora usa la config compartida.
  const fetchProductos = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.PRODUCTOS_POR_CATEGORIA}?categoriaId=${categoria.categoriaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Error al cargar productos");
      const data: PaginatedResponse<Producto> = await response.json();
      setProductos(data.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!newProductName.trim()) return;

    setCreatingProduct(true);
    try {
      const response = await fetch(API_ENDPOINTS.PRODUCTOS, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombreProducto: newProductName, categoriaId: categoria.categoriaId }),
      });

      if (!response.ok) throw new Error("Error al crear producto");

      const nuevoProducto: Producto = await response.json();
      setProductos([...productos, nuevoProducto]);
      setNewProductName("");
      setShowNewProductForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear producto");
    } finally {
      setCreatingProduct(false);
    }
  };

  const toggleProduct = (producto: Producto) => {
    setSelectedProducts((prev) => {
      const exists = prev.find((p) => p.productoId === producto.productoId);
      if (exists) {
        return prev.filter((p) => p.productoId !== producto.productoId);
      }
      return [...prev, producto];
    });
  };

  const handleContinue = () => {
    if (selectedProducts.length === 0) {
      setError("Debes seleccionar al menos un producto");
      return;
    }
    onProductsSelected(selectedProducts);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-xl text-white font-semibold">Cargando productos...</p>
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
              <p className="text-xs text-purple-300 font-medium">Selección de Productos</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <button onClick={onBack} className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors mb-6">
            <ChevronLeft className="w-5 h-5" />
            Cambiar categoría
          </button>

          <div className="bg-purple-500/20 border border-purple-500/30 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-purple-300 text-sm font-semibold">Categoría seleccionada</p>
                <h2 className="text-3xl font-black text-white">{categoria.nombreCategoria}</h2>
              </div>
            </div>
          </div>

          <h3 className="text-2xl font-black text-white mb-4">Selecciona los productos a analizar</h3>
          <p className="text-purple-300">Puedes seleccionar múltiples productos o crear nuevos</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-300">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {productos.map((producto) => {
            const isSelected = selectedProducts.find((p) => p.productoId === producto.productoId);
            return (
              <button
                key={producto.productoId}
                onClick={() => toggleProduct(producto)}
                className={`p-6 rounded-2xl border-2 transition-all text-left ${
                  isSelected
                    ? "bg-gradient-to-br from-purple-600/30 to-purple-800/30 border-purple-400"
                    : "bg-white/5 border-white/10 hover:border-purple-500/50"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <Package className={`w-6 h-6 ${isSelected ? "text-purple-400" : "text-purple-300"}`} />
                  {isSelected && <Check className="w-6 h-6 text-green-400" />}
                </div>
                <h4 className="text-xl font-bold text-white mb-2">{producto.nombreProducto}</h4>
                <p className="text-sm text-purple-300">{producto.totalMenciones || 0} análisis previos</p>
              </button>
            );
          })}

          <button
            onClick={() => setShowNewProductForm(true)}
            className="p-6 rounded-2xl border-2 border-dashed border-purple-500/50 hover:border-purple-400 hover:bg-purple-500/10 transition-all"
          >
            <Plus className="w-8 h-8 text-purple-400 mx-auto mb-3" />
            <p className="text-purple-300 font-semibold text-center">Agregar Producto</p>
          </button>
        </div>

        {showNewProductForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="bg-[#2d1b4e] rounded-2xl p-8 max-w-md w-full border-2 border-purple-500/30">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-white">Nuevo Producto</h3>
                <button onClick={() => setShowNewProductForm(false)} className="text-purple-300 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <input
                type="text"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="Nombre del producto"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-purple-300/60 focus:outline-none focus:ring-2 focus:ring-purple-400 mb-4"
                onKeyDown={(e) => e.key === "Enter" && handleCreateProduct()}
              />

              <button
                onClick={handleCreateProduct}
                disabled={creatingProduct || !newProductName.trim()}
                className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {creatingProduct ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Crear Producto
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {selectedProducts.length > 0 && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 shadow-2xl border-2 border-white/20">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-white/80 text-sm font-semibold">Productos seleccionados</p>
                <p className="text-3xl font-black text-white">{selectedProducts.length}</p>
              </div>
              <button onClick={handleContinue} className="px-8 py-3 bg-white text-purple-600 rounded-xl font-bold hover:bg-purple-50 transition-all">
                Continuar al Análisis
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ProductSelectionView;
