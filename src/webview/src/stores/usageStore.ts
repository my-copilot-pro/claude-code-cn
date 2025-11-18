/**
 * Token使用统计 Store
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getVsCodeApi } from '../utils/vscodeApi';

export interface UsageData {
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
}

export interface SessionSummary {
  sessionId: string;
  timestamp: number;
  model: string;
  usage: UsageData;
  cost: number;
  summary?: string;  // 添加会话标题字段
}

export interface ModelUsage {
  model: string;
  totalCost: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  sessionCount: number;
}

export interface DailyUsage {
  date: string;
  sessions: number;
  usage: UsageData;
  cost: number;
  modelsUsed: string[];
}

export interface WeeklyComparison {
  currentWeek: {
    sessions: number;
    cost: number;
    tokens: number;
  };
  lastWeek: {
    sessions: number;
    cost: number;
    tokens: number;
  };
  trends: {
    sessions: number;
    cost: number;
    tokens: number;
  };
}

export interface ProjectStatistics {
  projectPath: string;
  projectName: string;
  totalSessions: number;
  totalUsage: UsageData;
  estimatedCost: number;
  sessions: SessionSummary[];
  dailyUsage: DailyUsage[];
  weeklyComparison: WeeklyComparison;
  byModel: ModelUsage[];
  lastUpdated: number;
}

/**
 * 向 VSCode 扩展发送消息并等待响应
 */
function sendMessageToExtension(type: string, payload?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const vscodeApi = getVsCodeApi();

    if (!vscodeApi) {
      reject(new Error('VSCode API not available'));
      return;
    }

    // 监听响应
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (data && data.type === 'from-extension') {
        const message = data.message;
        if (message.type === 'usageStatistics') {
          window.removeEventListener('message', handleMessage);
          resolve(message.payload);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // 发送消息
    vscodeApi.postMessage({
      type,
      payload
    });

    // 超时处理
    setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      reject(new Error('Request timeout'));
    }, 10000); // 10秒超时
  });
}

export type ProjectScope = 'current' | 'all';

// 缓存配置
const CACHE_DURATION = 10 * 60 * 1000; // 10分钟

interface CacheEntry {
  data: ProjectStatistics;
  timestamp: number;
}

export const useUsageStore = defineStore('usage', () => {
  // 状态
  const statistics = ref<ProjectStatistics | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastUpdate = ref<number>(Date.now());

  // 缓存和筛选状态
  const cache = ref<Map<string, CacheEntry>>(new Map());
  const selectedDateRange = ref<'7d' | '30d' | 'all'>('7d');
  const activeTab = ref<string>('overview');
  const loadedTabs = ref<Set<string>>(new Set(['overview']));
  const projectScope = ref<ProjectScope>('current');

  // 计算属性
  const hasData = computed(() => statistics.value !== null && statistics.value.totalSessions > 0);

  const formattedTotalCost = computed(() => {
    if (!statistics.value) return '$0.00';
    return `$${statistics.value.estimatedCost.toFixed(4)}`;
  });

  const formattedTotalTokens = computed(() => {
    if (!statistics.value) return '0';
    const tokens = statistics.value.totalUsage.totalTokens;
    if (tokens >= 1e9) return `${(tokens / 1e9).toFixed(2)}B`;
    if (tokens >= 1e6) return `${(tokens / 1e6).toFixed(2)}M`;
    if (tokens >= 1e3) return `${(tokens / 1e3).toFixed(2)}K`;
    return tokens.toString();
  });

  const avgCostPerSession = computed(() => {
    if (!statistics.value || statistics.value.totalSessions === 0) return 0;
    return statistics.value.estimatedCost / statistics.value.totalSessions;
  });

  // 检查缓存是否有效
  function isCacheValid(cacheKey: string): boolean {
    const cached = cache.value.get(cacheKey);
    if (!cached) return false;

    const now = Date.now();
    return (now - cached.timestamp) < CACHE_DURATION;
  }

  // 获取缓存键
  function getCacheKey(dateRange: string, scope: ProjectScope): string {
    return `stats_${scope}_${dateRange}`;
  }

  // 方法
  async function initialize(forceRefresh = false) {
    const cacheKey = getCacheKey(selectedDateRange.value, projectScope.value);

    // 如果有有效缓存且不是强制刷新，则使用缓存
    if (!forceRefresh && isCacheValid(cacheKey)) {
      const cached = cache.value.get(cacheKey);
      if (cached) {
        statistics.value = cached.data;
        lastUpdate.value = cached.timestamp;
        return;
      }
    }

    loading.value = true;
    error.value = null;

    try {
      const data = await sendMessageToExtension('getUsageStatistics', {
        dateRange: selectedDateRange.value,
        scope: projectScope.value
      });

      statistics.value = data;
      lastUpdate.value = Date.now();

      // 存入缓存
      cache.value.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error('Failed to load usage statistics:', err);
      error.value = '加载统计数据失败';
      statistics.value = null;
    } finally {
      loading.value = false;
    }
  }

  async function refresh() {
    await initialize(true); // 强制刷新，跳过缓存
  }

  // 切换日期范围
  async function setDateRange(range: '7d' | '30d' | 'all') {
    if (selectedDateRange.value === range) return;

    selectedDateRange.value = range;
    await initialize(); // 切换后重新加载（会使用缓存）
  }

  // 切换标签页
  function setActiveTab(tab: string) {
    activeTab.value = tab;
    loadedTabs.value.add(tab);
  }

  // 切换项目范围
  async function setProjectScope(scope: ProjectScope) {
    if (projectScope.value === scope) return;

    projectScope.value = scope;
    await initialize(); // 切换后重新加载（会使用缓存）
  }

  // 清除缓存
  function clearCache() {
    cache.value.clear();
  }

  // 导出到CSV
  function exportToCSV() {
    if (!statistics.value) return;

    const headers = ['Session ID', 'Timestamp', 'Input Tokens', 'Output Tokens', 'Cache Write', 'Cache Read', 'Total Tokens'];
    const rows = statistics.value.sessions.map(session => [
      session.sessionId,
      new Date(session.timestamp).toISOString(),
      session.usage.inputTokens.toString(),
      session.usage.outputTokens.toString(),
      session.usage.cacheWriteTokens.toString(),
      session.usage.cacheReadTokens.toString(),
      session.usage.totalTokens.toString()
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claude-usage-${statistics.value.projectName}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // 导出到JSON
  function exportToJSON() {
    if (!statistics.value) return;

    const json = JSON.stringify(statistics.value, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claude-usage-${statistics.value.projectName}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return {
    // 状态
    statistics,
    loading,
    error,
    lastUpdate,
    selectedDateRange,
    activeTab,
    loadedTabs,
    projectScope,

    // 计算属性
    hasData,
    formattedTotalCost,
    formattedTotalTokens,
    avgCostPerSession,

    // 方法
    initialize,
    refresh,
    setDateRange,
    setActiveTab,
    setProjectScope,
    clearCache,
    exportToCSV,
    exportToJSON
  };
});