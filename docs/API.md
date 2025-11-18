# API 参考文档

## DI 框架 API

### createDecorator

创建服务标识符装饰器。

```typescript
function createDecorator<T>(serviceId: string): ServiceIdentifier<T>
```

**参数:**
- `serviceId`: 服务的唯一标识符

**返回值:**
- `ServiceIdentifier<T>`: 可用作装饰器的服务标识符

**示例:**
```typescript
export const IMyService = createDecorator<IMyService>('myService');
```

### InstantiationServiceBuilder

用于创建具有不可变性保护的 DI 容器的服务构建器。

#### constructor

创建新的构建器实例。

```typescript
constructor(entries?: ServiceCollection | [ServiceIdentifier<unknown>, unknown][])
```

**参数:**
- `entries` (可选): 初始服务集合或条目数组

**示例:**
```typescript
const builder = new InstantiationServiceBuilder();
```

#### define

在构建器中定义服务。

```typescript
define<T>(id: ServiceIdentifier<T>, instance: T | SyncDescriptor<T>): void
```

**参数:**
- `id`: 服务标识符
- `instance`: 服务实例或描述符

**抛出异常:**
- 如果构建器已被封存则抛出错误

**示例:**
```typescript
builder.define(ILogService, new SyncDescriptor(LogService));
builder.define(IMyService, new MyService()); // 直接实例
```

#### seal

封存构建器并创建 InstantiationService。

```typescript
seal(): IInstantiationService
```

**返回值:**
- `IInstantiationService`: 已封存的实例化服务

**抛出异常:**
- 如果构建器已被封存则抛出错误

**示例:**
```typescript
const instantiationService = builder.seal();
// builder.define(...) 现在会抛出错误
```

### InstantiationService

DI 容器实现类。

#### createInstance

创建类的实例并自动注入依赖。

```typescript
createInstance<T>(ctor: Constructor<T>, ...args: any[]): T
```

**示例:**
```typescript
const instance = instantiationService.createInstance(MyClass);
```

#### invokeFunction

使用服务访问器执行函数。

```typescript
invokeFunction<R>(fn: (accessor: ServicesAccessor) => R): R
```

**示例:**
```typescript
instantiationService.invokeFunction(accessor => {
    const service = accessor.get(IMyService);
    return service.doSomething();
});
```

#### createChild

创建子容器。

```typescript
createChild(services: ServiceCollection): IInstantiationService
```

### SyncDescriptor

用于延迟实例化的服务描述符。

```typescript
class SyncDescriptor<T> {
    constructor(
        ctor: Constructor<T>,
        staticArgs?: any[],
        supportsDelayedInstantiation?: boolean
    );
}
```

## 内置服务 API

### ILogService

日志服务接口。

```typescript
interface ILogService {
    trace(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string | Error, ...args: any[]): void;
    setLevel(level: LogLevel): void;
}

enum LogLevel {
    Trace = 0,
    Debug = 1,
    Info = 2,
    Warning = 3,
    Error = 4
}
```

**示例:**
```typescript
logService.info('应用程序已启动');
logService.error(new Error('出错了'));
logService.setLevel(LogLevel.Debug);
```

### IConfigurationService

配置服务接口。

```typescript
interface IConfigurationService {
    getValue<T>(section: string, defaultValue?: T): T | undefined;
    updateValue(section: string, value: any, target?: ConfigurationTarget): Thenable<void>;
    onDidChangeConfiguration: Event<ConfigurationChangeEvent>;
}
```

**示例:**
```typescript
const timeout = configService.getValue<number>('myExt.timeout', 5000);
await configService.updateValue('myExt.enabled', true);
```

### IFileSystemService

文件系统服务接口。

