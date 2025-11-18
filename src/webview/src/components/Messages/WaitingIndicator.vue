<template>
  <div class="spinner" :data-permission-mode="permissionMode">
    <span class="icon" :style="{ fontSize: size + 'px' }">
      {{ currentIcon }}
    </span>
    <span class="text">{{ animatedText }}</span>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
  import type { PermissionMode } from '@anthropic-ai/claude-agent-sdk';

  interface Props {
    size?: number;
    permissionMode?: PermissionMode;
  }

  const props = withDefaults(defineProps<Props>(), {
    size: 16,
    permissionMode: undefined,
  });

  const SPINNER_ICONS = ['·', '✢', '*', '✶', '✻', '✽'];
  const ANIMATION_ICONS = [...SPINNER_ICONS, ...[...SPINNER_ICONS].reverse()];
  const VERBS = [
    '分析中', '构思中', '构建中', '计算中', '检查中', '协作中',
    '编译中', '运算中', '配置中', '构造中', '思考中', '制作中',
    '调试中', '设计中', '开发中', '探索中', '工程化', '评估中',
    '检验中', '探究中', '制定中', '生成中', '实现中', '改进中',
    '初始化', '创新中', '集成中', '调查中', '学习中', '加载中',
    '优化中', '组织中', '规划中', '斟酌中', '准备中', '处理中',
    '编程中', '原型化', '推理中', '重构中', '改良中', '渲染中',
    '研究中', '解决中', '审查中', '搜索中', '求解中', '构建中',
    '综合中', '测试中', '思考中', '排错中', '理解中', '升级中',
    '验证中', '运行中', '执行中', '分解中', '组装中', '诊断中'
  ];
  const MAX_VERB_LENGTH = Math.max(...VERBS.map(v => v.length));

  const iconIndex = ref(0);
  const verb = ref(randomVerb());
  const currentIcon = computed(() => ANIMATION_ICONS[iconIndex.value]);

  let iconTimer: any;
  let verbTimer: any;
  let rafId: number | null = null;

  // 文本动画状态
  const animatedText = ref(' '.repeat(MAX_VERB_LENGTH + 3));
  const animIndex = ref(0);
  const animTarget = ref(
    padTargetText(verb.value + '...', MAX_VERB_LENGTH + 3)
  );
  let lastTick = 0;
  const stepMs = 40;

  onMounted(() => {
    iconTimer = setInterval(() => {
      iconIndex.value = (iconIndex.value + 1) % ANIMATION_ICONS.length;
    }, 120);

    // 依次 2s/3s/5s，之后固定 5s 变更
    const intervals = [2000, 3000, 5000];
    let count = 0;
    const schedule = () => {
      verb.value = randomVerb();
      const next = count < intervals.length ? intervals[count++] : 5000;
      verbTimer = setTimeout(schedule, next);
    };
    verbTimer = setTimeout(schedule, intervals[0]);

    // 初次触发文本动画
    startTextAnimation(verb.value + '...');
  });

  onBeforeUnmount(() => {
    if (iconTimer) clearInterval(iconTimer);
    if (verbTimer) clearTimeout(verbTimer);
    stopTextAnimation();
  });

  function randomVerb(): string {
    return VERBS[Math.floor(Math.random() * VERBS.length)];
  }

  // 监听动词变化，重启文本动画
  watch(verb, v => {
    startTextAnimation(v + '...');
  });

  function padTargetText(text: string, width: number): string {
    return text.length >= width ? text : text + ' '.repeat(width - text.length);
  }

  function replaceAt(s: string, index: number, ch: string): string {
    if (index < 0 || index >= s.length) return s;
    return s.slice(0, index) + ch + s.slice(index + 1);
  }

  function randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function transformChar(
    currentChar: string,
    targetChar: string,
    phase: number
  ): string {
    if (targetChar === ' ') return ' ';
    switch (phase) {
      case 3:
        return targetChar;
      case 2:
        return randomChoice(['.', '_', targetChar]);
      case 1:
        return randomChoice(['.', '_', targetChar]);
      case 0:
        return '▌';
      default:
        return currentChar;
    }
  }

  function startTextAnimation(text: string) {
    stopTextAnimation();
    animIndex.value = 0;
    lastTick = 0;
    const width = MAX_VERB_LENGTH + 3;
    animTarget.value = padTargetText(text, width);
    if (animatedText.value.length !== width) {
      animatedText.value = ' '.repeat(width);
    }

    const step = (ts: number) => {
      if (!lastTick) lastTick = ts;
      if (ts - lastTick < stepMs) {
        rafId = requestAnimationFrame(step);
        return;
      }
      lastTick = ts;

      const d = animIndex.value;
      // 完成条件：扫描位置超过 target 长度 + 3 个阶段
      if (d - 3 >= animTarget.value.length) {
        rafId = null;
        return;
      }

      animIndex.value++;
      const prev = animatedText.value;
      let nextStr = prev;
      for (let f = 0; f <= 3; f++) {
        const p = d - f;
        if (p >= 0 && p < animTarget.value.length) {
          nextStr = replaceAt(
            nextStr,
            p,
            transformChar(prev[p], animTarget.value[p], f)
          );
        }
      }
      animatedText.value = nextStr;

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
  }

  function stopTextAnimation() {
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  const permissionMode = computed(() => props.permissionMode);
  const size = computed(() => props.size);
</script>

<style scoped>
  .spinner {
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    gap: 4px;
    color: var(--app-primary-foreground, var(--vscode-foreground));
    padding-left: 24px;
  }
  .icon {
    color: var(--app-spinner-foreground, var(--vscode-descriptionForeground));
    font-family: monospace;
    display: inline-block;
    width: 1.5em;
    text-align: center;
  }
  .spinner[data-permission-mode='acceptEdits'] .icon {
    color: var(--app-primary-foreground, var(--vscode-foreground));
  }
  .spinner[data-permission-mode='plan'] .icon {
    color: var(--vscode-focusBorder, var(--app-button-background));
  }
  .text {
    font-weight: 500;
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
  }
</style>
