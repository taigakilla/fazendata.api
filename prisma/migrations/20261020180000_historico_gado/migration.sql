-- AlterTable
ALTER TABLE "Gado" ADD COLUMN     "AtualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "GadoHistorico" (
    "IdHistorico" SERIAL NOT NULL,
    "IdGado" INTEGER NOT NULL,
    "Campo" VARCHAR(40) NOT NULL,
    "ValorAnterior" VARCHAR(100),
    "ValorNovo" VARCHAR(100),
    "IdPessoa" INTEGER,
    "CriadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GadoHistorico_pkey" PRIMARY KEY ("IdHistorico")
);

-- CreateIndex
CREATE INDEX "GadoHistorico_IdGado_CriadoEm_idx" ON "GadoHistorico"("IdGado", "CriadoEm");

-- AddForeignKey
ALTER TABLE "GadoHistorico" ADD CONSTRAINT "GadoHistorico_IdGado_fkey" FOREIGN KEY ("IdGado") REFERENCES "Gado"("IdGado") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GadoHistorico" ADD CONSTRAINT "GadoHistorico_IdPessoa_fkey" FOREIGN KEY ("IdPessoa") REFERENCES "Pessoa"("IdPessoa") ON DELETE SET NULL ON UPDATE CASCADE;

