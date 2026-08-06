import type { WeeklyReport } from '@/shared/types';
import { WeeklyReportBackendService } from './WeeklyReportBackendService';

/**
 * Report Storage Service
 * Manages persistent storage of weekly reports using IndexedDB
 */

const DB_NAME = 'ZenFitReports';
const DB_VERSION = 1;
const REPORTS_STORE = 'reports';

class ReportStorageService {
    private db: IDBDatabase | null = null;

    /**
     * Initialize the IndexedDB database
     */
    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                reject(new Error('Failed to open IndexedDB'));
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create reports object store
                if (!db.objectStoreNames.contains(REPORTS_STORE)) {
                    const objectStore = db.createObjectStore(REPORTS_STORE, { keyPath: 'id' });

                    // Create indexes for efficient querying
                    objectStore.createIndex('weekNumber', 'weekNumber', { unique: false });
                    objectStore.createIndex('year', 'year', { unique: false });
                    objectStore.createIndex('createdAt', 'createdAt', { unique: false });
                    objectStore.createIndex('weekYear', ['year', 'weekNumber'], { unique: true });
                }
            };
        });
    }

    /**
     * Ensure database is initialized
     */
    private async ensureDB(): Promise<IDBDatabase> {
        if (!this.db) {
            await this.init();
        }
        return this.db!;
    }

    /**
     * Save a weekly report
     * 同时保存到IndexedDB和后端
     */
    async saveReport(report: WeeklyReport): Promise<void> {
        const db = await this.ensureDB();

        // 1. 保存到IndexedDB
        await new Promise<void>((resolve, reject) => {
            const transaction = db.transaction([REPORTS_STORE], 'readwrite');
            const store = transaction.objectStore(REPORTS_STORE);

            const request = store.put(report);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to save report to IndexedDB'));
        });

        // 2. 同步到后端
        try {
            await WeeklyReportBackendService.saveReport(report);
            console.log('✅ Weekly report synced to backend:', report.id);
        } catch (error) {
            console.error('⚠️ Failed to sync report to backend (saved locally):', error);
            // 即使后端同步失败,本地已保存,不抛出错误
        }
    }

    /**
     * Get a report by ID
     */
    async getReport(id: string): Promise<WeeklyReport | null> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([REPORTS_STORE], 'readonly');
            const store = transaction.objectStore(REPORTS_STORE);

            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result || null);
            };
            request.onerror = () => reject(new Error('Failed to get report'));
        });
    }

    /**
     * Get report by week and year
     */
    async getReportByWeek(year: number, weekNumber: number): Promise<WeeklyReport | null> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([REPORTS_STORE], 'readonly');
            const store = transaction.objectStore(REPORTS_STORE);
            const index = store.index('weekYear');

            const request = index.get([year, weekNumber]);

            request.onsuccess = () => {
                resolve(request.result || null);
            };
            request.onerror = () => reject(new Error('Failed to get report by week'));
        });
    }

    /**
     * Get all reports, sorted by date (newest first)
     * 优先从后端获取,然后合并本地数据
     */
    async getAllReports(): Promise<WeeklyReport[]> {
        try {
            // 1. 尝试从后端获取
            const backendReports = await WeeklyReportBackendService.getAllReports();
            console.log(`📥 Fetched ${backendReports.length} reports from backend`);
            
            // 2. 静默更新本地IndexedDB（不阻塞主流程）
            this.syncToLocalDB(backendReports).catch(() => {
                // 静默失败，不抛出错误
            });
            
            return backendReports;
        } catch (error) {
            // 3. 后端失败，从IndexedDB获取
            return this.getReportsFromLocalDB();
        }
    }

    /**
     * 同步报告到本地IndexedDB（后台操作）
     */
    private async syncToLocalDB(reports: WeeklyReport[]): Promise<void> {
        try {
            const db = await this.ensureDB();
            const transaction = db.transaction([REPORTS_STORE], 'readwrite');
            const store = transaction.objectStore(REPORTS_STORE);
            
            for (const report of reports) {
                store.put(report);
            }
            
            return new Promise((resolve, reject) => {
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject();
            });
        } catch {
            // 静默失败
        }
    }

    /**
     * 从本地IndexedDB获取报告
     */
    private async getReportsFromLocalDB(): Promise<WeeklyReport[]> {
        try {
            const db = await this.ensureDB();
            return new Promise((resolve) => {
                const transaction = db.transaction([REPORTS_STORE], 'readonly');
                const store = transaction.objectStore(REPORTS_STORE);
                const index = store.index('createdAt');

                const request = index.openCursor(null, 'prev');
                const reports: WeeklyReport[] = [];

                request.onsuccess = () => {
                    const cursor = request.result;
                    if (cursor) {
                        reports.push(cursor.value);
                        cursor.continue();
                    } else {
                        resolve(reports);
                    }
                };

                request.onerror = () => resolve([]);
            });
        } catch {
            return [];
        }
    }

    /**
     * Get reports for a specific year
     */
    async getReportsByYear(year: number): Promise<WeeklyReport[]> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([REPORTS_STORE], 'readonly');
            const store = transaction.objectStore(REPORTS_STORE);
            const index = store.index('year');

            const request = index.getAll(year);

            request.onsuccess = () => {
                const reports = request.result || [];
                // Sort by week number descending
                reports.sort((a, b) => b.weekNumber - a.weekNumber);
                resolve(reports);
            };
            request.onerror = () => reject(new Error('Failed to get reports by year'));
        });
    }

    /**
     * Get the most recent report
     */
    async getLatestReport(): Promise<WeeklyReport | null> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([REPORTS_STORE], 'readonly');
            const store = transaction.objectStore(REPORTS_STORE);
            const index = store.index('createdAt');

            const request = index.openCursor(null, 'prev');

            request.onsuccess = () => {
                const cursor = request.result;
                resolve(cursor ? cursor.value : null);
            };

            request.onerror = () => reject(new Error('Failed to get latest report'));
        });
    }

    /**
     * Delete a report
     */
    async deleteReport(id: string): Promise<void> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([REPORTS_STORE], 'readwrite');
            const store = transaction.objectStore(REPORTS_STORE);

            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to delete report'));
        });
    }

    /**
     * Delete old reports (keep only last N weeks)
     */
    async deleteOldReports(keepWeeks: number = 52): Promise<number> {
        const allReports = await this.getAllReports();

        if (allReports.length <= keepWeeks) {
            return 0;
        }

        const reportsToDelete = allReports.slice(keepWeeks);
        let deletedCount = 0;

        for (const report of reportsToDelete) {
            await this.deleteReport(report.id);
            deletedCount++;
        }

        return deletedCount;
    }

    /**
     * Export all reports as JSON
     */
    async exportAllReports(): Promise<string> {
        const reports = await this.getAllReports();

        const exportData = {
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            totalReports: reports.length,
            reports
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Import reports from JSON
     */
    async importReports(jsonData: string): Promise<number> {
        const data = JSON.parse(jsonData);
        const reports = data.reports as WeeklyReport[];

        let importedCount = 0;

        for (const report of reports) {
            await this.saveReport(report);
            importedCount++;
        }

        return importedCount;
    }

    /**
     * Clear all reports (use with caution!)
     */
    async clearAllReports(): Promise<void> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([REPORTS_STORE], 'readwrite');
            const store = transaction.objectStore(REPORTS_STORE);

            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to clear reports'));
        });
    }
}

// Export singleton instance
export const reportStorage = new ReportStorageService();