import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

/**
 * 模型测试脚本
 * 尝试不同的模型名称，找出哪个可用
 */
async function testModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        console.error('❌ 错误：未找到 GEMINI_API_KEY 环境变量');
        return;
    }

    console.log('🔍 开始测试不同的 Gemini 模型...\n');
    console.log(`API Key (前10位): ${apiKey.substring(0, 10)}...`);
    console.log('─'.repeat(80));

    const genAI = new GoogleGenerativeAI(apiKey);

    // 要测试的模型列表
    const modelsToTest = [
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-pro',
        'gemini-1.0-pro',
        'models/gemini-1.5-flash',
        'models/gemini-1.5-pro',
        'gemini-2.0-flash-exp',
        'gemini-1.5-flash-8b',
        'gemini-2.0-flash-lite',
    ];

    const testPrompt = "Say 'Hello' in one word.";
    const results: Array<{ model: string; status: string; response?: string; error?: string }> = [];

    for (const modelName of modelsToTest) {
        try {
            console.log(`\n📝 测试模型: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            
            const result = await model.generateContent(testPrompt);
            const response = await result.response;
            const text = response.text();
            
            console.log(`   ✅ 成功！响应: ${text.substring(0, 50)}`);
            results.push({
                model: modelName,
                status: '✅ 可用',
                response: text.substring(0, 50)
            });
        } catch (error: any) {
            const errorMsg = error.message || String(error);
            const status = error.status || 'unknown';
            
            console.log(`   ❌ 失败 (${status}): ${errorMsg.substring(0, 100)}`);
            results.push({
                model: modelName,
                status: `❌ 不可用 (${status})`,
                error: errorMsg.substring(0, 100)
            });
        }
    }

    // 输出汇总
    console.log('\n' + '─'.repeat(80));
    console.log('\n📊 测试结果汇总：\n');
    console.table(results);

    // 找出可用的模型
    const availableModels = results.filter(r => r.status.includes('✅'));
    
    if (availableModels.length > 0) {
        console.log('\n✅ 可用的模型：');
        availableModels.forEach(m => {
            console.log(`   - ${m.model}`);
        });
        console.log(`\n💡 建议在 geminiService.ts 中使用: ${availableModels[0].model}`);
    } else {
        console.log('\n❌ 没有找到可用的模型！');
        console.log('可能的原因：');
        console.log('  1. API Key 无效或过期');
        console.log('  2. Google Cloud 项目未启用 Generative AI API');
        console.log('  3. 账户欠费或被限制');
        console.log('  4. 网络连接问题');
    }

    console.log('\n' + '─'.repeat(80));
    console.log('测试完成！\n');
}

// 运行测试
testModels().catch(console.error);