# 调酒名片 ReAct Agent 项目

这个目录收拢了本次创建或下载的所有项目文件。

## 目录结构

- `agent/`：鸡尾酒名片生成链路，包括意图、配方、文案、视觉、音乐和模板选择。
- `runtime/`：自搭 ReAct Runtime，包括工具注册、权限判断、循环执行和终止条件。
- `tools/`：Runtime 可调用工具，包括素材、图片、音乐、打印、记忆、配方和 skill 查询。
- `schema/`：Zod 数据结构，包括名片、工具和记忆 schema。
- `memory/`：当前内存版记忆存储。
- `llm/`：OpenAI 兼容客户端和提示词入口。
- `scripts/`：demo 脚本。
- `tests/`：Vitest 测试。
- `docs/`：产品设计文档与实施计划。
- `skills/`：项目内 skill，当前包含 `cocktail-card-assets`。
- `assets/illustrations/`：非酒类插画/纹理素材副本。
- `work/`：临时工作目录和下载痕迹。

## 运行

```bash
npm install
npm test
npm run typecheck
npm run demo:react-runtime
```

## 终端编码

项目文件使用 UTF-8。若 PowerShell 直接 `Get-Content` 出现中文乱码，请使用：

```powershell
Get-Content -LiteralPath README.md -Encoding UTF8
```

或先切换输出编码：

```powershell
chcp 65001
```

## 素材规则

素材库禁止酒杯、酒瓶、吧台、调酒师、可见酒饮、倒酒动作和酒类标签。只使用抽象、插画、纹理、几何、雨夜、月光、海面、水果、植物、纸张或织物等非酒类视觉。
