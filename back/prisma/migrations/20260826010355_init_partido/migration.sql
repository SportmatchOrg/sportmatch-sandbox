-- CreateEnum
CREATE TYPE "nivel" AS ENUM ('PRINCIPIANTE', 'INTERMEDIO', 'AVANZADO');

-- CreateTable
CREATE TABLE "deportes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deportes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partidos" (
    "id" TEXT NOT NULL,
    "deporteId" TEXT NOT NULL,
    "nivel" "nivel" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "cupo" INTEGER NOT NULL,
    "descripcion" TEXT,
    "organizadorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partidos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deportes_nombre_key" ON "deportes"("nombre");

-- CreateIndex
CREATE INDEX "partidos_fecha_idx" ON "partidos"("fecha");

-- CreateIndex
CREATE INDEX "partidos_deporteId_idx" ON "partidos"("deporteId");

-- AddForeignKey
ALTER TABLE "partidos" ADD CONSTRAINT "partidos_deporteId_fkey" FOREIGN KEY ("deporteId") REFERENCES "deportes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partidos" ADD CONSTRAINT "partidos_organizadorId_fkey" FOREIGN KEY ("organizadorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
