/**
 * 测试PDF读取
 */

const fs = require('fs');
const path = require('path');

// 尝试不同的导入方式
async function testPDFParse() {
    console.log('测试PDF解析库...\n');

    // 方法1: 默认导入
    try {
        const pdf1 = require('pdf-parse');
        console.log('方法1 - require("pdf-parse"):', typeof pdf1);
        console.log('Keys:', Object.keys(pdf1));
    } catch (e) {
        console.log('方法1失败:', e.message);
    }

    // 方法2: PDFParse类
    try {
        const { PDFParse } = require('pdf-parse');
        console.log('\n方法2 - PDFParse类:', typeof PDFParse);
        if (PDFParse) {
            const parser = new PDFParse();
            console.log('Parser实例:', typeof parser);
            console.log('Parser方法:', Object.getOwnPropertyNames(Object.getPrototypeOf(parser)));
        }
    } catch (e) {
        console.log('方法2失败:', e.message);
    }

    // 方法3: 尝试读取实际PDF
    try {
        console.log('\n\n尝试读取PDF文件...');
        const pdfPath = 'C:\\project\\report\\ZenFit_训练报告_2026-01-06.pdf';

        if (!fs.existsSync(pdfPath)) {
            console.log('PDF文件不存在:', pdfPath);
            return;
        }

        const dataBuffer = fs.readFileSync(pdfPath);
        console.log('PDF文件大小:', dataBuffer.length, 'bytes');

        // 尝试使用PDFParse类
        const { PDFParse } = require('pdf-parse');
        const parser = new PDFParse();
        const data = await parser.parse(dataBuffer);

        console.log('\n=== PDF内容 ===');
        console.log('页数:', data.numpages);
        console.log('文本长度:', data.text.length);
        console.log('\n前1000个字符:');
        console.log(data.text.substring(0, 1000));

    } catch (e) {
        console.log('方法3失败:', e.message);
        console.log('错误堆栈:', e.stack);
    }
}

testPDFParse().catch(console.error);
