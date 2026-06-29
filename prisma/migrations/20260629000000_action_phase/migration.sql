-- AlterTable
ALTER TABLE "Action" ADD COLUMN "phase" INTEGER;

-- CreateIndex
CREATE INDEX "Action_phase_idx" ON "Action"("phase");
