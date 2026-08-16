-- CreateEnum
CREATE TYPE "Sentimiento" AS ENUM ('Positivo', 'Neutro', 'Negativo');

-- CreateTable
CREATE TABLE "rol" (
    "rol_id" SERIAL NOT NULL,
    "nombre_rol" TEXT NOT NULL,

    CONSTRAINT "rol_pkey" PRIMARY KEY ("rol_id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "usuario_id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateTable
CREATE TABLE "user_rol" (
    "user_id" INTEGER NOT NULL,
    "rol_id" INTEGER NOT NULL,

    CONSTRAINT "user_rol_pkey" PRIMARY KEY ("user_id","rol_id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" SERIAL NOT NULL,
    "token_hash" TEXT NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categoria" (
    "categoria_id" SERIAL NOT NULL,
    "nombre_categoria" TEXT NOT NULL,
    "descripcion" TEXT,
    "usuario_id" INTEGER NOT NULL,

    CONSTRAINT "categoria_pkey" PRIMARY KEY ("categoria_id")
);

-- CreateTable
CREATE TABLE "producto" (
    "producto_id" SERIAL NOT NULL,
    "nombre_producto" TEXT NOT NULL,
    "total_menciones" INTEGER NOT NULL DEFAULT 0,
    "positivos" INTEGER NOT NULL DEFAULT 0,
    "negativos" INTEGER NOT NULL DEFAULT 0,
    "neutrales" INTEGER NOT NULL DEFAULT 0,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultima_actualizacion" TIMESTAMP(3),
    "categoria_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,

    CONSTRAINT "producto_pkey" PRIMARY KEY ("producto_id")
);

-- CreateTable
CREATE TABLE "sesion" (
    "sesion_id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avg_score" DOUBLE PRECISION NOT NULL,
    "total" INTEGER NOT NULL,
    "positivos" INTEGER NOT NULL,
    "negativos" INTEGER NOT NULL,
    "neutrales" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "producto_id" INTEGER,

    CONSTRAINT "sesion_pkey" PRIMARY KEY ("sesion_id")
);

-- CreateTable
CREATE TABLE "comentario" (
    "comentario_id" SERIAL NOT NULL,
    "texto" TEXT NOT NULL,
    "sentimiento" "Sentimiento" NOT NULL,
    "probabilidad" DOUBLE PRECISION NOT NULL,
    "sesion_id" INTEGER NOT NULL,

    CONSTRAINT "comentario_pkey" PRIMARY KEY ("comentario_id")
);

-- CreateTable
CREATE TABLE "sesion_producto" (
    "sesion_producto_id" SERIAL NOT NULL,
    "sesion_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "menciones_sesion" INTEGER NOT NULL DEFAULT 0,
    "positivos_sesion" INTEGER NOT NULL DEFAULT 0,
    "negativos_sesion" INTEGER NOT NULL DEFAULT 0,
    "neutrales_sesion" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sesion_producto_pkey" PRIMARY KEY ("sesion_producto_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rol_nombre_rol_key" ON "rol"("nombre_rol");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- AddForeignKey
ALTER TABLE "user_rol" ADD CONSTRAINT "user_rol_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"("usuario_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_rol" ADD CONSTRAINT "user_rol_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "rol"("rol_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("usuario_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categoria" ADD CONSTRAINT "categoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("usuario_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto" ADD CONSTRAINT "producto_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categoria"("categoria_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto" ADD CONSTRAINT "producto_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("usuario_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesion" ADD CONSTRAINT "sesion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("usuario_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesion" ADD CONSTRAINT "sesion_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "producto"("producto_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentario" ADD CONSTRAINT "comentario_sesion_id_fkey" FOREIGN KEY ("sesion_id") REFERENCES "sesion"("sesion_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesion_producto" ADD CONSTRAINT "sesion_producto_sesion_id_fkey" FOREIGN KEY ("sesion_id") REFERENCES "sesion"("sesion_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesion_producto" ADD CONSTRAINT "sesion_producto_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "producto"("producto_id") ON DELETE CASCADE ON UPDATE CASCADE;

