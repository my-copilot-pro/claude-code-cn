<template>
  <div class="dialog-overlay" @click.self="$emit('close')">
    <div class="dialog-container">
      <div class="dialog-header">
        <h3>添加 Claude Code 供应商</h3>
        <button class="close-btn" @click="$emit('close')">
          <span class="codicon codicon-close"></span>
        </button>
      </div>

      <div class="dialog-body">
        <p class="dialog-subtitle">配置API密钥、模型选择、代理等基础设置</p>

        <!-- 预设供应商选择器 - 暂时隐藏 -->
        <!-- <div class="preset-section">
          <h4 class="preset-title">选择预设模板</h4>

          <button
            :class="['preset-btn', 'preset-btn-custom', { selected: selectedPreset === 'custom' }]"
            @click="handleSelectCustom"
          >
            <span class="codicon codicon-settings-gear"></span>
            自定义配置
          </button>

          <div v-if="selectedCategory" class="category-hint">
            <span class="codicon codicon-info"></span>
            <span>{{ getCategoryHint(selectedCategory) }}</span>
          </div>

          <div class="preset-categories">
            <div v-if="groupedProviders.official?.length" class="category-group">
              <h5 class="category-label">
                <span class="codicon codicon-verified-filled"></span>
                官方供应商
              </h5>
              <div class="preset-grid">
                <button
                  v-for="preset in groupedProviders.official"
                  :key="preset.id"
                  :class="['preset-btn', { selected: selectedPreset === preset.id }]"
                  :style="getPresetStyle(preset, selectedPreset === preset.id)"
                  @click="handleSelectPreset(preset)"
                >
                  <span v-if="preset.theme?.icon === 'sparkle'" class="codicon codicon-sparkle"></span>
                  {{ preset.name }}
                </button>
              </div>
            </div>

            <div v-if="groupedProviders.cn_official?.length" class="category-group">
              <h5 class="category-label">
                <span class="codicon codicon-globe"></span>
                国产官方
              </h5>
              <div class="preset-grid">
                <button
                  v-for="preset in groupedProviders.cn_official"
                  :key="preset.id"
                  :class="['preset-btn', { selected: selectedPreset === preset.id }]"
                  :style="getPresetStyle(preset, selectedPreset === preset.id)"
                  @click="handleSelectPreset(preset)"
                  :title="preset.description"
                >
                  {{ preset.name }}
                  <span v-if="preset.isRecommended" class="codicon codicon-star-full recommended"></span>
                </button>
              </div>
            </div>

            <div v-if="groupedProviders.aggregator?.length" class="category-group">
              <h5 class="category-label">
                <span class="codicon codicon-layers"></span>
                聚合服务
              </h5>
              <div class="preset-grid">
                <button
                  v-for="preset in groupedProviders.aggregator"
                  :key="preset.id"
                  :class="['preset-btn', { selected: selectedPreset === preset.id, partner: preset.isPartner }]"
                  :style="getPresetStyle(preset, selectedPreset === preset.id)"
                  @click="handleSelectPreset(preset)"
                  :title="preset.description"
                >
                  {{ preset.name }}
                  <span v-if="preset.isRecommended" class="codicon codicon-star-full recommended"></span>
                  <span v-if="preset.isPartner" class="partner-badge">
                    <span class="codicon codicon-star-full"></span>
                  </span>
                </button>
              </div>
            </div>

            <div v-if="groupedProviders.third_party?.length" class="category-group">
              <h5 class="category-label">
                <span class="codicon codicon-plug"></span>
                第三方供应商
              </h5>
              <div class="preset-grid">
                <button
                  v-for="preset in groupedProviders.third_party"
                  :key="preset.id"
                  :class="['preset-btn', { selected: selectedPreset === preset.id }]"
                  :style="getPresetStyle(preset, selectedPreset === preset.id)"
                  @click="handleSelectPreset(preset)"
                  :title="preset.description"
                >
                  {{ preset.name }}
                </button>
              </div>
            </div>
          </div>
        </div> -->

        <!-- 表单 -->
        <div class="form-section">
          <div class="form-group">
            <label class="form-label">
              供应商名称
              <span class="required">*</span>
            </label>
            <input
              v-model="formData.name"
              type="text"
              class="form-input"
              placeholder="例如：Claude 官方"
            />
          </div>

          <div class="form-group">
            <label class="form-label">官网链接</label>
            <div class="input-with-link">
              <input
                v-model="formData.websiteUrl"
                type="text"
                class="form-input"
                placeholder="https://"
              />
              <a
                v-if="formData.websiteUrl && isValidUrl(formData.websiteUrl)"
                :href="formData.websiteUrl"
                target="_blank"
                class="link-btn"
                title="访问官网"
              >
                <span class="codicon codicon-link-external"></span>
              </a>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              API Key
              <span class="required">*</span>
            </label>
            <div class="input-with-visibility">
              <input
                v-model="formData.apiKey"
                :type="showApiKey ? 'text' : 'password'"
                class="form-input"
                placeholder="输入 API Key"
              />
              <button
                type="button"
                class="visibility-toggle"
                @click="showApiKey = !showApiKey"
                :title="showApiKey ? '隐藏' : '显示'"
              >
                <span :class="['codicon', showApiKey ? 'codicon-eye-closed' : 'codicon-eye']"></span>
              </button>
            </div>
            <p v-if="apiKeyHint" class="field-hint">
              <span class="codicon codicon-info"></span>
              {{ apiKeyHint }}
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">
              请求地址 (API Endpoint)
              <span class="required">*</span>
            </label>
            <div class="input-with-actions">
              <input
                v-model="formData.baseUrl"
                type="text"
                class="form-input"
                placeholder="https://api.example.com"
              />
              <!-- 测速功能暂时隐藏 -->
              <button
                v-if="false"
                class="test-btn"
                type="button"
                @click="showSpeedTestDialog = true"
                title="测速"
              >
                <span class="codicon codicon-zap"></span>
                测速
              </button>
            </div>
            <p v-if="baseUrlHint" class="field-hint">
              <span class="codicon codicon-info"></span>
              {{ baseUrlHint }}
            </p>
          </div>

          <!-- 高级选项（可折叠） -->
          <details class="advanced-section">
            <summary class="advanced-toggle">
              <span class="codicon codicon-chevron-right"></span>
              高级选项
            </summary>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">主模型</label>
                <input
                  v-model="formData.mainModel"
                  type="text"
                  class="form-input"
                  placeholder="例如：claude-3-opus"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Haiku 默认模型</label>
                <input
                  v-model="formData.haikuModel"
                  type="text"
                  class="form-input"
                  placeholder="例如：claude-3-haiku"
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Sonnet 默认模型</label>
                <input
                  v-model="formData.sonnetModel"
                  type="text"
                  class="form-input"
                  placeholder="例如：claude-3-sonnet"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Opus 默认模型</label>
                <input
                  v-model="formData.opusModel"
                  type="text"
                  class="form-input"
                  placeholder="例如：claude-3-opus"
                />
              </div>
            </div>
          </details>

          <!-- JSON 配置编辑器 -->
          <details class="advanced-section" open>
            <summary class="advanced-toggle">
              <span class="codicon codicon-chevron-right"></span>
              配置 JSON
            </summary>
            <div class="json-config-section">
              <div class="json-editor-wrapper">
                <textarea
                  v-model="jsonConfig"
                  class="json-editor"
                  placeholder="{&#10;  &quot;env&quot;: {&#10;    &quot;ANTHROPIC_AUTH_TOKEN&quot;: &quot;&quot;,&#10;    &quot;ANTHROPIC_BASE_URL&quot;: &quot;&quot;&#10;  }&#10;}"
                  @input="handleJsonChange"
                ></textarea>
                <p v-if="jsonError" class="json-error">
                  <span class="codicon codicon-error"></span>
                  {{ jsonError }}
                </p>
              </div>
            </div>
          </details>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="cancel-btn" @click="$emit('close')">
          取消
        </button>
        <button class="add-btn" :disabled="!isValid" @click="handleAdd">
          <span class="codicon codicon-add"></span>
          添加供应商
        </button>
      </div>
    </div>

    <!-- 端点测速对话框 -->
    <EndpointSpeedTestDialog
      v-if="showSpeedTestDialog"
      :initialUrl="formData.baseUrl || ''"
      :initialEndpoints="[]"
      @close="showSpeedTestDialog = false"
      @save="handleSpeedTestSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { ProviderConfig, PresetProvider, ProviderCategory } from '../types/provider';
