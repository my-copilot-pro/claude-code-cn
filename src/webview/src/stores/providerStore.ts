/**
 * 供应商配置 Store
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ProviderConfig } from '../types/provider';
import { PRESET_PROVIDERS } from '../types/provider';
import { getVsCodeApi } from '../utils/vscodeApi';

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

    // 生成唯一消息 ID
    const messageId = `${type}_${Date.now()}_${Math.random()}`;

    // 监听响应
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (data && data.type === 'from-extension') {
        const message = data.message;
        // 根据不同的响应类型匹配
        const expectedTypes = [
          'providersData',        // getProviders 的响应
          'providerAdded',        // addProvider 的响应
          'providerUpdated',      // updateProvider 的响应
          'providerDeleted',      // deleteProvider 的响应
          'activeProviderData',   // getActiveProvider 的响应
          'providerSwitched'      // switchProvider 的响应
        ];

        if (expectedTypes.some(t => message.type === t)) {
          window.removeEventListener('message', handleMessage);
          resolve(message.payload);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // 确保 payload 是可序列化的 - 进行深度克隆以去除不可序列化的属性
    let serializedPayload = payload;
    if (payload !== undefined && payload !== null) {
      try {
        // 通过 JSON 序列化/反序列化来确保数据可克隆
        serializedPayload = JSON.parse(JSON.stringify(payload));
      } catch (e) {
        console.error('Failed to serialize payload:', e);
        reject(new Error('Payload is not serializable'));
        return;
      }
    }

    // 发送消息
    try {
      vscodeApi.postMessage({
        type,
        payload: serializedPayload,
        messageId
      });
    } catch (error) {
      window.removeEventListener('message', handleMessage);
      reject(error);
      return;
    }

    // 超时处理
    setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      reject(new Error(`Request timeout: ${type}`));
    }, 5000);
  });
}

/**
 * 供应商配置 Store
 */
export const useProviderStore = defineStore('provider', () => {
  // 供应商列表
  const providers = ref<ProviderConfig[]>([]);

  // 当前激活的供应商 ID
  const activeProviderId = ref<string | null>(null);

  // 计算当前激活的供应商
  const activeProvider = computed(() => {
    return providers.value.find(p => p.id === activeProviderId.value) || null;
  });

  /**
   * 初始化供应商列表
   */
  async function initialize() {
    // 从配置文件中加载供应商列表
    await loadProviders();
    // 加载当前激活的供应商
    await loadActiveProvider();
  }

  /**
   * 从配置文件中加载供应商列表
   */
  async function loadProviders() {
    try {
      const savedProviders = await sendMessageToExtension('getProviders');
      if (savedProviders && Array.isArray(savedProviders)) {
        providers.value = savedProviders;
      } else {
        providers.value = [];
      }
    } catch (error) {
      console.error('Failed to load providers:', error);
      providers.value = [];
    }
  }

  /**
   * 加载当前激活的供应商
   */
  async function loadActiveProvider() {
    try {
      const activeProviderData = await sendMessageToExtension('getActiveProvider');
      if (activeProviderData) {
        activeProviderId.value = activeProviderData.id;

        // 更新所有供应商的激活状态
        providers.value.forEach(p => {
          p.isActive = p.id === activeProviderData.id;
        });
      }
    } catch (error) {
      console.error('Failed to load active provider:', error);
    }
  }

  /**
   * 添加供应商
   */
  async function addProvider(provider: ProviderConfig) {
    // 生成唯一 ID
    provider.id = `provider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const result = await sendMessageToExtension('addProvider', provider);
      if (result.success) {
        // 重新加载供应商列表
        await loadProviders();
      } else {
        throw new Error(result.error || 'Failed to add provider');
      }
    } catch (error) {
      console.error('Failed to add provider:', error);
      throw error;
    }
  }

  /**
   * 更新供应商
   */
  async function updateProvider(id: string, updates: Partial<ProviderConfig>) {
    try {
      const result = await sendMessageToExtension('updateProvider', { id, updates });
      if (result.success) {
        // 重新加载供应商列表
        await loadProviders();
      } else {
        throw new Error(result.error || 'Failed to update provider');
      }
    } catch (error) {
      console.error('Failed to update provider:', error);
      throw error;
    }
  }

  /**
   * 删除供应商
   */
  async function deleteProvider(id: string) {
    try {
      const result = await sendMessageToExtension('deleteProvider', { id });
      if (result.success) {
        // 重新加载供应商列表
        await loadProviders();

        // 如果删除的是当前激活的供应商，清除激活状态
        if (activeProviderId.value === id) {
          activeProviderId.value = null;
        }
      } else {
        throw new Error(result.error || 'Failed to delete provider');
      }
    } catch (error) {
      console.error('Failed to delete provider:', error);
      throw error;
    }
  }

  /**
   * 切换供应商（更新配置文件和 Claude settings.json）
   */
  async function switchProvider(id: string) {
    const provider = providers.value.find(p => p.id === id);
    if (!provider) {
      throw new Error('Provider not found');
    }

    try {
      const result = await sendMessageToExtension('switchProvider', {
        id: provider.id,
        apiKey: provider.apiKey,
        baseUrl: provider.baseUrl
      });

      if (result.success) {
        // 更新激活状态
        activeProviderId.value = id;

        // 更新所有供应商的激活状态
        providers.value.forEach(p => {
          p.isActive = p.id === id;
        });

        // 重新加载供应商列表以确保数据同步
        await loadProviders();
      } else {
        throw new Error(result.error || 'Failed to switch provider');
      }
    } catch (error) {
      console.error('Failed to switch provider:', error);
      throw error;
    }
  }

  /**
   * 获取预设供应商列表
   */
  function getPresetProviders() {
    return PRESET_PROVIDERS;
  }

  return {
    providers,
    activeProviderId,
    activeProvider,
    initialize,
    loadProviders,
    loadActiveProvider,
    addProvider,
    updateProvider,
    deleteProvider,
    switchProvider,
    getPresetProviders
  };
});
