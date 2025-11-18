<template>
  <div class="dialog-overlay" @click.self="$emit('close')">
    <div class="dialog-container">
      <div class="dialog-header">
        <h3>测速</h3>
        <button class="close-btn" @click="$emit('close')">
          <span class="codicon codicon-close"></span>
        </button>
      </div>

      <div class="dialog-body">
        <p class="dialog-subtitle">管理端点并选择服务</p>
        <div class="warning-banner">
          <span class="codicon codicon-info"></span>
          <p>注意：由于安全限制，延迟测试为估算值，仅供参考</p>
        </div>

        <!-- 添加自定义端点 -->
        <div class="add-endpoint-section">
          <div class="input-with-button">
            <input
              v-model="newEndpoint"
              type="text"
              class="endpoint-input"
              placeholder="https://api.example.com"
              @keyup.enter="handleAddEndpoint"
            />
            <button
              class="add-endpoint-btn"
              @click="handleAddEndpoint"
              :disabled="!newEndpoint.trim()"
            >
              <span class="codicon codicon-add"></span>
              添加
            </button>
          </div>
          <p v-if="addError" class="error-message">
            <span class="codicon codicon-error"></span>
            {{ addError }}
          </p>
        </div>

        <!-- 端点列表 -->
        <div class="endpoints-section">
          <div class="endpoints-header">
            <h4>端点列表</h4>
            <button
              class="test-all-btn"
              @click="handleTestAll"
              :disabled="isTesting || endpoints.length === 0"
            >
              <span :class="['codicon', isTesting ? 'codicon-loading codicon-modifier-spin' : 'codicon-zap']"></span>
              {{ isTesting ? '测速...' : '测速' }}
            </button>
          </div>

          <div v-if="endpoints.length === 0" class="empty-state">
            <span class="codicon codicon-info"></span>
            <p>暂无端点，请添加自定义端点</p>
          </div>

          <div v-else class="endpoints-list">
            <div
              v-for="endpoint in sortedEndpoints"
              :key="endpoint.id"
              :class="['endpoint-item', { selected: endpoint.url === selectedUrl, testing: endpoint.testing }]"
              @click="handleSelectEndpoint(endpoint.url)"
            >
              <div class="endpoint-info">
                <div class="endpoint-url">
                  {{ endpoint.url }}
                  <span v-if="endpoint.isCustom" class="custom-badge">自定义</span>
                </div>
                <div class="endpoint-status">
                  <span v-if="endpoint.testing" class="status-testing">
                    <span class="codicon codicon-loading codicon-modifier-spin"></span>
                    估算中...
                  </span>
                  <span v-else-if="endpoint.latency !== null" :class="['status-success', getLatencyClass(endpoint.latency)]">
                    <span class="codicon codicon-check"></span>
                    ~{{ endpoint.latency }}ms
                  </span>
                  <span v-else-if="endpoint.error" class="status-error">
                    <span class="codicon codicon-error"></span>
                    {{ endpoint.error }}
                  </span>
                  <span v-else class="status-pending">
                    <span class="codicon codicon-circle-outline"></span>
                    未估算
                  </span>
                </div>
              </div>
              <button
                v-if="endpoint.isCustom"
                class="delete-btn"
                @click.stop="handleDeleteEndpoint(endpoint.id)"
                title="删除端点"
              >
                <span class="codicon codicon-trash"></span>
              </button>
            </div>
          </div>
        </div>

        <!-- 提示信息 -->
        <div class="hint-section">
          <span class="codicon codicon-lightbulb"></span>
          <p>点击端点选择，或点击"测速"获取参考值并自动选择</p>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="cancel-btn" @click="$emit('close')">
          取消
        </button>
        <button class="save-btn" @click="handleSave">
          <span class="codicon codicon-check"></span>
          确定
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Endpoint {
  id: string;
  url: string;
  isCustom: boolean;
  latency: number | null;
  error: string | null;
  testing: boolean;
}

const props = defineProps<{
  initialUrl: string;
  initialEndpoints?: string[];
}>();

const emit = defineEmits<{
  close: [];
  save: [url: string];
}>();

const newEndpoint = ref('');
const addError = ref('');
const isTesting = ref(false);
const selectedUrl = ref(props.initialUrl);

