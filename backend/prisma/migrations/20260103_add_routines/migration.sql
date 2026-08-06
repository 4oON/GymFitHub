-- CreateTable
CREATE TABLE IF NOT EXISTS "routines" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "routine_exercises" (
    "id" TEXT NOT NULL,
    "routine_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "exercise_name" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routine_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "routines_user_id_idx" ON "routines"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "routine_exercises_routine_id_order_index_idx" ON "routine_exercises"("routine_id", "order_index");

-- AddForeignKey
ALTER TABLE "routines" ADD CONSTRAINT "routines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;