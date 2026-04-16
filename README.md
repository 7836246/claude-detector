# 👩 Anthropic 妈妈测试 (anthropic.mom)

[English](./README.en.md)

Claude API Key 黑盒真伪检测平台。通过 19 个自动化探针识别中转站掺假、模型降级、Token 虚报和逆向接入。

## 功能特性

- **19 个黑盒探针** — 连通性、模型回显、响应 Schema、Token 计费核验、System Prompt 服从、stop_sequences、max_tokens 截断、工具调用(逆向检测)、SSE 流式事件、错误对象格式、模型自报身份、推理指纹、多模态
- **6 级真伪判定 + 5 种来源渠道** — 正品 / 正品(瑕疵) / 第三方 / 存疑 / 假冒 / 无法判定 × Anthropic / 订阅 / 云平台 / 中转 / 逆向
- **Token 用量审计** — 通过 `count_tokens` 端点独立重算,逐轮成本基线对比,异常倍率检测
- **实时 SSE 流式** — 逐 probe 推送进度和结果
- **结果分享** — 每次检测生成唯一链接,1 小时有效
- **多验证码供应商** — Cloudflare Turnstile / 腾讯云天御 / hCaptcha / Google reCAPTCHA v3,后台一键切换
- **管理后台** — 检测统计、判定分布、热门端点、历史记录、验证码配置
- **四语国际化** — 中文 / English / 日本語 / 한국어
- **频率限制** — 每 IP 每分钟 5 次,SQLite 持久化

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | Astro 6 (App Router, 混合渲染) |
| 交互岛 | React 19 |
| 样式 | Tailwind CSS 4 |
| 数据库 | SQLite (better-sqlite3, WAL 模式) |
| 运行时 | Node.js 22+ |
| 部署 | Docker (多阶段构建) |

## 快速开始

```bash
git clone https://github.com/7836246/claude-detector.git
cd cctest
npm install
cp .env.example .env
npm run dev
# 访问 http://localhost:4321
```

## 环境变量

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `ADMIN_PASSWORD` | 生产环境必填 | `admin123` | 管理后台密码 |
| `PUBLIC_TURNSTILE_SITE_KEY` | 否 | 测试 key | Turnstile 公钥(可被后台配置覆盖) |
| `TURNSTILE_SECRET_KEY` | 否 | 测试 key | Turnstile 私钥(可被后台配置覆盖) |
| `DATA_DIR` | 否 | `./data` | SQLite 数据目录 |

验证码供应商和密钥通过管理后台 `/admin/settings` 配置,存储在 SQLite 中。环境变量仅用于初始启动兜底。

## Docker 部署

```bash
# 一键启动
docker compose up -d

# 或手动
docker build -t cctest .
docker run -d \
  -p 4321:4321 \
  -v cctest-data:/data \
  -e ADMIN_PASSWORD=你的强密码 \
  cctest
```

SQLite 数据库位于容器内 `/data`。挂载 volume 确保重启不丢数据。

## 项目结构

```
src/
  lib/
    anthropic.ts       Anthropic API 调用封装 (/v1/messages + /v1/messages/count_tokens)
    probes.ts          19 个探针定义 + 分类映射
    runner.ts          异步生成器 — 顺序执行探针,发射 SSE 事件
    verdict.ts         决策树:探针结果 + 审计数据 → 真伪判定 + 渠道识别
    audit.ts           Token 审计:honest vs billed 成本聚合
    pricing.ts         Claude 官方定价表
    captcha.ts         多供应商验证码抽象 (4 家)
    db.ts              SQLite schema + 预编译语句
    store.ts           检测结果持久化
    ratelimit.ts       滑动窗口频率限制
    auth.ts            管理员 Cookie 认证 (SHA-256 HMAC)
    i18n.ts            翻译字典 (80+ 条, 4 语言)
    i18n-dom.ts        Astro 页面客户端翻译

  components/
    DetectForm.tsx     检测表单 + SSE 消费 + 进度展示
    Report.tsx         暗色报告面板 (圆环分数 / 分类 / 审计图表)
    CaptchaWidget.tsx  动态多供应商验证码组件
    Select.tsx         自定义下拉框
    LocaleSwitch.tsx   语言选择器
    Header.astro       站点头部
    Footer.astro       站点底部

  pages/
    index.astro        首页 + 检测表单
    faq.astro          常见问题 (6 条, 4 语言)
    contact.astro      联系方式
    result/[id].astro  分享结果页
    admin/
      index.astro      管理仪表盘 (统计 / 记录)
      login.astro      管理员登录
      settings.astro   验证码供应商配置
    api/
      detect.ts        POST — SSE 检测端点
      captcha-config.ts GET — 公开验证码配置
      result/[id].ts   GET — 加载已保存结果
      health.ts        GET — 健康检查
      admin/
        login.ts       POST — 管理员认证
        settings.ts    GET/POST — 验证码配置 CRUD

tests/
  pricing.test.ts      定价计算测试 (6 用例)
  audit.test.ts        审计聚合测试 (10 用例)
  verdict.test.ts      判定决策树测试 (8 用例)
  i18n.test.ts         国际化测试 (13 用例)
  probes.test.ts       探针定义测试 (15 用例)
```

## 检测探针

