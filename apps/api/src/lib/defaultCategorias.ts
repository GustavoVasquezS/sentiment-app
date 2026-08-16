// Lista de categorías por defecto que se crean para cada usuario nuevo al
// registrarse (reemplaza el POST /debug/crear-categorias manual del backend
// Java original, que sembraba estas mismas 12 categorías a mano).
export const CATEGORIAS_DEFAULT = [
  "Electrónica",
  "Ropa y Accesorios",
  "Hogar y Jardín",
  "Alimentos y Bebidas",
  "Salud y Belleza",
  "Deportes",
  "Juguetes",
  "Libros y Medios",
  "Automotriz",
  "Mascotas",
  "Servicios",
  "Otros",
] as const;