import { PRESET_PROVIDERS } from '../types/provider';
import EndpointSpeedTestDialog from './EndpointSpeedTestDialog.vue';

const emit = defineEmits<{
  close: [];
  add: [provider: ProviderConfig];
}>();

// 分组预设供应商
const groupedProviders = computed(() => {
  const grouped: Record<string, PresetProvider[]> = {};
  PRESET_PROVIDERS.forEach(preset => {
    const category = preset.category || 'custom';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(preset);
  });
  return grouped;
});

const selectedPreset = ref<string>('custom');
const selectedCategory = ref<ProviderCategory | null>(null);
const showApiKey = ref(false);
const showSpeedTestDialog = ref(false);
const jsonError = ref('');

const formData = ref<Partial<ProviderConfig>>({
  name: '',
  websiteUrl: '',
  apiKey: '',
  baseUrl: '',
  mainModel: '',
  haikuModel: '',
  sonnetModel: '',
  opusModel: ''
});

// JSON 配置
const jsonConfig = ref(JSON.stringify({
  env: {
    ANTHROPIC_AUTH_TOKEN: '',
    ANTHROPIC_BASE_URL: ''
  }
}, null, 2));

// 验证表单
const isValid = computed(() => {
  return formData.value.name &&
         formData.value.apiKey &&
         formData.value.baseUrl;
});

