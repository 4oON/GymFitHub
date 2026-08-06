import type { WeeklyReport } from '@/shared/types';
import apiClient from '@/services/apiClient';

// 注意：使用与 apiClient.ts 相同的环境变量名 VITE_API_URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * 获取认证token
 */
const getAuthToken = (): string | null => {
    return apiClient.getToken();
};

/**
 * Weekly Report Backend Sync Service
 * 负责与后端API同步周报告数据
 */

export class WeeklyReportBackendService {
    /**
     * 获取所有周报告
     */
    static async getAllReports(): Promise<WeeklyReport[]> {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            console.log('🔍 Fetching weekly reports from:', `${API_BASE_URL}/api/weekly-reports`);

            const response = await fetch(`${API_BASE_URL}/api/weekly-reports`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📡 Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Response error:', errorText);
                throw new Error(`Failed to fetch reports: ${response.statusText}`);
            }

            const reports = await response.json();
            console.log('📊 Raw reports from backend:', reports);
            console.log(`📊 Total reports received: ${reports.length}`);
            
            if (reports.length > 0) {
                console.log('📋 First report:', reports[0]);
                console.log('📋 Last report:', reports[reports.length - 1]);
            }
            
            // 转换后端数据格式到前端格式
            const transformedReports = reports.map((report: any) => ({
                id: report.id,
                weekNumber: report.weekNumber,
                year: report.year,
                dateRange: {
                    start: report.dateRangeStart,
                    end: report.dateRangeEnd
                },
                stats: report.stats,
                muscleDistribution: report.muscleDistribution,
                weeklyProgress: report.weeklyProgress,
                sessions: report.sessions,
                createdAt: report.createdAt,
                syncStatus: 'synced' as const
            }));

            console.log(`✅ Transformed ${transformedReports.length} reports`);
            return transformedReports;
        } catch (error) {
            console.error('Failed to fetch reports from backend:', error);
            throw error;
        }
    }

    /**
     * 获取特定周的报告
     */
    static async getReportByWeek(year: number, weekNumber: number): Promise<WeeklyReport | null> {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${API_BASE_URL}/api/weekly-reports/${year}/${weekNumber}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 404) {
                return null;
            }

            if (!response.ok) {
                throw new Error(`Failed to fetch report: ${response.statusText}`);
            }

            const report = await response.json();
            
            return {
                id: report.id,
                weekNumber: report.weekNumber,
                year: report.year,
                dateRange: {
                    start: report.dateRangeStart,
                    end: report.dateRangeEnd
                },
                stats: report.stats,
                muscleDistribution: report.muscleDistribution,
                weeklyProgress: report.weeklyProgress,
                sessions: report.sessions,
                createdAt: report.createdAt,
                syncStatus: 'synced' as const
            };
        } catch (error) {
            console.error('Failed to fetch report from backend:', error);
            throw error;
        }
    }

    /**
     * 保存或更新周报告
     */
    static async saveReport(report: WeeklyReport): Promise<WeeklyReport> {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const payload = {
                weekNumber: report.weekNumber,
                year: report.year,
                dateRangeStart: report.dateRange.start,
                dateRangeEnd: report.dateRange.end,
                stats: report.stats,
                muscleDistribution: report.muscleDistribution,
                weeklyProgress: report.weeklyProgress,
                sessions: report.sessions
            };

            const response = await fetch(`${API_BASE_URL}/api/weekly-reports`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Failed to save report: ${response.statusText}`);
            }

            const savedReport = await response.json();
            
            return {
                id: savedReport.id,
                weekNumber: savedReport.weekNumber,
                year: savedReport.year,
                dateRange: {
                    start: savedReport.dateRangeStart,
                    end: savedReport.dateRangeEnd
                },
                stats: savedReport.stats,
                muscleDistribution: savedReport.muscleDistribution,
                weeklyProgress: savedReport.weeklyProgress,
                sessions: savedReport.sessions,
                createdAt: savedReport.createdAt,
                syncStatus: 'synced' as const
            };
        } catch (error) {
            console.error('Failed to save report to backend:', error);
            throw error;
        }
    }

    /**
     * 批量同步周报告
     */
    static async batchSyncReports(reports: WeeklyReport[]): Promise<{
        created: number;
        updated: number;
        failed: number;
        errors: string[];
    }> {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${API_BASE_URL}/api/weekly-reports/batch-sync`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reports })
            });

            if (!response.ok) {
                throw new Error(`Failed to batch sync reports: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to batch sync reports:', error);
            throw error;
        }
    }

    /**
     * 删除周报告
     */
    static async deleteReport(reportId: string): Promise<void> {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${API_BASE_URL}/api/weekly-reports/${reportId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to delete report: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Failed to delete report from backend:', error);
            throw error;
        }
    }
}
