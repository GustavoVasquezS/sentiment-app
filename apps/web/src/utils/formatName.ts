// Corrige un bug del repo original: este archivo no tenía extensión
// (`formatName` sin `.js`), lo que dependía de que Vite lo resolviera por
// suerte. Ahora es un módulo TS normal.

export function formatUserName(nombre?: string, apellido?: string): string {
  if (!nombre && !apellido) return "";

  const primerNombre = nombre ? nombre.trim().split(" ")[0] : "";
  const primerApellido = apellido ? apellido.trim().split(" ")[0] : "";

  return `${primerNombre} ${primerApellido}`.trim();
}
