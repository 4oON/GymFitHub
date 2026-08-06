/**
 * 分享图片生成 Hook - html2canvas 优化版
 * 
 * 优化策略：
 * 1. 等待字体完全加载
 * 2. 强制重排确保尺寸正确
 * 3. 克隆元素避免 transform 影响
 * 4. 使用 onclone 修复克隆后的样式
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseShareImageReturn {
  imageUrl: string | null;
  isGenerating: boolean;
  generateImage: (element: HTMLElement) => Promise<string>;
  downloadImage: (url: string, filename?: string) => void;
  clearImage: () => void;
  error: string | null;
}

const importHtml2Canvas = async () => {
  const html2canvas = (await import('html2canvas')).default;
  return html2canvas;
};

// 等待字体加载完成
const waitForFonts = async (): Promise<void> => {
  try {
    // @ts-ignore
    if (document.fonts && document.fonts.ready) {
      // @ts-ignore
      await document.fonts.ready;
      console.log('[useShareImage] Fonts ready');
    }
  } catch (e) {
    console.warn('[useShareImage] Font wait failed:', e);
  }
  // 额外等待确保渲染完成
  await new Promise(resolve => setTimeout(resolve, 200));
};

// 准备元素用于截图 - 移除 transform 等可能影响渲染的属性
const prepareElementForCapture = (element: HTMLElement): HTMLElement => {
  // 如果元素被 transform 缩放，我们需要获取原始尺寸
  const rect = element.getBoundingClientRect();
  const computed = window.getComputedStyle(element);
  
  console.log('[useShareImage] Element computed style:', {
    transform: computed.transform,
    width: computed.width,
    height: computed.height,
    display: computed.display,
  });
  
  return element;
};

export const useShareImage = (): UseShareImageReturn => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dataUrlRef = useRef<string | null>(null);

  const generateImage = useCallback(async (element: HTMLElement): Promise<string> => {
    setIsGenerating(true);
    setError(null);

    try {
      console.log('[useShareImage] ===== Starting generation =====');
      
      if (!element) {
        throw new Error('Element is null');
      }

      // 步骤 1: 等待字体
      await waitForFonts();
      
      // 步骤 2: 准备元素
      prepareElementForCapture(element);
      
      // 步骤 3: 强制重排确保尺寸正确
      element.getBoundingClientRect();
      
      // 步骤 4: 获取精确尺寸
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      const scrollWidth = element.scrollWidth;
      const scrollHeight = element.scrollHeight;
      
      console.log('[useShareImage] Dimensions:', { 
        width, height, scrollWidth, scrollHeight 
      });

      if (width === 0 || height === 0) {
        throw new Error(`Invalid element size: ${width}x${height}`);
      }

      // 步骤 5: 加载 html2canvas
      const html2canvas = await importHtml2Canvas();
      
      // 步骤 6: 配置选项
      const options: any = {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0f172a',
        logging: true, // 开启调试日志
        width: width,
        height: Math.max(height, scrollHeight),
        windowWidth: width,
        windowHeight: Math.max(height, scrollHeight),
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        
        // 关键：在克隆时修复样式
        onclone: (clonedDoc: Document, clonedElement: HTMLElement) => {
          console.log('[useShareImage] onclone called');
          
          // 确保克隆元素有正确的尺寸
          clonedElement.style.width = `${width}px`;
          clonedElement.style.height = `${Math.max(height, scrollHeight)}px`;
          clonedElement.style.transform = 'none';
          clonedElement.style.position = 'relative';
          clonedElement.style.overflow = 'visible';
          
          // 修复所有子元素的 float 布局
          const floatElements = clonedElement.querySelectorAll('[style*="float"]');
          console.log('[useShareImage] Float elements found:', floatElements.length);
          
          // 修复表格
          const tables = clonedElement.querySelectorAll('table');
          tables.forEach((table, i) => {
            console.log(`[useShareImage] Table ${i}:`, table.offsetWidth, table.offsetHeight);
          });
          
          return clonedElement;
        }
      };

      // 步骤 7: 生成 canvas
      console.log('[useShareImage] Calling html2canvas...');
      const canvas = await html2canvas(element, options);
      
      console.log('[useShareImage] Canvas created:', canvas.width, 'x', canvas.height);

      // 步骤 8: 转为 data URL
      const dataUrl = canvas.toDataURL('image/png', 0.95);
      
      if (!dataUrl || dataUrl.length < 100) {
        throw new Error('Invalid data URL generated');
      }

      // 清理旧 URL
      if (dataUrlRef.current?.startsWith('blob:')) {
        URL.revokeObjectURL(dataUrlRef.current);
      }

      dataUrlRef.current = dataUrl;
      setImageUrl(dataUrl);
      
      console.log('[useShareImage] Success! URL length:', dataUrl.length);
      
      return dataUrl;
      
    } catch (err) {
      const msg = err instanceof Error ? err.message : '生成失败';
      console.error('[useShareImage] Error:', err);
      setError(msg);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const downloadImage = useCallback((url: string, filename?: string) => {
    const name = filename || `zenfit-${Date.now()}.png`;
    
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('[useShareImage] Download failed:', err);
      window.open(url, '_blank');
    }
  }, []);

  const clearImage = useCallback(() => {
    if (dataUrlRef.current?.startsWith('blob:')) {
      URL.revokeObjectURL(dataUrlRef.current);
    }
    dataUrlRef.current = null;
    setImageUrl(null);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (dataUrlRef.current?.startsWith('blob:')) {
        URL.revokeObjectURL(dataUrlRef.current);
      }
    };
  }, []);

  return {
    imageUrl,
    isGenerating,
    generateImage,
    downloadImage,
    clearImage,
    error
  };
};

export default useShareImage;
