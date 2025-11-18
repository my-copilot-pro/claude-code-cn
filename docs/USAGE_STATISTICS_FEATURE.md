# Token 使用统计功能说明

## 功能概述

在 Claude Code VSCode 插件中新增了 Token 使用统计功能，让用户可以直观地查看**当前打开项目**的 Token 消耗情况和费用统计。该功能读取 `~/.claude/projects/` 目录下的会话记录，自动解析并汇总统计数据。

## 功能特点

### 1. 当前项目统计概览
- **项目信息**: 显示当前打开的项目名称和路径
- **总消费**: 显示当前项目的累计费用（基于 Claude API 定价估算）
- **总会话数**: 统计当前项目的所有会话次数
- **总 Token 数**: 累计使用的 Token 总量
- **平均每会话费用**: 计算每次会话的平均成本

### 2. Token 使用分解
- **输入 Token**: 用户输入消耗的 token 数量
- **输出 Token**: AI 输出消耗的 token 数量
- **缓存写入**: 写入缓存的 token 数量
- **缓存读取**: 从缓存读取的 token 数量
- 每项都显示具体数量和占比进度条

### 3. 会话详情列表
- 显示最近 50 个会话的详细信息
- 每个会话显示：会话 ID、时间、Token 使用量
- 支持鼠标悬停查看输入/输出 Token 详情

### 4. 数据管理
- **刷新数据**: 重新从 `~/.claude` 目录读取最新数据
- **导出 CSV**: 导出所有会话的详细 Token 使用数据
- **导出 JSON**: 导出完整的统计信息为 JSON 格式

## 如何访问

1. 点击 VSCode 右上角的设置按钮
2. 在左侧菜单中选择"使用统计"
3. 即可查看详细的 Token 使用情况

## 文件结构

### 新增文件
- `src/webview/src/stores/usageStore.ts` - 使用统计状态管理
- `src/webview/src/components/UsageStatisticsSection.vue` - 统计界面组件
- `USAGE_STATISTICS_FEATURE.md` - 功能说明文档

### 修改文件
- `src/webview/src/pages/SettingsPage.vue` - 集成统计功能到设置页面

## 技术实现

### 数据来源
- **会话记录**: 从 `~/.claude/projects/[项目名]/` 目录读取所有 `.jsonl` 文件
- **Token 统计**: 解析每个会话文件中 `assistant` 消息的 `message.usage` 字段
- **费用计算**: 基于 Claude API 官方定价进行估算
  - Input tokens: $0.003 / 1K
  - Output tokens: $0.015 / 1K
  - Cache write: $0.00375 / 1K
  - Cache read: $0.0003 / 1K

### 架构设计
- **后端服务** ([usageStatisticsService.ts](src/services/usageStatisticsService.ts)):
  - 读取和解析会话文件
  - 汇总 token 使用数据
  - 计算费用估算

- **前端状态管理** ([usageStore.ts](src/webview/src/stores/usageStore.ts)):
  - 使用 Pinia 管理状态
  - 与 VSCode 扩展通信
  - 提供导出功能

- **UI 组件** ([UsageStatisticsSection.vue](src/webview/src/components/UsageStatisticsSection.vue)):
  - 遵循 VSCode 设计规范
  - 响应式布局
  - 使用 VSCode Codicons 图标库

### 消息通信流程
1. 前端发送 `getUsageStatistics` 消息到扩展
2. 扩展读取当前工作区路径
3. 调用 `usageStatisticsService` 解析数据
4. 返回 `usageStatistics` 消息到前端
5. 前端更新 UI 显示

## 后续优化建议

1. **功能增强**
   - 添加日期范围筛选功能
   - 支持多项目对比分析
   - 添加费用预警和预算设置
   - 支持自定义定价配置（不同模型/供应商）

2. **可视化改进**
   - 集成专业图表库（如 ECharts）绘制趋势图
   - 添加按日期、按模型的统计图表
   - 支持数据钻取查看单个会话详情

3. **性能优化**
   - 实现大文件流式读取
   - 添加数据缓存机制
   - 支持后台异步刷新数据

4. **用户体验**
   - 添加搜索和过滤会话功能
   - 支持会话标签和分类
   - 提供数据分析洞察和建议

## 注意事项

- **数据来源**: 所有统计数据均来自 `~/.claude/projects/` 目录下的会话记录
- **费用估算**: 基于 Claude API 官方定价，仅供参考，实际费用请以账单为准
- **项目识别**: 项目路径通过文件夹名映射（如 `-Users-username-Desktop-project`）
- **性能考虑**: 会话文件过多时可能影响加载速度，建议定期清理旧数据

## 数据结构示例

### 会话文件格式 (`.jsonl`)
```json
{
  "type": "assistant",
  "message": {
    "usage": {
      "input_tokens": 613,
      "output_tokens": 128,
      "cache_creation_input_tokens": 3950,
      "cache_read_input_tokens": 11166
    }
  }
}
```

### 统计数据结构
```typescript
{
  projectPath: "/Users/username/Desktop/my-project",
  projectName: "my-project",
  totalSessions: 150,
  totalUsage: {
    inputTokens: 45600,
    outputTokens: 23400,
    cacheWriteTokens: 125000,
    cacheReadTokens: 980000
  },
  estimatedCost: 2.6587
}
```

## 贡献指南

如需改进此功能，请：

1. Fork 项目仓库
2. 创建功能分支
3. 提交 Pull Request
4. 等待代码审核

## 许可证

遵循主项目的许可证协议。