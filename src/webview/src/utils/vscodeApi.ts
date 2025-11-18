/**
 * VSCode API 工具函数
 * 提供统一的 VSCode API 访问接口，确保整个应用只调用一次 acquireVsCodeApi()
 */

interface VsCodeApi {
  postMessage(message: any): void;
  getState(): any;
  setState(state: any): void;
}

/**
 * 获取共享的 VSCode API 实例
 * 确保整个应用只调用一次 acquireVsCodeApi()
 */
export function getVsCodeApi(): VsCodeApi | null {
  // 检查是否已经有实例
  if ((window as any).__vscodeApi) {
    return (window as any).__vscodeApi;
  }

  // 第一次调用，尝试获取并缓存实例
  if (typeof (window as any).acquireVsCodeApi === 'function') {
    try {
      (window as any).__vscodeApi = (window as any).acquireVsCodeApi();
      console.log('[VSCode API] Successfully acquired VSCode API instance');
      return (window as any).__vscodeApi;
    } catch (error) {
      console.error('[VSCode API] Failed to acquire VSCode API:', error);
      return null;
    }
  }

  console.warn('[VSCode API] acquireVsCodeApi function is not available');
  return null;
}

/**
 * 获取 VSCode API 实例（抛出异常版本）
 * 如果无法获取 API 实例，则抛出异常
 */
export function requireVsCodeApi(): VsCodeApi {
  const api = getVsCodeApi();
  if (!api) {
    throw new Error('VSCode API is not available');
  }
  return api;
}