// 验证 URL
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// 获取分类提示
function getCategoryHint(category: ProviderCategory): string {
  switch (category) {
    case 'official':
      return '官方供应商使用官方 API，需要国外信用卡支付';
    case 'cn_official':
      return '国产官方供应商只需填写 API Key，请求地址已预设';
    case 'aggregator':
      return '聚合服务供应商只需填写 API Key 即可使用';
    case 'third_party':
      return '第三方供应商需要填写 API Key 和请求地址';
    case 'custom':
    default:
      return '自定义配置需手动填写所有必要字段';
  }
}

// API Key 提示
const apiKeyHint = computed(() => {
  if (selectedCategory.value === 'official') {
    return '需要在 Anthropic 官网申请 API Key';
  }
  if (selectedCategory.value === 'cn_official') {
    return '在供应商官网申请 API Key';
  }
  if (selectedCategory.value === 'aggregator') {
    return '在聚合服务平台获取 API Key';
  }
  return '';
});

// Base URL 提示
const baseUrlHint = computed(() => {
  if (selectedCategory.value === 'official') {
    return '使用官方 API 端点';
  }
  if (selectedCategory.value === 'third_party') {
    return '联系供应商获取 API 端点地址';
  }
  return '';
});

// 获取预设按钮样式
function getPresetStyle(preset: PresetProvider, isSelected: boolean) {
  if (!isSelected || !preset.theme?.backgroundColor) {
    return undefined;
  }
  return {
    backgroundColor: preset.theme.backgroundColor,
    color: preset.theme.textColor || '#FFFFFF',
    borderColor: preset.theme.backgroundColor
  };
}

// 监听表单字段变化，同步到 JSON
watch(
  () => [formData.value.apiKey, formData.value.baseUrl],
  ([apiKey, baseUrl]) => {
    try {
      const config = JSON.parse(jsonConfig.value);
      if (!config.env) config.env = {};
      config.env.ANTHROPIC_AUTH_TOKEN = apiKey || '';
      config.env.ANTHROPIC_BASE_URL = baseUrl || '';
      jsonConfig.value = JSON.stringify(config, null, 2);
    } catch (error) {
      // 忽略解析错误
    }
  }
);

// JSON 配置变化处理
function handleJsonChange() {
  jsonError.value = '';
  try {
    const config = JSON.parse(jsonConfig.value);
    // 验证 JSON 格式
    if (config.env) {
      // 同步更新表单字段
      if (config.env.ANTHROPIC_AUTH_TOKEN) {
        formData.value.apiKey = config.env.ANTHROPIC_AUTH_TOKEN;
      }
      if (config.env.ANTHROPIC_BASE_URL) {
        formData.value.baseUrl = config.env.ANTHROPIC_BASE_URL;
      }
    }
  } catch (error) {
    jsonError.value = error instanceof Error ? error.message : 'JSON 格式错误';
  }
}

