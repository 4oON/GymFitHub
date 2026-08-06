import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  // Capacitor 用本地服务器托管资源，必须用相对路径，否则 JS/CSS 404 导致黑屏
  base: './',
  plugins: [react()],
  server: {
    host: true, // 监听所有网络接口
    port: 5173, // 默认端口
    strictPort: false, // 如果端口被占用，自动尝试下一个
  },
  resolve: {
    alias: {
      // 将 @ 指向 frontend/src 文件夹（新项目）
      '@': path.resolve(__dirname, './src'),
      // 支持裸导入路径（指向新项目）
      'shared': path.resolve(__dirname, './src/shared'),
      'features': path.resolve(__dirname, './src/features'),
    },
  },
})
