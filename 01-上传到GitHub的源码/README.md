# Life RPG AI

一个把每日任务、成长记录和 AI 建议放在一起的 Windows 个人工作台。

## 功能

- 创建、编辑和完成每日任务，记录成长进度。
- 查看成长记录和周报，管理照片记录。
- 使用自己的 DeepSeek API Key 获取 AI 导师建议。
- 桌面端使用本地 SQLite 数据库保存数据。

## 项目结构

```text
app/                 React + TypeScript 界面与项目配置
  src/               界面、组件和业务逻辑
  public/            静态资源和空白示例快照
  src-tauri/         Tauri / Rust 桌面应用
work/                原项目的 Python 辅助脚本与 SQL 表结构
```

## 开发与构建

进入 `app` 文件夹后安装依赖。Node.js 的版本要求以当前 Vite 文档及锁文件为准。

```sh
npm ci
npm run dev
```

浏览器预览按终端中显示的地址打开。生成前端文件：

```sh
npm run build
```

构建 Windows 桌面程序还需要 Rust、Microsoft C++ Build Tools 和 WebView2 等 Tauri 开发环境：
https://v2.tauri.app/start/prerequisites/

```sh
npm run tauri:build
```

构建结果在 `app/src-tauri/target/release/`，安装程序通常在其 `bundle/nsis/` 下。

原项目的 Tauri 开发地址固定为 4173 端口。如需桌面开发，先在一个终端运行
`npm run dev -- --port 4173 --strictPort`，再在另一个终端运行
`npm run tauri -- dev --config '{"build":{"beforeDevCommand":""}}'`（PowerShell 的引号传参方式可能需要按版本调整）。

## 数据与当前限制

- 当前桌面版本的数据路径固定为 `C:\meos`，包含数据库、照片和配置。
- 仓库不包含使用者的数据库、照片、密钥文件或运行日志。
- `app/public/dashboard-snapshot.json` 是原项目的空白示例。
- API Key 由使用者在应用内填写；现有桌面实现使用可逆编码保存密钥，并非系统安全凭据存储。
- 调用 AI 时，相关任务内容会发送给应用配置的 DeepSeek 接口。模型可用性取决于服务端和使用者账号。
- 本项目仍为原型，部分初始日期固定为 2026-08-01，浏览器模式与桌面模式的数据保存方式不同。
- 上传仓库不会自动把桌面程序变成在线网站。
- `work` 中的脚本属于早期数据初始化、导入与快照工具，不是正常桌面构建的必需步骤；其旧表结构可能与当前桌面数据库不同，不要直接对已有数据运行导入或初始化脚本。
- 如运行 `sync:dashboard` 导出个人数据，提交前需检查生成的快照内容。

## 关于此源码副本

这是从现有本地项目整理的源码副本，包含 npm 与 Cargo 锁文件；已排除依赖和编译产物。
应用业务代码保持原样，新增了项目说明和仓库忽略规则。
现有 Windows 可执行程序可以单独作为 GitHub Release 附件发布。
本项目采用 MIT License，允许在保留版权和许可证声明的前提下使用、修改和再发布。
