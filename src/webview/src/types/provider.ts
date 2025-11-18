/**
 * 供应商配置相关类型定义
 */

/**
 * 供应商配置
 */
export interface ProviderConfig {
  /** 供应商唯一 ID */
  id: string;
  /** 供应商名称 */
  name: string;
  /** 官网链接 */
  websiteUrl?: string;
  /** API Key */
  apiKey: string;
  /** 请求地址（API 端点） */
  baseUrl: string;
  /** 主模型 */
  mainModel?: string;
  /** Haiku 默认模型 */
  haikuModel?: string;
  /** Sonnet 默认模型 */
  sonnetModel?: string;
  /** Opus 默认模型 */
  opusModel?: string;
  /** 是否为预设供应商 */
  isPreset?: boolean;
  /** 是否为当前使用的供应商 */
  isActive?: boolean;
  /** 是否为默认供应商（不可删除） */
  isDefault?: boolean;
}

/**
 * 供应商分类
 */
export type ProviderCategory =
  | 'official'      // 官方
  | 'cn_official'   // 国产官方
  | 'aggregator'    // 聚合服务
  | 'third_party'   // 第三方
  | 'custom';       // 自定义

/**
 * 预设供应商
 */
export interface PresetProvider {
  id: string;
  name: string;
  websiteUrl?: string;
  baseUrl?: string;
  isRecommended?: boolean;
  category?: ProviderCategory;
  isPartner?: boolean;  // 是否为合作伙伴
  description?: string;  // 描述
  theme?: {
    backgroundColor?: string;
    textColor?: string;
    icon?: string;
  };
}

/**
 * Claude settings.json 配置结构
 */
export interface ClaudeSettings {
  env: {
    ANTHROPIC_AUTH_TOKEN?: string;
    ANTHROPIC_BASE_URL?: string;
    [key: string]: string | undefined;
  };
}

/**
 * 预设供应商列表
 */
export const PRESET_PROVIDERS: PresetProvider[] = [
  // 官方供应商
  {
    id: 'claude-official',
    name: 'Claude官方',
    baseUrl: 'https://api.anthropic.com',
    category: 'official',
    description: '官方 API，需要国外信用卡',
    theme: {
      backgroundColor: '#7C3AED',
      textColor: '#FFFFFF',
      icon: 'sparkle'
    }
  },

  // 国产官方
  {
    id: 'deepseek',
    name: 'DeepSeek',
    websiteUrl: 'https://platform.deepseek.com',
    category: 'cn_official',
    description: '深度求索，国产大模型',
    isRecommended: false,
    theme: {
      backgroundColor: '#0EA5E9',
      textColor: '#FFFFFF'
    }
  },
  {
    id: 'zhipu-glm',
    name: 'Zhipu GLM',
    websiteUrl: 'https://open.bigmodel.cn',
    category: 'cn_official',
    description: '智谱清言，支持长文本',
    isRecommended: true,
    theme: {
      backgroundColor: '#10B981',
      textColor: '#FFFFFF'
    }
  },
  {
    id: 'zai-glm',
    name: 'Z.ai GLM',
    category: 'cn_official',
    isRecommended: true,
    description: '智谱AI平台',
    theme: {
      backgroundColor: '#8B5CF6',
      textColor: '#FFFFFF'
    }
  },
  {
    id: 'qwen-coder',
    name: 'Qwen Coder',
    websiteUrl: 'https://dashscope.aliyun.com',
    category: 'cn_official',
    description: '阿里通义千问',
    theme: {
      backgroundColor: '#F97316',
      textColor: '#FFFFFF'
    }
  },
  {
    id: 'kimi-k2',
    name: 'Kimi k2',
    websiteUrl: 'https://platform.moonshot.cn',
    category: 'cn_official',
    description: '月之暗面 Kimi',
    theme: {
      backgroundColor: '#EC4899',
      textColor: '#FFFFFF'
    }
  },

  // 聚合服务
  {
    id: '88code',
    name: '88供应商',
    websiteUrl: 'https://www.88code.org',
    category: 'aggregator',
    description: '稳定聚合服务',
    isRecommended: false,
    theme: {
      backgroundColor: '#EF4444',
      textColor: '#FFFFFF'
    }
  },
  {
    id: 'packycode',
    name: 'PackyCode',
    category: 'aggregator',
    isRecommended: true,
    isPartner: true,
    description: '合作伙伴，9折优惠',
    theme: {
      backgroundColor: '#F59E0B',
      textColor: '#FFFFFF',
      icon: 'star'
    }
  },
  {
    id: 'aihubmix',
    name: 'AiHubMix',
    category: 'aggregator',
    description: 'AI 聚合平台'
  },
  {
    id: 'anyrouter',
    name: 'AnyRouter',
    category: 'aggregator',
    description: '智能路由服务'
  },

  // 第三方供应商
  {
    id: 'kat-coder',
    name: 'KAT-Coder',
    category: 'third_party',
    description: '第三方中转服务'
  },
  {
    id: 'longcat',
    name: 'Longcat',
    category: 'third_party',
    description: '长猫中转服务'
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    websiteUrl: 'https://platform.minimaxi.com',
    category: 'third_party',
    description: 'MiniMax 平台'
  },
  {
    id: 'modelscope',
    name: 'ModelScope',
    websiteUrl: 'https://modelscope.cn',
    category: 'third_party',
    description: '魔搭社区'
  },
  {
    id: 'dmxapi',
    name: 'DMXAPI',
    category: 'third_party',
    description: 'DMX API 服务'
  },
  {
    id: 'foxcode',
    name: 'FoxCode',
    websiteUrl: 'https://foxcode.rjj.cc/',
    category: 'third_party',
    description: '狐狸代码中转'
  }
];
