// Reemplaza data.sql (seed de roles). Las categorías default por usuario se
// crean en auth.service.ts al registrarse, no acá (categoria.usuarioId es
// obligatorio) — ver src/lib/defaultCategorias.ts.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ROLES = ["ADMIN", "USER"];

async function main() {
  for (const nombre of ROLES) {
    await prisma.rol.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }
  console.log(`Roles sembrados: ${ROLES.join(", ")}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
