<template>
  <div class="empty-state-content">
    <ClawdIcon class="empty-mascot" />
    <p class="empty-state-message">{{ currentTip }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import ClawdIcon from './ClawdIcon.vue';

interface Props {
  platform: string;
}

const props = defineProps<Props>();

const tips = computed(() => {
  const platformKey = props.platform === 'windows' ? 'Alt' : 'Option';
  return [
    '先做什么？询问代码库相关问题或者开始编写代码。',
    '准备好编程了吗？\n让我们写出值得部署的代码。',
    '输入 /model 来选择合适的工具。',
    '创建 CLAUDE.md 文件，Claude 每次都会阅读其中的说明。',
    '厌倦重复说明？使用 CLAUDE.md 让 Claude 记住你的要求。',
    '按 Shift + Tab 自动批准代码编辑。',
    `选中文本并按 ${platformKey} + K 进行讨论。`,
    '使用规划模式在提交前讨论重大更改。按 Shift + Tab 在模式间切换。',
    '有人认为无用的东西，对另一个人可能是宝贝。',
    '今天是使用电脑的好日子，你觉得呢？',
    '你来对地方了！',
    '在终端使用 Claude Code 配置 MCP 服务器。\n它们在这里也能工作！'
  ];
});

const currentTip = ref(tips.value[0]);

onMounted(() => {
  // 随机选择一条提示
  const index = Math.floor(Math.random() * tips.value.length);
  currentTip.value = tips.value[index];
});
</script>

<style scoped>
.empty-state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px 16px;
}

.empty-mascot {
  width: 47px;
  height: 38px;
}

.empty-state-message {
  margin: 0;
  padding: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--vscode-descriptionForeground);
  text-align: center;
  white-space: pre-line;
  max-width: 400px;
}
</style>
