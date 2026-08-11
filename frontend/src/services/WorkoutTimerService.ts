import { registerPlugin, Capacitor } from '@capacitor/core';

/**
 * ZenFit 原生计时器插件定义（Web 侧 TypeScript 封装）
 *
 * 桥接 iOS 原生 TimerEngine：
 * - 原生计时基于时间戳，App 后台不挂起（解决 setInterval 被冻结的问题）
 * - 计时结束触发本地通知 + 推送到 Apple Watch
 */

export interface RestTimerState {
  exerciseId: string;
  exerciseName: string;
  duration: number;
  remaining: number;
  endDate: number;
}

export interface TimerTickEvent {
  exerciseId: string;
  remaining: number;
}

export interface TimerFinishEvent {
  exerciseId: string;
  exerciseName: string;
}

export interface WorkoutTimerPlugin {
  /** 启动/重置一个休息计时器 */
  startRest(options: { exerciseId: string; exerciseName?: string; duration?: number }): Promise<{ exerciseId: string; remaining: number }>;
  /** 手动结束某个计时器 */
  finishRest(options: { exerciseId: string }): Promise<{ exerciseId: string; finished: boolean }>;
  /** 结束全部计时器 */
  finishAll(): Promise<{ finished: boolean }>;
  /** 查询当前所有计时器状态 */
  getState(): Promise<{ timers: RestTimerState[] }>;
  /** 申请通知权限 */
  requestPermission(): Promise<{ granted: boolean }>;
  /** 监听：每秒剩余秒数 */
  addListener(eventName: 'timerTick', listener: (e: TimerTickEvent) => void): Promise<any>;
  /** 监听：计时结束 */
  addListener(eventName: 'timerFinish', listener: (e: TimerFinishEvent) => void): Promise<any>;
}

const WorkoutTimer = registerPlugin<WorkoutTimerPlugin>('WorkoutTimer');

/**
 * 平台感知封装：原生平台走 Capacitor 插件，Web 端走 fallback（无操作）
 * 这样网页版/开发环境不会因为插件不存在而崩溃。
 */
export const WorkoutTimerService = {
  isNative: Capacitor.isNativePlatform(),

  async startRest(exerciseId: string, exerciseName: string, duration: number): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await WorkoutTimer.startRest({ exerciseId, exerciseName, duration });
    } catch (e) {
      console.warn('[WorkoutTimer] startRest failed:', e);
    }
  },

  async finishRest(exerciseId: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await WorkoutTimer.finishRest({ exerciseId });
    } catch (e) {
      console.warn('[WorkoutTimer] finishRest failed:', e);
    }
  },

  async finishAll(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await WorkoutTimer.finishAll();
    } catch (e) {
      console.warn('[WorkoutTimer] finishAll failed:', e);
    }
  },

  async requestPermission(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await WorkoutTimer.requestPermission();
    } catch (e) {
      console.warn('[WorkoutTimer] requestPermission failed:', e);
    }
  },

  /**
   * 订阅原生计时事件
   * @returns 取消订阅函数
   */
  onTick(callback: (e: TimerTickEvent) => void): () => void {
    if (!Capacitor.isNativePlatform()) return () => {};
    let remove: (() => void) | undefined;
    WorkoutTimer.addListener('timerTick', callback).then(h => { remove = h.remove; }).catch(() => {});
    return () => remove?.();
  },

  onFinish(callback: (e: TimerFinishEvent) => void): () => void {
    if (!Capacitor.isNativePlatform()) return () => {};
    let remove: (() => void) | undefined;
    WorkoutTimer.addListener('timerFinish', callback).then(h => { remove = h.remove; }).catch(() => {});
    return () => remove?.();
  },
};