| # | 探针 | 分类 | 权重 | 检测内容 |
|---|------|------|------|----------|
| 1 | `connectivity` | 结构完整性 | 3 | HTTP 200 + 响应体存在 id/content |
| 2 | `model_echo` | 签名校验 | 3 | `response.model` 与请求模型匹配 |
| 3 | `response_shape` | 结构完整性 | 2 | 8 项必要字段 + `msg_*` ID 格式 |
| 4 | `count_tokens_match` | Token 审计 | 3 | `count_tokens` 独立计数 vs `usage.input_tokens` (仅审计模式) |
| 5 | `system_adherence` | 行为验证 | 1 | System Prompt 强约束服从 |
| 6 | `stop_sequence` | 行为验证 | 2 | `stop_reason=stop_sequence` + 正确序列 |
| 7 | `max_tokens` | 行为验证 | 2 | `stop_reason=max_tokens` + 输出不超限 |
| 8 | `tool_use` | 行为验证 | 3 | 工具调用格式 / `toolu_*` ID / `stop_reason=tool_use` |
| 9 | `multi_turn` | 行为验证 | 2 | 3 轮对话记忆验证(防丢失上文) |
| 10 | `streaming_shape` | 结构完整性 | 2 | 6 种 SSE 事件 + 顺序验证 |
| 11 | `error_shape` | 签名真实性 | 1 | 错误对象符合 `{type:"error", error:{type, message}}` |
| 12 | `self_identification` | LLM 指纹 | 2 | 训练方法论 + 身份双因子验证 |
| 13 | `reasoning_fingerprint` | LLM 指纹 | 2 | 逻辑推理(婚姻状态分情况讨论) |
| 14 | `multimodal` | 多模态 | 2 | 图像输入理解(1×1 红色 PNG) |
| 15 | `document_input` | 多模态 | 2 | PDF 文档输入("HELLO MOM") |
| 16 | `cache_behavior` | 结构完整性 | 2 | Prompt Caching 创建 + 读取验证 |
| 17 | `system_prompt_leak` | 签名真实性 | 3 | 隐藏 System Prompt 注入检测 |
| 18 | `consistency_check` | 签名真实性 | 2 | 请求 ID 唯一性 + token 一致性(防重放/注入) |
| 19 | `header_fingerprint` | 签名校验 | 1 | Anthropic 特有响应头(request-id / cf-ray) |

## 判定系统

真伪判定(Result)与来源渠道(Channel)独立分离:

| 真伪 | 条件 | 说明 |
|------|------|------|
| `authentic` 正品 | 全通过 + 倍率 ≤ 1.05 + 官方头 | 可完全信赖 |
| `authentic_degraded` 正品(瑕疵) | 全通过但有注入/倍率偏差 | 模型真,有轻微篡改 |
| `third_party` 第三方 | 大部分通过 + 倍率偏高 | 真 Claude 经代理转发 |
| `suspicious` 存疑 | 多项异常 / ≥2 逆向信号 | 可能被篡改或降级 |
| `counterfeit` 假冒 | model + self_id 均失败 | 非 Claude 模型冒充 |
| `inconclusive` 无法判定 | 连通性失败 | 数据不足 |

| 来源渠道 | 判定依据 |
|----------|----------|
| `anthropic` | 有官方 headers + caching + consistency |
| `subscription` | 功能完整但缺官方 headers |
| `cloud` | 云平台 (Bedrock / Vertex) |
| `proxy` | 功能正常,无官方 headers |
| `reverse-proxy` | ≥2 项逆向信号 |

## 开发

```bash
npm run dev          # 启动开发服务器 (http://localhost:4321)
npm run build        # 生产构建
npm run preview      # 预览生产构建
npm run test         # 运行测试 (62 用例)
npm run check        # TypeScript 类型检查
```

## 管理后台

访问 `/admin`,密码为 `ADMIN_PASSWORD` 环境变量。

- **仪表盘** — 总检测/今日检测、判定分布、热门端点、最近 50 条记录
- **设置** — 切换验证码供应商、配置密钥

## API

### `POST /api/detect`

发起检测,返回 SSE 流。

```json
{
  "endpoint": "https://api.anthropic.com",
  "apiKey": "sk-ant-...",
  "model": "claude-opus-4-6",
  "tokenAudit": true,
  "turnstileToken": "..."
}
```

SSE 事件: `start` → `probe_start` / `probe_result` (×19) → `done`

`done` 事件包含完整的 `results`、`score`、`verdict`、`verdictDetail`、`categories`、`audit`、`resultId`。

### `GET /api/result/:id`

按 ID 加载已保存的检测结果。

### `GET /api/health`

健康检查。返回 `{ status, uptime, db, probeCount, version }`。

### `GET /api/captcha-config`

公开验证码配置(provider + siteKey,不含 secret)。

## 测试

```
62 用例, 5 文件, 全部通过

  pricing.test.ts    定价查询 + 成本计算        6 用例
  audit.test.ts      异常判定 + 聚合             10 用例
  verdict.test.ts    7 级决策树全路径             8 用例
  i18n.test.ts       翻译 + Accept-Language       13 用例
  probes.test.ts     探针完整性 + 分类 + 加权     15 用例
```

## 安全

- API Key 仅在请求内存中使用,不写入日志或数据库
- 管理员认证使用 SHA-256 HMAC Cookie (httpOnly + secure)
- 频率限制 5 次/分/IP
- 验证码防刷 (4 家供应商可选)
- 输入校验:endpoint URL 格式、Key 长度、model 长度
- 检测结果存储不包含原始 API Key

## 许可

[MIT](./LICENSE)
