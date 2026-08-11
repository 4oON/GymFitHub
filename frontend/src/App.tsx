import WorkoutTestPanel from './dev/components/WorkoutTestPanel';
import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import HealthSettingsPage from './pages/HealthSettingsPage';
import PrivateRoute from './components/PrivateRoute';
import AuthProfileTestPanel from './dev/components/AuthProfileTestPanel';
import PDFSVGPathTester from './dev/components/PDFSVGPathTester';
import Detail1PathAnalyzer from './dev/components/Detail1PathAnalyzer';
import PDFDebuggerTestPage from './dev/components/PDFDebuggerTestPage';
import MobileReportTestPage from './pages/MobileReportTestPage';
import ShareCardDemoPage from './pages/ShareCardDemoPage';
import { MainApp } from './pages/MainApp';
import { useHealthSyncPrompt } from './hooks/useHealthSyncPrompt';
import ConfirmDialog from './shared/components/ui/ConfirmDialog';

/**
 * 统一的"屏幕边界"容器：整个 app 唯一的视口高度定义点。
 * 所有页面在此边界内渲染，由各自页面根容器（h-full + overflow-y-auto）承担滚动。
 */
function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-md mx-auto h-[100dvh] flex flex-col relative overflow-hidden bg-slate-950 shadow-2xl shadow-black">
      {children}
    </div>
  );
}

function App() {
  const [notification, setNotification] = useState<string | null>(null);
  const { showPrompt, onConfirm, onCancel } = useHealthSyncPrompt();

  const handleNotify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="bg-slate-950 min-h-[100dvh] text-slate-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <Routes>
        {/* Development Test Routes - 全屏显示 */}
        <Route path="/dev/auth-test" element={<AuthProfileTestPanel />} />
        <Route path="/dev/pdf-svg-test" element={<PDFSVGPathTester />} />
        <Route path="/dev/detail1-analyzer" element={<Detail1PathAnalyzer />} />
        <Route path="/dev/pdf-debugger" element={<PDFDebuggerTestPage />} />
        <Route path="/dev/ui-test" element={
          <Screen>
            <DashboardPage onNotify={handleNotify} />
          </Screen>
        } />
        <Route path="/dev/workout-test" element={
          <Screen>
            <WorkoutTestPanel />
          </Screen>
        } />
        <Route path="/dev/mobile-report-test" element={
          <Screen>
            <MobileReportTestPage />
          </Screen>
        } />
        <Route path="/dev/share-card-demo" element={
          <Screen>
            <ShareCardDemoPage />
          </Screen>
        } />

        {/* Public Routes */}
        <Route path="/login" element={
          <Screen>
            <LoginPage />
          </Screen>
        } />
        <Route path="/register" element={
          <Screen>
            <RegisterPage />
          </Screen>
        } />

        {/* Protected Routes - 使用旧UI作为主应用 */}
        <Route
          path="/app/*"
          element={
            <Screen>
              <PrivateRoute>
                <MainApp />
              </PrivateRoute>
            </Screen>
          }
        />

        {/* 保留新的Dashboard和Profile页面用于测试 */}
        <Route
          path="/dashboard"
          element={
            <Screen>
              <PrivateRoute>
                <DashboardPage onNotify={handleNotify} />
              </PrivateRoute>
            </Screen>
          }
        />
        <Route
          path="/profile"
          element={
            <Screen>
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            </Screen>
          }
        />
        <Route
          path="/health-settings"
          element={
            <Screen>
              <PrivateRoute>
                <HealthSettingsPage />
              </PrivateRoute>
            </Screen>
          }
        />

        {/* Default Route - 重定向到主应用 */}
        <Route path="/" element={<Navigate to="/app" replace />} />

        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>

      <ConfirmDialog
        isOpen={showPrompt}
        title="同步 Apple Health 数据"
        message="ZenFit 可以从 Apple Health 读取您的体重、体脂、心率、睡眠等数据，用于生成更个性化的训练计划。是否立即同步？"
        confirmText="立即同步"
        cancelText="稍后再说"
        variant="info"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </div>
  );
}

export default App;
