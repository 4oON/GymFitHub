# AI Provider 多配置管理功能

## 功能概述

新增多 AI 提供商配置管理功能，支持：
- 保存多个 AI 配置（如 "Moonshot CN", "OpenAI" 等）
- 配置存储在后端数据库（Supabase）
- 跨平台同步
- 余额查询和显示（Moonshot/Kimi）

## 数据库设置

### 1. 执行数据库迁移

在 Supabase SQL Editor 中执行以下 SQL：

```sql
-- Create the ai_provider_configs table
CREATE TABLE IF NOT EXISTS "ai_provider_configs" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT NOT NULL,
    "base_url" TEXT,
    "api_key" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "cached_models" JSONB,
    "balance_info" JSONB,
    "last_balance_check" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "ai_provider_configs_user_id_idx" ON "ai_provider_configs"("user_id");
CREATE INDEX IF NOT EXISTS "ai_provider_configs_user_id_is_default_idx" ON "ai_provider_configs"("user_id", "is_default");

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ai_provider_configs_updated_at ON "ai_provider_configs";
CREATE TRIGGER update_ai_provider_configs_updated_at
    BEFORE UPDATE ON "ai_provider_configs"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

文件位置：`backend/prisma/migrations/add_ai_provider_config/migration.sql`

## 前端使用

### 打开配置管理器

```typescript
import { AIProviderConfigManager } from '@/features/ai';

// 在组件中使用
const [showConfigManager, setShowConfigManager] = useState(false);

<AIProviderConfigManager
    isOpen={showConfigManager}
    onClose={() => setShowConfigManager(false)}
/>
```

### 显示余额

```typescript
import { AIBalanceDisplay } from '@/features/ai';

// 紧凑模式（用于 AI Coach 界面）
<AIBalanceDisplay config={selectedConfig} compact />

// 完整模式
<AIBalanceDisplay config={selectedConfig} />
```

### 获取配置

```typescript
import { aiConfigBackendService } from '@/features/ai';

// 获取所有配置
const configs = await aiConfigBackendService.getConfigs();

// 获取默认配置
const defaultConfig = await aiConfigBackendService.getDefaultConfig();

// 查询余额
const balance = await aiConfigBackendService.getBalance(configId);
```

## 后端 API

### 端点列表

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/ai/configs` | 获取所有配置 |
| POST | `/api/ai/configs` | 创建配置 |
| PUT | `/api/ai/configs/:id` | 更新配置 |
| DELETE | `/api/ai/configs/:id` | 删除配置 |
| POST | `/api/ai/configs/:id/default` | 设为默认 |
| GET | `/api/ai/configs/:id/balance` | 查询余额 |

### 余额查询

支持 Moonshot/Kimi 余额查询，调用 Moonshot API：
```
GET https://api.moonshot.cn/v1/users/me/balance
```

## 界面截图

### 配置管理器
- 显示所有已保存的 AI 配置
- 每个配置显示：名称、提供商、模型、余额
- 支持设置默认配置
- 支持添加、编辑、删除配置

### 余额显示
- 在配置卡片上显示余额
- 点击刷新按钮更新余额
- 自动格式化（如 ¥1.23万）
- 显示代金券余额（如果有）

## 下一步集成

### 在 AI Coach 中使用

修改 `RoutineCreator.tsx`，在选择 AI 模型时优先使用后端配置：

```typescript
// 加载默认配置
useEffect(() => {
    aiConfigBackendService.getDefaultConfig().then(config => {
        if (config) {
            setSelectedAIConfig(config);
        }
    });
}, []);
```

### 在 Profile 中添加入口

在 Profile 编辑器中添加按钮打开 `AIProviderConfigManager`。

## 安全说明

- API Key 存储在 Supabase 中
- 前端只显示脱敏后的 API Key（前10位 + ...）
- 余额查询通过后端代理，避免暴露 API Key
