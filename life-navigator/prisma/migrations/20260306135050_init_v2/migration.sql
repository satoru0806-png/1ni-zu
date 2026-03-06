/*
  Warnings:

  - You are about to drop the `DailyMIT` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LifeScore` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Memo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Reflection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `description` on the `Dream` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `Dream` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Dream` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Dream` table. All the data in the column will be lost.
  - Added the required column `text` to the `Dream` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "DailyMIT_date_key";

-- DropIndex
DROP INDEX "LifeScore_date_key";

-- DropIndex
DROP INDEX "Reflection_date_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DailyMIT";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "LifeScore";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Memo";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Reflection";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "DayLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "mit1" TEXT,
    "mit2" TEXT,
    "mit3" TEXT,
    "doneNote" TEXT,
    "gratitudeNote" TEXT,
    "tomorrowPlan" TEXT,
    "relationshipScore" INTEGER NOT NULL DEFAULT 50,
    "moneyScore" INTEGER NOT NULL DEFAULT 50,
    "workScore" INTEGER NOT NULL DEFAULT 50,
    "healthScore" INTEGER NOT NULL DEFAULT 50,
    "memoRaw" TEXT,
    "memoSummary" TEXT,
    "memoTasksJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Dream" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Dream" ("createdAt", "id") SELECT "createdAt", "id" FROM "Dream";
DROP TABLE "Dream";
ALTER TABLE "new_Dream" RENAME TO "Dream";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "DayLog_date_key" ON "DayLog"("date");
