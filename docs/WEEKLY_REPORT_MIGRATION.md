# Weekly Report 数据库迁移 SQL

请在 Supabase SQL Editor 中执行以下 SQL:

```sql
-- CreateTable
CREATE TABLE "weekly_reports" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "week_number" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "date_range_start" TEXT NOT NULL,
    "date_range_end" TEXT NOT NULL,
    "stats" JSONB NOT NULL,
    "muscle_distribution" JSONB NOT NULL,
    "weekly_progress" JSONB,
    "sessions" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "weekly_reports_user_id_year_week_number_idx" ON "weekly_reports"("user_id", "year", "week_number");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_reports_user_id_year_week_number_key" ON "weekly_reports"("user_id", "year", "week_number");

-- AddForeignKey
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

## 执行步骤

1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 复制上面的 SQL 并执行
4. 确认表创建成功
