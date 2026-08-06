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
import { MainApp } from './pages/MainApp'; // 导入旧UI作为主应用

function App() {
  const [notification, setNotification] = useState<string | null>(null);

  const handleNotify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <Routes>
        {/* Development Test Routes - 全屏显示 */}
        <Route path="/dev/auth-test" element={<AuthProfileTestPanel />} />
        <Route path="/dev/pdf-svg-test" element={<PDFSVGPathTester />} />
        <Route path="/dev/detail1-analyzer" element={<Detail1PathAnalyzer />} />
        <Route path="/dev/pdf-debugger" element={<PDFDebuggerTestPage />} />
        <Route path="/dev/ui-test" element={
          <div className="max-w-md mx-auto min-h-screen flex flex-col relative shadow-2xl shadow-black bg-slate-950">
            <DashboardPage onNotify={handleNotify} />
          </div>
        } />
        <Route path="/dev/workout-test" element={
          <div className="max-w-md mx-auto min-h-screen flex flex-col relative shadow-2xl shadow-black bg-slate-950">
            <WorkoutTestPanel />
          </div>
        } />
        <Route path="/dev/mobile-report-test" element={
          <div className="max-w-md mx-auto min-h-screen flex flex-col relative shadow-2xl shadow-black bg-slate-950">
            <MobileReportTestPage />
          </div>
        } />
        <Route path="/dev/share-card-demo" element={
          <div className="max-w-md mx-auto min-h-screen flex flex-col relative shadow-2xl shadow-black bg-slate-950">
            <ShareCardDemoPage />
          </div>
        } />

        {/* Public Routes */}
        <Route path="/login" element={
          <div className="max-w-md mx-auto min-h-screen flex flex-col relative shadow-2xl shadow-black bg-slate-950">
            <LoginPage />
          </div>
        } />
        <Route path="/register" element={
          <div className="max-w-md mx-auto min-h-screen flex flex-col relative shadow-2xl shadow-black bg-slate-950">
            <RegisterPage />
          </div>
        } />

        {/* Protected Routes - 使用旧UI作为主应用 */}
        <Route
          path="/app/*"
          element={
            <div className="max-w-md mx-auto min-h-screen flex flex-col relative shadow-2xl shadow-black bg-slate-950">
              <PrivateRoute>
                <MainApp />
              </PrivateRoute>
            </div>
          }
        />

        {/* 保留新的Dashboard和Profile页面用于测试 */}
        <Route
          path="/dashboard"
          element={
            <div className="max-w-md mx-auto min-h-screen flex flex-col relative shadow-2xl shadow-black bg-slate-950">
              <PrivateRoute>
                <DashboardPage onNotify={handleNotify} />
              </PrivateRoute>
            </div>
          }
        />
        <Route
          path="/profile"
          element={
            <div className="max-w-md mx-auto min-h-screen flex flex-col relative shadow-2xl shadow-black bg-slate-950">
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            </div>
          }
        />
        <Route
          path="/health-settings"
          element={
            <div className="max-w-md mx-auto min-h-screen flex flex-col relative shadow-2xl shadow-black bg-slate-950">
              <PrivateRoute>
                <HealthSettingsPage />
              </PrivateRoute>
            </div>
          }
        />

        {/* Default Route - 重定向到主应用 */}
        <Route path="/" element={<Navigate to="/app" replace />} />

        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </div>
  );
}

export default App;
