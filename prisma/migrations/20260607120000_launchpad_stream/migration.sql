-- AlterTable
ALTER TABLE "LaunchpadLink" ADD COLUMN "streamId" TEXT;

-- CreateIndex
CREATE INDEX "LaunchpadLink_streamId_idx" ON "LaunchpadLink"("streamId");

-- AddForeignKey
ALTER TABLE "LaunchpadLink" ADD CONSTRAINT "LaunchpadLink_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream"("id") ON DELETE SET NULL ON UPDATE CASCADE;
