-- Alterações que estavam no schema.prisma sem migration (aplicadas antes via db push).

-- AlterTable
ALTER TABLE "AnimalVacina" DROP CONSTRAINT "AnimalVacina_pkey",
ADD CONSTRAINT "AnimalVacina_pkey" PRIMARY KEY ("IdGado", "IdVacina", "DataAplicacao");

-- AlterTable
ALTER TABLE "Fazenda" ADD COLUMN     "IdDono" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "GadoLeiteiro" ALTER COLUMN "UltimaInseminacao" DROP NOT NULL,
ALTER COLUMN "QuantidadePartos" DROP NOT NULL,
ALTER COLUMN "ProducaoLeiteDiariaEmLitros" DROP NOT NULL;

-- AlterTable
ALTER TABLE "UnidadeFederativa" ALTER COLUMN "NomeEstado" SET DATA TYPE VARCHAR(20);

-- AlterTable
ALTER TABLE "Vacina" ADD COLUMN     "Nome" VARCHAR(50) NOT NULL;

-- AddForeignKey
ALTER TABLE "Fazenda" ADD CONSTRAINT "Fazenda_IdDono_fkey" FOREIGN KEY ("IdDono") REFERENCES "Pessoa"("IdPessoa") ON DELETE RESTRICT ON UPDATE CASCADE;
