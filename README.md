# 调酒名片 Agent

输入酒名、文案或情绪，AI 自主规划并生成鸡尾酒名片——包含配方、文案、视觉 prompt、音乐推荐和名片渲染。

## 快速开始

```bash
npm install
cp .env.example .env   # 填入 LLM_API_KEY
npm run dev             # 启动开发服务器 → http://localhost:3000
```

## 目录结构

```
src/
├── app/                    # Next.js 页面 + API
│   ├── page.tsx            #   主页面（移动端）
│   ├── layout.tsx          #   根布局
│   └── api/generate/       #   ReAct 生成接口
├── components/             # React 组件
│   ├── card-preview.tsx    #   名片预览（分发模板）
│   ├── export-button.tsx   #   PNG 导出
│   └── templates/          #   三套名片模板
│       ├── album-cover.tsx #     图片主导 / 情绪分享
│       ├── bar-menu.tsx    #     信息主导 / 专业酒单
│       └── personal-card.tsx#    身份主导 / 活动名片
├── lib/                    # 通用工具
│
├── backend/                # Agent 后端
│   ├── runtime/            #   ReAct 循环引擎（权限、终止）
│   ├── tools/              #   可调用工具（素材、生成、记忆、打印…）
│   ├── agent/              #   调酒业务（意图、配方、文案、模板）
│   ├── schema/             #   Zod 数据模型
│   ├── memory/             #   记忆系统
│   ├── llm/                #   LLM 客户端、决策器、提示词
│   ├── skills/             #   Skill 系统（12 个 skill + 自动选择）
│   │   └── defs/           #     Skill 定义（generate / flavor / context）
│   └── config.ts           #   配置入口
│
├── tests/                  # Vitest 测试
└── scripts/                # CLI demo 脚本
```

## npm scripts

| 命令 | 说明 |
|---|---|
| `npm run dev` | 启动 Next.js 开发服务器 |
| `npm test` | 运行全部测试 |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm run demo:generate "描述"` | 命令行生成名片 |
| `npm run demo:react-loop "描述"` | ReAct 自主循环 demo |

## 技术栈

- **前端**：Next.js 15、React 19、Tailwind CSS、html-to-image
- **后端**：自建 ReAct Runtime、LLM 决策器
- **LLM**：DeepSeek（OpenAI 兼容）
- **校验**：Zod
- **测试**：Vitest

## ReAct 工作流

```
用户输入 → LLM 自主选 skill → LLM 规划 → 选工具 → 执行 → 观察 → 反思 → 循环 → 生成名片
```

每一步决策由 DeepSeek 根据当前上下文实时做出，非固定流程。生成完成后前端展示完整思考链。

## 素材规则

禁止酒杯、酒瓶、吧台、调酒师、可见酒饮、倒酒动作和酒类标签。只使用抽象、插画、纹理、几何、雨夜、月光、海面、水果、植物、纸张或织物等非酒类视觉。
