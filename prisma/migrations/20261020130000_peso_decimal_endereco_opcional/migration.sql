-- DropForeignKey
ALTER TABLE "Pessoa" DROP CONSTRAINT "Pessoa_IdEndereco_fkey";

-- AlterTable
ALTER TABLE "Gado" ALTER COLUMN "PesoNascimentoEmKg" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "Pessoa" ALTER COLUMN "IdEndereco" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Pessoa" ADD CONSTRAINT "Pessoa_IdEndereco_fkey" FOREIGN KEY ("IdEndereco") REFERENCES "Endereco"("IdEndereco") ON DELETE SET NULL ON UPDATE CASCADE;

