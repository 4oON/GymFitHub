/**
 * iOS健康数据API测试脚本
 * 
 * 使用方法：
 * 1. 确保后端服务正在运行（npm run dev）
 * 2. 运行此脚本：node test-health-api.js
 */

const https = require('https');
const http = require('http');

// 配置
const API_URL = 'http://localhost:3001';
// 使用随机邮箱避免冲突
const randomId = Date.now();
const TEST_EMAIL = `healthtest${randomId}@example.com`;
const TEST_PASSWORD = 'password123';

let authToken = '';

// 辅助函数：发送HTTP请求
function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_URL + path);
        const options = {
            hostname: url.hostname,
            port: url.port || 80,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve({ status: res.statusCode, data: response });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// 测试函数
async function test1_Register() {
    console.log('\n📝 测试1: 注册新用户');
    try {
        const response = await makeRequest('POST', '/api/auth/register', {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });

        if (response.status === 201 || response.status === 400) {
            console.log('✅ 注册成功或用户已存在');
            return true;
        } else {
            console.log('❌ 注册失败:', response.data);
            return false;
        }
    } catch (error) {
        console.log('❌ 请求失败:', error.message);
        return false;
    }
}

async function test2_Login() {
    console.log('\n🔐 测试2: 用户登录');
    try {
        const response = await makeRequest('POST', '/api/auth/login', {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });

        if (response.status === 200 && response.data.token) {
            authToken = response.data.token;
            console.log('✅ 登录成功');
            console.log('   Token:', authToken.substring(0, 20) + '...');
            return true;
        } else {
            console.log('❌ 登录失败:', response.data);
            return false;
        }
    } catch (error) {
        console.log('❌ 请求失败:', error.message);
        return false;
    }
}

async function test3_CheckAuthorization() {
    console.log('\n🔍 测试3: 检查健康数据授权状态');
    try {
        const response = await makeRequest('GET', '/api/health/authorization', null, authToken);

        if (response.status === 200) {
            console.log('✅ 授权状态查询成功');
            console.log('   启用状态:', response.data.enabled);
            console.log('   同意状态:', response.data.consented);
            return true;
        } else {
            console.log('❌ 查询失败:', response.data);
            return false;
        }
    } catch (error) {
        console.log('❌ 请求失败:', error.message);
        return false;
    }
}

async function test4_EnableHealthSync() {
    console.log('\n✨ 测试4: 启用健康数据同步');
    try {
        const response = await makeRequest('POST', '/api/health/enable', null, authToken);

        if (response.status === 200) {
            console.log('✅ 健康数据同步已启用');
            console.log('   消息:', response.data.message);
            return true;
        } else {
            console.log('❌ 启用失败:', response.data);
            return false;
        }
    } catch (error) {
        console.log('❌ 请求失败:', error.message);
        return false;
    }
}

async function test5_SyncHealthData() {
    console.log('\n📊 测试5: 同步健康数据');

    const testData = [
        { weight: 75.5, bodyFatPercent: 19.0, gender: 'male', day: '第1天' },
        { weight: 75.2, bodyFatPercent: 18.8, gender: 'male', day: '第2天' },
        { weight: 74.9, bodyFatPercent: 18.5, gender: 'male', day: '第3天' },
    ];

    for (const data of testData) {
        try {
            const response = await makeRequest('POST', '/api/health/sync', {
                weight: data.weight,
                bodyFatPercent: data.bodyFatPercent,
                gender: data.gender
            }, authToken);

            if (response.status === 200) {
                console.log(`✅ ${data.day} 数据同步成功 - 体重: ${data.weight}kg, 体脂率: ${data.bodyFatPercent}%`);
            } else {
                console.log(`❌ ${data.day} 同步失败:`, response.data);
                return false;
            }
        } catch (error) {
            console.log(`❌ ${data.day} 请求失败:`, error.message);
            return false;
        }
    }

    return true;
}

async function test6_GetLatestData() {
    console.log('\n📈 测试6: 获取最新健康数据');
    try {
        const response = await makeRequest('GET', '/api/health/latest', null, authToken);

        if (response.status === 200) {
            console.log('✅ 获取最新数据成功');
            console.log('   体重:', response.data.data.weight, 'kg');
            console.log('   体脂率:', response.data.data.bodyFatPercent, '%');
            console.log('   性别:', response.data.data.gender);
            return true;
        } else {
            console.log('❌ 获取失败:', response.data);
            return false;
        }
    } catch (error) {
        console.log('❌ 请求失败:', error.message);
        return false;
    }
}

async function test7_GetHistory() {
    console.log('\n📜 测试7: 获取健康数据历史');
    try {
        const response = await makeRequest('GET', '/api/health/history?limit=10', null, authToken);

        if (response.status === 200) {
            console.log('✅ 获取历史记录成功');
            console.log('   记录数量:', response.data.count);
            return true;
        } else {
            console.log('❌ 获取失败:', response.data);
            return false;
        }
    } catch (error) {
        console.log('❌ 请求失败:', error.message);
        return false;
    }
}

async function test8_CalculateWeight() {
    console.log('\n💪 测试8: 计算推荐训练重量');
    try {
        const response = await makeRequest('POST', '/api/health/calculate-weight', {
            lastWorkoutWeight: 60
        }, authToken);

        if (response.status === 200) {
            console.log('✅ 重量计算成功');
            console.log('   推荐重量:', response.data.recommendedWeight, 'kg');
            console.log('   调整建议:', response.data.adjustmentReason);
            console.log('   变化百分比:', response.data.percentageChange, '%');
            return true;
        } else {
            console.log('❌ 计算失败:', response.data);
            return false;
        }
    } catch (error) {
        console.log('❌ 请求失败:', error.message);
        return false;
    }
}

async function test9_GetWeightTrend() {
    console.log('\n📉 测试9: 获取体重趋势');
    try {
        const response = await makeRequest('GET', '/api/health/weight-trend?days=30', null, authToken);

        if (response.status === 200) {
            console.log('✅ 趋势分析成功');
            console.log('   趋势:', response.data.trend);
            console.log('   变化量:', response.data.change, 'kg');
            console.log('   平均体重:', response.data.averageWeight, 'kg');
            console.log('   数据点数:', response.data.dataPoints);
            return true;
        } else {
            console.log('❌ 分析失败:', response.data);
            return false;
        }
    } catch (error) {
        console.log('❌ 请求失败:', error.message);
        return false;
    }
}

async function test10_DisableHealthSync() {
    console.log('\n🔒 测试10: 禁用健康数据同步');
    try {
        const response = await makeRequest('POST', '/api/health/disable', null, authToken);

        if (response.status === 200) {
            console.log('✅ 健康数据同步已禁用');
            console.log('   消息:', response.data.message);
            return true;
        } else {
            console.log('❌ 禁用失败:', response.data);
            return false;
        }
    } catch (error) {
        console.log('❌ 请求失败:', error.message);
        return false;
    }
}

// 主测试流程
async function runAllTests() {
    console.log('='.repeat(60));
    console.log('🧪 iOS健康数据API测试开始');
    console.log('='.repeat(60));
    console.log('📍 API地址:', API_URL);
    console.log('⏰ 测试时间:', new Date().toLocaleString('zh-CN'));

    const tests = [
        test1_Register,
        test2_Login,
        test3_CheckAuthorization,
        test4_EnableHealthSync,
        test5_SyncHealthData,
        test6_GetLatestData,
        test7_GetHistory,
        test8_CalculateWeight,
        test9_GetWeightTrend,
        test10_DisableHealthSync,
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        const result = await test();
        if (result) {
            passed++;
        } else {
            failed++;
        }
        // 等待一下，避免请求太快
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 测试结果汇总');
    console.log('='.repeat(60));
    console.log(`✅ 通过: ${passed} 个测试`);
    console.log(`❌ 失败: ${failed} 个测试`);
    console.log(`📈 成功率: ${((passed / tests.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    if (failed === 0) {
        console.log('\n🎉 所有测试通过！iOS健康数据API工作正常！');
    } else {
        console.log('\n⚠️  部分测试失败，请检查后端服务和数据库连接。');
    }
}

// 运行测试
console.log('\n⚡ 准备运行测试...');
console.log('💡 提示：请确保后端服务正在运行（npm run dev）\n');

setTimeout(() => {
    runAllTests().catch(error => {
        console.error('\n❌ 测试过程中发生错误:', error);
        process.exit(1);
    });
}, 1000);