```typescript
interface IFileSystemService {
    readFile(uri: Uri): Thenable<Uint8Array>;
    writeFile(uri: Uri, content: Uint8Array): Thenable<void>;
    delete(uri: Uri, options?: { recursive?: boolean }): Thenable<void>;
    rename(source: Uri, target: Uri): Thenable<void>;
    createDirectory(uri: Uri): Thenable<void>;
    readDirectory(uri: Uri): Thenable<[string, FileType][]>;
    stat(uri: Uri): Thenable<FileStat>;
}
```

**示例:**
```typescript
const content = await fsService.readFile(uri);
await fsService.writeFile(uri, new TextEncoder().encode('Hello'));
await fsService.createDirectory(dirUri);
```

### IWorkspaceService

工作区服务接口。

```typescript
interface IWorkspaceService {
    getWorkspaceFolders(): readonly WorkspaceFolder[] | undefined;
    getWorkspaceFolder(uri: Uri): WorkspaceFolder | undefined;
    onDidChangeWorkspaceFolders: Event<WorkspaceFoldersChangeEvent>;
}
```

**示例:**
```typescript
const folders = workspaceService.getWorkspaceFolders();
const folder = workspaceService.getWorkspaceFolder(fileUri);
```

### ITabsAndEditorsService

编辑器标签服务接口。

```typescript
interface ITabsAndEditorsService {
    getActiveTextEditor(): TextEditor | undefined;
    getVisibleTextEditors(): readonly TextEditor[];
    onDidChangeActiveTextEditor: Event<TextEditor | undefined>;
}
```

**示例:**
```typescript
const editor = tabsService.getActiveTextEditor();
const allEditors = tabsService.getVisibleTextEditors();
```

### ITerminalService

终端服务接口。

```typescript
interface ITerminalService {
    createTerminal(options?: TerminalOptions): Terminal;
    getActiveTerminal(): Terminal | undefined;
    sendText(text: string, addNewLine?: boolean): void;
}
```

**示例:**
```typescript
const terminal = terminalService.createTerminal({ name: 'My Terminal' });
terminalService.sendText('npm install');
```

### ITelemetryService

遥测服务接口。

```typescript
interface ITelemetryService {
    logEvent(eventName: string, data?: Record<string, any>): void;
    logError(error: Error, data?: Record<string, any>): void;
}
```

**示例:**
```typescript
telemetryService.logEvent('command.executed', { commandId: 'test' });
telemetryService.logError(error, { context: 'startup' });
```

### INotificationService

通知服务接口。

```typescript
interface INotificationService {
    showInformation(message: string, ...items: string[]): Thenable<string | undefined>;
    showWarning(message: string, ...items: string[]): Thenable<string | undefined>;
    showError(message: string, ...items: string[]): Thenable<string | undefined>;
}
```

**示例:**
```typescript
await notificationService.showInformation('任务已完成');
const choice = await notificationService.showWarning('是否继续?', '是', '否');
```

### IDialogService

对话框服务接口。

```typescript
interface IDialogService {
    showInputBox(options?: InputBoxOptions): Thenable<string | undefined>;
    showQuickPick(items: string[], options?: QuickPickOptions): Thenable<string | undefined>;
    showOpenDialog(options?: OpenDialogOptions): Thenable<Uri[] | undefined>;
    showSaveDialog(options?: SaveDialogOptions): Thenable<Uri | undefined>;
}
```

**示例:**
```typescript
const input = await dialogService.showInputBox({ prompt: '请输入名称' });
const choice = await dialogService.showQuickPick(['选项 1', '选项 2']);
const files = await dialogService.showOpenDialog({ canSelectMany: true });
```

## 类型定义

### ServiceIdentifier

```typescript
interface ServiceIdentifier<T> {
    (...args: any[]): void;
    type: T;
}
```

### ServicesAccessor

```typescript
interface ServicesAccessor {
    get<T>(id: ServiceIdentifier<T>): T;
    getIfExists<T>(id: ServiceIdentifier<T>): T | undefined;
}
```

### BrandedService

```typescript
type BrandedService = { _serviceBrand: undefined };
```

所有服务接口都必须包含 `_serviceBrand: undefined` 属性。