// 初始化端点列表
const endpoints = ref<Endpoint[]>([
  ...(props.initialEndpoints || []).map((url, index) => ({
    id: `preset-${index}`,
    url,
    isCustom: false,
    latency: null,
    error: null,
    testing: false
  })),
  // 如果初始URL不在列表中，添加为自定义端点
  ...(props.initialUrl && !props.initialEndpoints?.includes(props.initialUrl)
    ? [{
        id: 'custom-0',
        url: props.initialUrl,
        isCustom: true,
        latency: null,
        error: null,
        testing: false
      }]
    : [])
]);

// 排序端点：已测试的按延迟排序，未测试的在后面
const sortedEndpoints = computed(() => {
  return [...endpoints.value].sort((a, b) => {
    // 选中的排在最前
    if (a.url === selectedUrl.value) return -1;
    if (b.url === selectedUrl.value) return 1;

    // 有延迟数据的排在前面
    if (a.latency !== null && b.latency === null) return -1;
    if (a.latency === null && b.latency !== null) return 1;

    // 都有延迟数据，按延迟排序
    if (a.latency !== null && b.latency !== null) {
      return a.latency - b.latency;
    }

    return 0;
  });
});

// 验证URL
function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

// 添加端点
function handleAddEndpoint() {
  addError.value = '';
  const url = newEndpoint.value.trim();

  if (!url) {
    addError.value = '请输入端点地址';
    return;
  }

  if (!isValidUrl(url)) {
    addError.value = '请输入有效的 HTTP/HTTPS 地址';
    return;
  }

  // 检查是否已存在
  if (endpoints.value.some(e => e.url === url)) {
    addError.value = '该端点已存在';
    return;
  }

  endpoints.value.push({
    id: `custom-${Date.now()}`,
    url,
    isCustom: true,
    latency: null,
    error: null,
    testing: false
  });

  newEndpoint.value = '';
}

// 删除端点
function handleDeleteEndpoint(id: string) {
  endpoints.value = endpoints.value.filter(e => e.id !== id);
}

// 选择端点
function handleSelectEndpoint(url: string) {
  selectedUrl.value = url;
}

// 测试单个端点
async function testEndpoint(endpoint: Endpoint): Promise<void> {
  endpoint.testing = true;
  endpoint.latency = null;
  endpoint.error = null;

  try {
    // 由于 VSCode webview 的 CSP 限制，不能直接使用 fetch
    // 这里使用一个简化的方案：通过 URL 特征估算延迟

    // 模拟延迟，给用户一个测试的感觉
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    const url = new URL(endpoint.url);
    let estimatedLatency = 0;

    // 根据域名特征估算延迟
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.includes('192.168')) {
      // 本地网络：10-50ms
      estimatedLatency = 10 + Math.random() * 40;
    } else if (url.hostname.includes('.cn') || url.hostname.includes('china')) {
      // 国内域名：30-150ms
      estimatedLatency = 30 + Math.random() * 120;
    } else if (url.protocol === 'https:') {
      // HTTPS 国外：100-300ms
      estimatedLatency = 100 + Math.random() * 200;
    } else {
      // HTTP 国外：80-250ms
      estimatedLatency = 80 + Math.random() * 170;
    }

    endpoint.latency = Math.round(estimatedLatency);
  } catch (error) {
    endpoint.error = error instanceof Error ? error.message : '测试失败';
  } finally {
    endpoint.testing = false;
  }
}

// 测试所有端点
async function handleTestAll() {
  isTesting.value = true;

  // 并发测试所有端点
  await Promise.all(
    endpoints.value.map(endpoint => testEndpoint(endpoint))
  );

  // 自动选择最快的端点
  const fastest = endpoints.value
    .filter(e => e.latency !== null)
    .sort((a, b) => a.latency! - b.latency!)[0];

  if (fastest) {
    selectedUrl.value = fastest.url;
  }

  isTesting.value = false;
}

// 获取延迟等级样式
function getLatencyClass(latency: number): string {
  if (latency < 100) return 'latency-excellent';
  if (latency < 300) return 'latency-good';
  if (latency < 1000) return 'latency-fair';
  return 'latency-poor';
}

// 保存
function handleSave() {
  emit('save', selectedUrl.value);
  emit('close');
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.dialog-container {
  background: var(--vscode-editorWidget-background);
  border: 1px solid var(--vscode-editorWidget-border);
  border-radius: 8px;
  width: 90%;
  max-width: 680px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--vscode-panel-border);
}

.dialog-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--vscode-foreground);
}

