# PDF 调试器启动指南

## 🚀 快速启动

### 1. 启动前端开发服务器

```bash
# 进入前端目录
cd frontend

# 安装依赖（如果还没安装）
npm install

# 启动开发服务器
npm run dev
```

前端服务器将在 **http://localhost:5173** 启动

### 2. 访问 PDF 调试器

打开浏览器，访问：

```
http://localhost:5173/dev/pdf-debugger
```

## ✅ 不需要后端服务器

PDF 调试器是一个**纯前端工具**，不需要启动后端服务器即可使用。

- ✅ 只需要启动前端开发服务器
- ✅ 使用模拟数据进行测试
- ✅ 所有 PDF 生成都在浏览器中完成

## 📱 使用界面

访问 `http://localhost:5173/dev/pdf-debugger` 后，你会看到：

```
┌─────────────────────────────────────────────────────────────┐
│  左侧：控制面板                │  右侧：PDF 实时预览          │
├──────────────────────────────┼──────────────────────────────┤
│                              │                              │
│  [重置为默认值]              │                              │
│  [应用建议配置]              │        PDF 预览区域          │
│  [下载 PDF]                  │                              │
│                              │                              │
│  Hero Metrics 区域           │                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━  │                              │
│  标签到数字间距: 22mm        │                              │
│  [━━━━━━━━━━━━━━━━━━━━━━]  │                              │
│                              │                              │
│  标签字间距: 1.2mm           │                              │
│  [━━━━━━━━━━━━━━━━━━━━━━]  │                              │
│                              │                              │
│  ... 更多参数 ...            │                              │
│                              │                              │
└──────────────────────────────┴──────────────────────────────┘
```

## 🎮 操作说明

### 调整参数
1. 使用滑动条调整任意参数
2. 等待 0.5 秒后，预览会自动更新
3. 观察右侧 PDF 预览的变化

### 快捷操作
- **重置为默认值**：恢复到代码中的原始配置
- **应用建议配置**：使用优化后的推荐参数
- **下载 PDF**：使用当前配置生成并下载 PDF 文件

### 参数说明

#### Hero Metrics 区域
- **labelToValueGap** (22mm → 24mm)：标签到数字的垂直间距，增加可防止重叠
- **charSpacing** (1.2mm → 1.5mm)：标签字间距，增加可提升呼吸感
- **dividerX** (92mm → 95mm)：左右区域分割线位置，调整可给 KG 单位留足空间
- **heroFontSize** (72pt)：大数字字号
- **rowTopY** (0mm → 5mm)：顶部起始高度偏移，增加可压低起始点
- **rightPaddingRight** (2mm → 4mm)：SETS 右边距，增加可让数字内缩

#### Table 区域
- **titleGap** (6mm → 8mm)：EXERCISE DETAILS 标题与横线的间距
- **headerFontSize** (8pt)：表头字号
- **headerCharSpacing** (0.6mm)：表头字间距
- **rowHeight** (9mm)：表格行高

#### Global 配置
- **margin** (20mm)：页面边距
- **lineWidth** (0.2mm)：线条宽度

## 🔧 故障排除

### 问题 1: 页面无法访问
**解决方案**：
```bash
# 确保前端服务器正在运行
cd frontend
npm run dev
```

### 问题 2: 预览不显示
**原因**：可能是字体文件加载失败

**解决方案**：
1. 检查 `frontend/public/fonts/` 目录是否存在
2. 确保以下字体文件存在：
   - Inter-Regular.ttf
   - Inter-Bold.ttf
   - Inter-SemiBold.ttf
   - Oswald-Bold.ttf
   - Oswald-Regular.ttf
   - NotoSansSC-Regular.ttf
   - NotoSansSC-Bold.ttf

### 问题 3: 调整参数后没有反应
**原因**：防抖延迟（500ms）

**解决方案**：等待 0.5 秒后预览会自动更新

### 问题 4: 下载的 PDF 与预览不一致
**原因**：浏览器 PDF 渲染差异

**解决方案**：以下载的 PDF 为准，预览仅供参考

## 📊 测试数据

调试器使用以下模拟数据：

- **训练时长**：60 分钟
- **总容量**：3,080 KG
- **动作数量**：6 个
  - 杠铃深蹲 (Legs)
  - 卧推 (Chest)
  - 硬拉 (Back)
  - 肩推 (Shoulders)
  - 二头弯举 (Arms)
  - 卷腹 (Abs)
- **用户信息**：
  - 体重：75 kg
  - 年龄：30 岁
  - 性别：男

## 🎯 推荐工作流程

1. **启动服务器**
   ```bash
   cd frontend && npm run dev
   ```

2. **打开调试器**
   - 访问：http://localhost:5173/dev/pdf-debugger

3. **应用建议配置**
   - 点击"应用建议配置"按钮
   - 查看优化后的效果

4. **微调参数**
   - 根据实际需求调整个别参数
   - 实时观察预览变化

5. **下载测试**
   - 点击"下载 PDF"按钮
   - 在 PDF 阅读器中查看最终效果

6. **保存配置**
   - 记录满意的参数值
   - 可以在代码中更新 `SUGGESTED_PDF_CONFIG`

## 📝 相关文档

- [PDF 调试器使用指南](./PDF_DEBUGGER_GUIDE.md) - 详细功能说明
- [PDF 生成技术文档](./PDF_GENERATION_TECHNICAL_DOCUMENTATION.md) - 技术实现细节
- [PDF 布局优化](./PDF_LAYOUT_OPTIMIZATION.md) - 布局优化建议

## 💡 提示

- 调试器会自动保存你的调整（在当前会话中）
- 刷新页面会重置为默认配置
- 建议使用 Chrome 或 Edge 浏览器以获得最佳体验
- PDF 预览可能需要几秒钟加载时间

## 🎉 开始使用

现在你可以：

1. 打开终端
2. 运行 `cd frontend && npm run dev`
3. 访问 http://localhost:5173/dev/pdf-debugger
4. 开始调试 PDF 布局！

祝你调试愉快！🚀