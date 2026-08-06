import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './db/client';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import profileRouter from './routes/profile';
import workoutRouter from './routes/workout';
import routineRouter from './routes/routine';
import aiRouter from './routes/ai';
import aiCoachRouter from './routes/aiCoach';
import weeklyReportRouter from './routes/weeklyReport';
import { startWeeklyReportAutoGeneration } from './services/weeklyReportAutoGenService';

// 加载环境变量
dotenv.config();

// 数据库连接检查
async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// 启动时检查数据库连接
checkDatabaseConnection();

// 启动自动周报告生成服务
startWeeklyReportAutoGeneration();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// 中间件 - CORS 配置支持 credentials
const corsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        // 允许没有 origin 的请求（如 curl 或移动端）
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            /^http:\/\/localhost:\d+$/,  // 所有 localhost 端口
            /^https:\/\/kilo-zenfit.*\.vercel\.app$/,  // 所有 Vercel 预览/生产 URL
            /^capacitor:\/\/localhost$/,  // Capacitor iOS 原生壳
            /^ionic:\/\/localhost$/,  // Ionic/Capacitor Android 原生壳
        ];
        
        if (allowedOrigins.some(pattern => pattern.test(origin))) {
            callback(null, true);
        } else {
            console.warn('[CORS] Blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 路由
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/workout', workoutRouter);
app.use('/api/routine', routineRouter);
app.use('/api/ai', aiRouter);
app.use('/api/ai/coach', aiCoachRouter);
app.use(weeklyReportRouter);

// 系统健康检查端点（不需要认证）
app.get('/api/system/health', async (_req: Request, res: Response) => {
  try {
    // 测试数据库连接
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 根路由
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'ZenFit Backend API',
    version: '1.0.1', // 更新版本号以触发Railway重新部署
    status: 'running',
    endpoints: {
      systemHealth: '/api/system/health',
      health: '/api/health',
      auth: '/api/auth',
      profile: '/api/profile',
      workout: '/api/workout',
      routine: '/api/routine',
      ai: '/api/ai',
      aiCoach: '/api/ai/coach',
      weeklyReports: '/api/weekly-reports'
    }
  });
});

// 404 处理
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// 错误处理
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 ZenFit Backend Server is running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`👤 Profile API: http://localhost:${PORT}/api/profile`);
  console.log(`💪 Workout API: http://localhost:${PORT}/api/workout`);
  console.log(`📋 Routine API: http://localhost:${PORT}/api/routine`);
  console.log(`🤖 AI API: http://localhost:${PORT}/api/ai`);
  console.log(`👨‍🏫 AI Coach API: http://localhost:${PORT}/api/ai/coach`);
  console.log(`📈 Weekly Reports API: http://localhost:${PORT}/api/weekly-reports`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app; 