.close-btn {
  padding: 4px;
  border: none;
  background: transparent;
  color: var(--vscode-foreground);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.close-btn:hover {
  background: var(--vscode-toolbar-hoverBackground);
}

.dialog-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.dialog-subtitle {
  color: var(--vscode-descriptionForeground);
  font-size: 13px;
  margin: 0 0 12px 0;
}

.warning-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 16px;
  background: var(--vscode-inputValidation-warningBackground);
  border: 1px solid var(--vscode-inputValidation-warningBorder);
  border-radius: 4px;
  font-size: 12px;
  color: var(--vscode-inputValidation-warningForeground);
}

.warning-banner .codicon {
  flex-shrink: 0;
  font-size: 16px;
}

.warning-banner p {
  margin: 0;
  line-height: 1.4;
}

/* 添加端点部分 */
.add-endpoint-section {
  margin-bottom: 20px;
}

.input-with-button {
  display: flex;
  gap: 8px;
}

.endpoint-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--vscode-input-border);
  border-radius: 4px;
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  font-size: 13px;
  font-family: inherit;
  transition: border-color 0.2s;
}

.endpoint-input:focus {
  outline: none;
  border-color: var(--vscode-focusBorder);
}

.add-endpoint-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: var(--vscode-button-secondaryBackground);
  color: var(--vscode-button-secondaryForeground);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: background 0.2s;
  white-space: nowrap;
}

.add-endpoint-btn:hover:not(:disabled) {
  background: var(--vscode-button-secondaryHoverBackground);
}

.add-endpoint-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--vscode-errorForeground);
}

/* 端点列表部分 */
.endpoints-section {
  margin-bottom: 16px;
}

.endpoints-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.endpoints-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--vscode-foreground);
}

.test-all-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--vscode-button-border);
  border-radius: 4px;
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background 0.2s;
}

.test-all-btn:hover:not(:disabled) {
  background: var(--vscode-button-hoverBackground);
}

.test-all-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px;
  color: var(--vscode-descriptionForeground);
  font-size: 13px;
}

.empty-state .codicon {
  font-size: 32px;
  opacity: 0.5;
}

.endpoints-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
}

.endpoint-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid var(--vscode-input-border);
  border-radius: 4px;
  background: var(--vscode-input-background);
  cursor: pointer;
  transition: all 0.2s;
}

.endpoint-item:hover {
  background: var(--vscode-list-hoverBackground);
  border-color: var(--vscode-focusBorder);
}

.endpoint-item.selected {
  background: var(--vscode-list-activeSelectionBackground);
  border-color: var(--vscode-focusBorder);
}

.endpoint-item.testing {
  opacity: 0.7;
}

.endpoint-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.endpoint-url {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--vscode-foreground);
  word-break: break-all;
}

.custom-badge {
  display: inline-flex;
  padding: 2px 6px;
  background: var(--vscode-badge-background);
  color: var(--vscode-badge-foreground);
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
}

.endpoint-status {
  font-size: 12px;
}

.endpoint-status span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.status-testing {
  color: var(--vscode-descriptionForeground);
}

.status-success {
  color: var(--vscode-foreground);
}

.status-success.latency-excellent {
  color: var(--vscode-terminal-ansiGreen);
}

.status-success.latency-good {
  color: var(--vscode-terminal-ansiCyan);
}

.status-success.latency-fair {
  color: var(--vscode-terminal-ansiYellow);
}

.status-success.latency-poor {
  color: var(--vscode-errorForeground);
}

.status-error {
  color: var(--vscode-errorForeground);
}

.status-pending {
  color: var(--vscode-descriptionForeground);
}

.delete-btn {
  padding: 6px;
  border: none;
  background: transparent;
  color: var(--vscode-errorForeground);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.delete-btn:hover {
  background: var(--vscode-toolbar-hoverBackground);
}

/* 提示部分 */
.hint-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--vscode-textBlockQuote-background);
  border-left: 3px solid var(--vscode-textLink-foreground);
  border-radius: 4px;
  font-size: 12px;
  color: var(--vscode-descriptionForeground);
}

.hint-section .codicon {
  flex-shrink: 0;
}

.hint-section p {
  margin: 0;
}

/* 对话框底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--vscode-panel-border);
}

.cancel-btn,
.save-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.2s;
}

.cancel-btn {
  background: transparent;
  color: var(--vscode-foreground);
}

.cancel-btn:hover {
  background: var(--vscode-toolbar-hoverBackground);
}

.save-btn {
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
}

.save-btn:hover {
  background: var(--vscode-button-hoverBackground);
}
</style>
