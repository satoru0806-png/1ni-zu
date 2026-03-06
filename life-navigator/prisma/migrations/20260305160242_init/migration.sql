-- CreateTable
CREATE TABLE "Dream" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DailyMIT" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "task1" TEXT NOT NULL,
    "task1Done" BOOLEAN NOT NULL DEFAULT false,
    "task2" TEXT NOT NULL,
    "task2Done" BOOLEAN NOT NULL DEFAULT false,
    "task3" TEXT NOT NULL,
    "task3Done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Reflection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "accomplished" TEXT NOT NULL,
    "gratitude" TEXT NOT NULL,
    "tomorrowPlan" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LifeScore" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "relationships" INTEGER NOT NULL DEFAULT 50,
    "money" INTEGER NOT NULL DEFAULT 50,
    "work" INTEGER NOT NULL DEFAULT 50,
    "health" INTEGER NOT NULL DEFAULT 50,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Memo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "extractedTasks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyMIT_date_key" ON "DailyMIT"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Reflection_date_key" ON "Reflection"("date");

-- CreateIndex
CREATE UNIQUE INDEX "LifeScore_date_key" ON "LifeScore"("date");