// 端点测速保存
function handleSpeedTestSave(url: string) {
  formData.value.baseUrl = url;
  // 同步更新 JSON 配置
  try {
    const config = JSON.parse(jsonConfig.value);
    if (!config.env) config.env = {};
    config.env.ANTHROPIC_BASE_URL = url;
    jsonConfig.value = JSON.stringify(config, null, 2);
  } catch (error) {
    // 忽略错误
  }
}

// 选择自定义配置
function handleSelectCustom() {
  selectedPreset.value = 'custom';
  selectedCategory.value = 'custom';
  formData.value = {
    name: '',
    websiteUrl: '',
    apiKey: '',
    baseUrl: '',
    mainModel: '',
    haikuModel: '',
    sonnetModel: '',
    opusModel: ''
  };
  // 重置 JSON 配置
  jsonConfig.value = JSON.stringify({
    env: {
      ANTHROPIC_AUTH_TOKEN: '',
      ANTHROPIC_BASE_URL: ''
    }
  }, null, 2);
}

// 选择预设供应商
function handleSelectPreset(preset: PresetProvider) {
  selectedPreset.value = preset.id;
  selectedCategory.value = preset.category || 'custom';

  formData.value = {
    name: preset.name,
    websiteUrl: preset.websiteUrl || '',
    apiKey: '',
    baseUrl: preset.baseUrl || '',
    mainModel: '',
    haikuModel: ''
  };

  // 更新 JSON 配置
  jsonConfig.value = JSON.stringify({
    env: {
      ANTHROPIC_AUTH_TOKEN: '',
      ANTHROPIC_BASE_URL: preset.baseUrl || ''
    }
  }, null, 2);
}

// 添加供应商
function handleAdd() {
  if (isValid.value) {
    // 验证 JSON 配置
    if (jsonConfig.value.trim()) {
      try {
        JSON.parse(jsonConfig.value);
      } catch (error) {
        jsonError.value = 'JSON 格式错误，请检查后再添加';
        return;
      }
    }

    emit('add', {
      id: '', // Will be generated in store
      name: formData.value.name!,
      websiteUrl: formData.value.websiteUrl,
      apiKey: formData.value.apiKey!,
      baseUrl: formData.value.baseUrl!,
      mainModel: formData.value.mainModel,
      haikuModel: formData.value.haikuModel,
      sonnetModel: formData.value.sonnetModel,
      opusModel: formData.value.opusModel,
      isPreset: selectedPreset.value !== 'custom'
    });
  }
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
  max-width: 780px;
  max-height: 90vh;
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
  margin: 0 0 20px 0;
}

/* 预设选择器部分 */
.preset-section {
  margin-bottom: 24px;
}

.preset-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: var(--vscode-foreground);
}

.preset-btn-custom {
  margin-bottom: 12px;
}

.category-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  margin-bottom: 16px;
  background: var(--vscode-textBlockQuote-background);
  border-left: 3px solid var(--vscode-textLink-foreground);
  border-radius: 4px;
  font-size: 12px;
  color: var(--vscode-descriptionForeground);
}

.preset-categories {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.category-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--vscode-descriptionForeground);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 8px;
}

.preset-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 12px;
  border: 1px solid var(--vscode-input-border);
  border-radius: 6px;
  background: var(--vscode-input-background);
  color: var(--vscode-foreground);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
  position: relative;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preset-btn:hover {
  background: var(--vscode-list-hoverBackground);
  border-color: var(--vscode-focusBorder);
  transform: translateY(-1px);
}

.preset-btn.selected {
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  border-color: var(--vscode-button-background);
}

.preset-btn .recommended {
  color: #ffd700;
  font-size: 11px;
}

.preset-btn.partner {
  position: relative;
  overflow: visible;
}

.partner-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.partner-badge .codicon {
  font-size: 10px;
  color: white;
}

/* 表单部分 */
.form-section {
  margin-top: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
  color: var(--vscode-foreground);
}

.form-label .required {
  color: var(--vscode-errorForeground);
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--vscode-input-border);
  border-radius: 4px;
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  font-size: 13px;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--vscode-focusBorder);
}

.form-input::placeholder {
  color: var(--vscode-input-placeholderForeground);
}

