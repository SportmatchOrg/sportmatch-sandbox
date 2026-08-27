-- CreateTable
CREATE TABLE "participantes" (
    "id" TEXT NOT NULL,
    "partidoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participantes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "participantes_usuarioId_idx" ON "participantes"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "participantes_partidoId_usuarioId_key" ON "participantes"("partidoId", "usuarioId");

-- AddForeignKey
ALTER TABLE "participantes" ADD CONSTRAINT "participantes_partidoId_fkey" FOREIGN KEY ("partidoId") REFERENCES "partidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participantes" ADD CONSTRAINT "participantes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
