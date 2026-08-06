/**
 * 分享卡片样式工具
 * 纯内联样式配置，确保 html2canvas 兼容性
 */

export const getColors = () => ({
  background: '#0f172a',
  card: '#1e293b',
  cardBorder: '#334155',
  text: {
    primary: '#f8fafc',
    secondary: '#cbd5e1',
    muted: '#94a3b8',
    subtle: '#64748b'
  },
  accent: {
    emerald: '#10b981',
    cyan: '#06b6d4',
    amber: '#fbbf24',
    orange: '#f97316',
    blue: '#60a5fa',
    purple: '#a78bfa'
  },
  gradients: {
    primary: 'linear-gradient(90deg, #10b981, #06b6d4)',
    card: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)'
  }
});

export const getNeonShadow = (color: string) => ({
  emerald: '0 0 20px rgba(16, 185, 129, 0.3), 0 0 40px rgba(16, 185, 129, 0.1)',
  cyan: '0 0 20px rgba(6, 182, 212, 0.3), 0 0 40px rgba(6, 182, 212, 0.1)',
  amber: '0 0 20px rgba(251, 191, 36, 0.3), 0 0 40px rgba(251, 191, 36, 0.1)',
  blue: '0 0 20px rgba(96, 165, 250, 0.3), 0 0 40px rgba(96, 165, 250, 0.1)'
})[color] || '0 0 20px rgba(16, 185, 129, 0.3)';

// 系统字体栈 - 确保跨平台一致渲染
export const fontFamily = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", sans-serif';

// 字体大小
export const fontSize = {
  xs: '11px',
  sm: '12px',
  base: '13px',
  md: '14px',
  lg: '18px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '28px'
};

// 圆角
export const borderRadius = {
  sm: '6px',
  md: '8px',
  lg: '10px',
  xl: '12px',
  '2xl': '16px'
};

// 间距
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '28px'
};

// 阴影
export const shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.3)',
  md: '0 2px 8px rgba(0,0,0,0.3)',
  lg: '0 4px 12px rgba(0,0,0,0.4)',
  glow: '0 0 20px rgba(16, 185, 129, 0.2)'
};

// 共享卡片基础样式
export const shareCardStyles = {
  container: {
    width: '400px',
    minHeight: '500px',
    backgroundColor: '#0f172a',
    padding: '28px',
    fontFamily,
    color: '#f8fafc'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#f8fafc',
    textAlign: 'center' as const,
    marginBottom: '6px'
  },
  subtitle: {
    fontSize: '14px',
    color: '#94a3b8',
    textAlign: 'center' as const
  },
  highlights: {
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px',
      marginBottom: '24px'
    },
    card: {
      backgroundColor: '#1e293b',
      borderRadius: '12px',
      padding: '16px'
    }
  },
  stats: {
    container: {
      display: 'flex',
      justifyContent: 'space-between',
      backgroundColor: '#1e293b',
      borderRadius: '12px',
      padding: '18px 16px'
    },
    item: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: '6px',
      flex: 1
    }
  },
  overview: {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px'
  },
  footer: {
    textAlign: 'center' as const,
    paddingTop: '12px',
    borderTop: '1px solid #334155'
  }
};
