-- DropIndex
DROP INDEX "Room_code_key";

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "code";

-- CreateIndex
CREATE UNIQUE INDEX "Room_name_key" ON "Room"("name");
