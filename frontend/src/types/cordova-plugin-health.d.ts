/**
 * Cordova Health Plugin (cordova-plugin-health) TypeScript declarations.
 * The plugin exposes navigator.health / cordova.plugins.health.
 */

declare global {
  interface Window {
    plugins?: {
      health?: CordovaHealth;
    };
  }

  interface Navigator {
    health?: CordovaHealth;
  }
}

export interface CordovaHealth {
  isAvailable(success: (available: boolean) => void, error: (err: string) => void): void;
  requestAuthorization(
    datatypes: { read?: string[]; write?: string[] },
    success: () => void,
    error: (err: string) => void
  ): void;
  query(
    options: CordovaHealthQueryOptions,
    success: (results: CordovaHealthSample[]) => void,
    error: (err: string) => void
  ): void;
  queryAggregated?(
    options: CordovaHealthQueryOptions,
    success: (result: CordovaHealthSample) => void,
    error: (err: string) => void
  ): void;
  store(
    sample: CordovaHealthStoreSample,
    success: () => void,
    error: (err: string) => void
  ): void;
  openHealthSettings(success: () => void, error: (err: string) => void): void;
}

export interface CordovaHealthQueryOptions {
  dataType: string;
  startDate: Date;
  endDate: Date;
  limit?: number;
  /** iOS only: return sessions instead of individual stages */
  sleepSession?: boolean;
  /** activity only */
  includeCalories?: boolean;
  /** activity only */
  includeDistance?: boolean;
}

export interface CordovaHealthSample {
  startDate: Date;
  endDate: Date;
  value: number | string | object;
  unit: string;
  sourceName: string;
  sourceBundleId: string;
}

export interface CordovaHealthStoreSample {
  dataType: string;
  value: number | object;
  startDate: Date;
  endDate?: Date;
}

export {};