.input-with-link,
.input-with-visibility,
.input-with-actions {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.link-btn,
.visibility-toggle {
  padding: 6px;
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

.link-btn:hover,
.visibility-toggle:hover {
  background: var(--vscode-toolbar-hoverBackground);
}

.test-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid var(--vscode-input-border);
  border-radius: 4px;
  background: var(--vscode-button-secondaryBackground);
  color: var(--vscode-button-secondaryForeground);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}

.test-btn:hover {
  background: var(--vscode-button-secondaryHoverBackground);
}

.field-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* 高级选项 */
.advanced-section {
  margin-top: 20px;
  border-top: 1px solid var(--vscode-panel-border);
  padding-top: 16px;
}

.advanced-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--vscode-foreground);
  cursor: pointer;
  padding: 4px 0;
  list-style: none;
}

.advanced-toggle:hover {
  color: var(--vscode-textLink-foreground);
}

.advanced-section[open] .advanced-toggle .codicon {
  transform: rotate(90deg);
}

.advanced-toggle .codicon {
  transition: transform 0.2s;
}

/* JSON 配置部分 */
.json-config-section {
  margin-top: 12px;
}

.json-editor-wrapper {
  position: relative;
}

.json-editor {
  width: 100%;
  min-height: 200px;
  padding: 12px;
  border: 1px solid var(--vscode-input-border);
  border-radius: 4px;
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  font-size: 13px;
  font-family: 'Monaco', 'Menlo', 'Consolas', 'Courier New', monospace;
  line-height: 1.5;
  resize: vertical;
  transition: border-color 0.2s;
}

.json-editor:focus {
  outline: none;
  border-color: var(--vscode-focusBorder);
}

.json-editor::placeholder {
  color: var(--vscode-input-placeholderForeground);
}

.json-error {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--vscode-errorForeground);
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
.add-btn {
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

.add-btn {
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
}

.add-btn:hover:not(:disabled) {
  background: var(--vscode-button-hoverBackground);
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 响应式适配 - 360px 小屏幕 */
@media (max-width: 480px) {
  .dialog-container {
    width: 95%;
    max-width: none;
    max-height: 95vh;
  }

  .dialog-header,
  .dialog-footer {
    padding: 12px 16px;
  }

  .dialog-header h3 {
    font-size: 14px;
  }

  .dialog-body {
    padding: 16px;
  }

  .dialog-subtitle {
    font-size: 12px;
    margin-bottom: 16px;
  }

  .preset-title {
    font-size: 13px;
  }

  .preset-btn,
  .preset-btn-custom {
    padding: 10px 12px;
    font-size: 12px;
  }

  .preset-badge {
    font-size: 9px;
    padding: 2px 6px;
  }

  .form-group label {
    font-size: 12px;
  }

  .form-input,
  .form-textarea {
    font-size: 12px;
    padding: 6px 10px;
  }

  .cancel-btn,
  .add-btn {
    padding: 6px 12px;
    font-size: 12px;
  }
}

@media (max-width: 360px) {
  .dialog-container {
    width: 98%;
    border-radius: 6px;
  }

  .dialog-header,
  .dialog-footer {
    padding: 10px 12px;
  }

  .dialog-header h3 {
    font-size: 13px;
  }

  .dialog-body {
    padding: 12px;
  }

  .dialog-subtitle {
    font-size: 11px;
  }

  .preset-title {
    font-size: 12px;
    margin-bottom: 8px;
  }

  .category-group {
    margin-bottom: 12px;
  }

  .category-title {
    font-size: 11px;
    padding: 6px 0;
  }

  .preset-btn,
  .preset-btn-custom {
    padding: 8px 10px;
    font-size: 11px;
    gap: 6px;
  }

  .preset-badge {
    font-size: 8px;
    padding: 1px 4px;
  }

  .form-group {
    margin-bottom: 12px;
  }

  .form-group label {
    font-size: 11px;
    margin-bottom: 4px;
  }

  .form-hint {
    font-size: 10px;
  }

  .form-input,
  .form-textarea {
    font-size: 11px;
    padding: 5px 8px;
  }

  .advanced-toggle {
    font-size: 11px;
    padding: 8px 0;
  }

  .cancel-btn,
  .add-btn {
    padding: 5px 10px;
    font-size: 11px;
    gap: 4px;
  }

  .dialog-footer {
    gap: 6px;
  }
}
</style>