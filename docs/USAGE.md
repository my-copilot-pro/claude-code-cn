# 使用指南

## 目录

- [DI 框架基础](#di-框架基础)
- [创建自定义服务](#创建自定义服务)
- [服务注册](#服务注册)
- [使用服务](#使用服务)
- [最佳实践](#最佳实践)

## DI 框架基础

### 什么是依赖注入？

依赖注入（DI）是一种用于实现控制反转（IoC）的设计模式。它可以帮助你：

- 解耦代码
- 提高可测试性
- 管理复杂的依赖关系
- 控制对象生命周期

### 核心概念

1. **服务标识符** - 唯一标识一个服务
2. **服务实现** - 实现服务接口的类
3. **服务容器** - 管理所有服务的容器
4. **依赖注入** - 自动解析和注入依赖

## 创建自定义服务

### 步骤 1: 定义服务接口

```typescript
import { createDecorator } from '../di/instantiation';

// 创建服务标识符
export const IMyService = createDecorator<IMyService>('myService');

// 定义服务接口
export interface IMyService {
    readonly _serviceBrand: undefined;  // 必需

    doSomething(input: string): Promise<string>;
}
```

### 步骤 2: 实现服务类

```typescript
import { ILogService } from './logService';

export class MyService implements IMyService {
    readonly _serviceBrand: undefined;

    // 构造函数依赖注入
    constructor(
        @ILogService private readonly logService: ILogService
    ) {
        this.logService.info('MyService initialized');
    }

    async doSomething(input: string): Promise<string> {
        this.logService.debug('Processing:', input);
        return `Processed: ${input}`;
    }
}
```

### 步骤 3: 注册服务

在 `serviceRegistry.ts` 中注册：

```typescript
import * as vscode from 'vscode';
import { SyncDescriptor } from '../di/descriptors';
import { IInstantiationServiceBuilder } from '../di/instantiationServiceBuilder';
import { IMyService, MyService } from './myService';

export function registerServices(
    builder: IInstantiationServiceBuilder,
    context: vscode.ExtensionContext
) {
    // ...其他服务

    builder.define(IMyService, new SyncDescriptor(MyService));
}
```

## 使用服务

### 方法 1: 装饰器注入（推荐）

```typescript
class MyConsumer {
    constructor(
        @IMyService private readonly myService: IMyService,
        @ILogService private readonly logService: ILogService
    ) {
        // 依赖会自动注入
    }

    async process(): Promise<void> {
        const result = await this.myService.doSomething('data');
        this.logService.info('Result:', result);
    }
}
```

### 方法 2: 函数式访问

```typescript
instantiationService.invokeFunction(async accessor => {
    const myService = accessor.get(IMyService);
    const logService = accessor.get(ILogService);

    const result = await myService.doSomething('data');
    logService.info('Result:', result);
});
```

### 方法 3: 直接创建实例

```typescript
const consumer = instantiationService.createInstance(MyConsumer);
await consumer.process();
```

## 服务注册

### 同步服务

```typescript
// 基本注册
builder.define(IMyService, new SyncDescriptor(MyService));

// 带参数注册
builder.define(IMyService, new SyncDescriptor(MyService, [arg1, arg2]));

// 直接实例注册
builder.define(IMyService, new MyService());
```

### 条件注册

```typescript
export function registerServices(
    builder: IInstantiationServiceBuilder,
    context: vscode.ExtensionContext
) {
    const isTestMode = context.extensionMode === vscode.ExtensionMode.Test;

    if (isTestMode) {
        builder.define(ITelemetryService, new SyncDescriptor(NullTelemetryService));
    } else {
        builder.define(ITelemetryService, new SyncDescriptor(TelemetryService));
    }
}
```

## 最佳实践

### 1. 服务接口设计

✅ **推荐**:
```typescript
export interface IMyService {
    readonly _serviceBrand: undefined;
    doTask(): Promise<Result>;
}
```

❌ **不推荐**:
```typescript
export interface IMyService {
    doTask(): Promise<Result>;
    internalHelper(): void;  // 不要暴露内部方法
}
```

### 2. 依赖注入

✅ **推荐**:
```typescript
constructor(
    @ILogService private readonly logService: ILogService
) { }
```

❌ **不推荐**:
```typescript
constructor(
    private logService: ILogService  // 缺少装饰器
) { }
```

### 3. 避免循环依赖

✅ **推荐**:
```
ServiceA → ServiceB → ServiceC
```

❌ **不推荐**:
```
ServiceA → ServiceB → ServiceA  // 循环依赖！
```

### 4. 测试

```typescript
// 为测试创建 Mock 服务
class MockLogService implements ILogService {
    readonly _serviceBrand: undefined;
    info(message: string): void {
        console.log('[TEST]', message);
    }
}

// 在测试中使用
const builder = new InstantiationServiceBuilder();
builder.define(ILogService, new MockLogService());
const instantiationService = builder.seal();
```

### 5. 生命周期管理

```typescript
// 服务应该实现 dispose 来清理资源
export class MyService implements IMyService {
    private subscription?: Disposable;

    constructor() {
        this.subscription = someEvent.subscribe();
    }

    dispose(): void {
        this.subscription?.dispose();
    }
}
```

## 常见问题

### Q: 如何获取服务实例？

使用 `instantiationService.invokeFunction()` 或在构造函数中使用装饰器注入。

### Q: 服务什么时候创建？

服务在第一次被请求时创建（延迟实例化）。

### Q: 如何处理异步初始化？

```typescript
export class MyService implements IMyService {
    private _initialized = false;

    async initialize(): Promise<void> {
        if (!this._initialized) {
            await this.doAsyncSetup();
            this._initialized = true;
        }
    }
}
```

### Q: 如何创建单例服务？

通过 DI 容器创建的所有服务默认都是单例的。
