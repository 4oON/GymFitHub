import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 定义模型接口
interface ModelInfo {
    name?: string;
    displayName?: string;
    supportedGenerationMethods?: string[];
}

/**
 * 模型探测脚本
 * 用于检查当前 API Key 可以访问哪些 Gemini 模型
 */
async function checkAvailableModels() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('❌ 错误：未找到 GEMINI_API_KEY 环境变量');
        console.log('请在 .env 文件中设置 GEMINI_API_KEY');
        return;
    }

    console.log('🔍 开始探测可用模型列表...\n');
    console.log(`API Key (前10位): ${apiKey.substring(0, 10)}...`);
    console.log('─'.repeat(80));

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        // 获取模型列表 - 使用类型断言因为SDK可能没有正确的类型定义
        const models = await (genAI as any).listModels() as ModelInfo[];

        if (!models || models.length === 0) {
            console.log('⚠️  警告：未能获取到任何模型列表');
            console.log('可能的原因：');
            console.log('  1. API Key 权限不足');
            console.log('  2. Google Cloud 项目未启用 Generative AI API');
            console.log('  3. 项目欠费或被封禁');
            return;
        }

        console.log(`\n✅ 找到 ${models.length} 个可用模型：\n`);

        // 格式化输出模型信息
        const modelInfo = models.map((model: ModelInfo) => {
            const name = model.name || 'N/A';
            const displayName = model.displayName || 'N/A';
            const methods = model.supportedGenerationMethods || [];

            return {
                '模型ID': name,
                '显示名称': displayName,
                '支持generateContent': methods.includes('generateContent') ? '✓' : '✗',
                '所有支持方法': methods.join(', ')
            };
        });

        console.table(modelInfo);

        // 找出支持 generateContent 的模型
        const compatibleModels = models.filter((m: ModelInfo) =>
            m.supportedGenerationMethods?.includes('generateContent')
        );

        console.log('\n📋 推荐使用的模型（支持 generateContent）：\n');
        compatibleModels.forEach((model: ModelInfo, index: number) => {
            const modelId = model.name?.replace('models/', '') || '';
            console.log(`  ${index + 1}. ${modelId}`);
            console.log(`     显示名称: ${model.displayName}`);
            console.log(`     完整路径: ${model.name}\n`);
        });

        // 检查我们当前使用的模型
        const currentModel = 'gemini-1.5-flash';
        const currentModelExists = compatibleModels.some((m: ModelInfo) =>
            m.name === `models/${currentModel}` || m.name === currentModel
        );

        console.log('─'.repeat(80));
        console.log(`\n🎯 当前代码使用的模型: ${currentModel}`);
        console.log(`   状态: ${currentModelExists ? '✅ 可用' : '❌ 不可用'}\n`);

        if (!currentModelExists) {
            console.log('⚠️  建议修改为以下模型之一：');
            compatibleModels.slice(0, 3).forEach((m: ModelInfo) => {
                const modelId = m.name?.replace('models/', '') || '';
                console.log(`   - ${modelId}`);
            });
        }

    } catch (error: any) {
        console.error('\n❌ 探测出错：', error.message);
        if (error.status) {
            console.error(`   HTTP 状态码: ${error.status}`);
        }
        if (error.statusText) {
            console.error(`   状态文本: ${error.statusText}`);
        }
        console.error('\n完整错误信息：');
        console.error(error);
    }

    console.log('\n' + '─'.repeat(80));
    console.log('探测完成！\n');
}

// 运行探测
checkAvailableModels().catch(console.error);