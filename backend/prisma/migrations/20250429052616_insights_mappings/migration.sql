-- CreateTable
CREATE TABLE "Insight" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "tag" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Mapping" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "question_id" INTEGER NOT NULL,
    "answer_id" INTEGER NOT NULL,
    "insight_id" INTEGER,
    CONSTRAINT "Mapping_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Mapping_answer_id_fkey" FOREIGN KEY ("answer_id") REFERENCES "Answer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Mapping_insight_id_fkey" FOREIGN KEY ("insight_id") REFERENCES "Insight" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Insight_tag_key" ON "Insight"("tag");

-- CreateIndex
CREATE INDEX "Mapping_question_id_answer_id_idx" ON "Mapping"("question_id", "answer_id");

-- CreateIndex
CREATE INDEX "Mapping_insight_id_idx" ON "Mapping"("insight_id");
