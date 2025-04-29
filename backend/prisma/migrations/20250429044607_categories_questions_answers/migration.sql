-- CreateTable
CREATE TABLE "Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" TEXT NOT NULL,
    "topic_header" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL,
    "insight_subject" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Question" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "insight_subject" TEXT NOT NULL,
    "insight_direction" TEXT NOT NULL,
    "question_stem" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "question_id" INTEGER NOT NULL,
    "answer_text" TEXT NOT NULL,
    CONSTRAINT "Answer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_insight_subject_key" ON "Category"("insight_subject");

-- CreateIndex
CREATE INDEX "Answer_question_id_idx" ON "Answer"("question_id");
