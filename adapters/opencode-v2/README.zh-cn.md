# oh-my-cortex 的 OpenCode V2 适配器

让 V1 插件 [`oh-my-cortex`](https://github.com/michaelxer/oh-my-cortex) 运行在 **OpenCode V2** 上的兼容层
（已在 OpenCode 2.0.32 + oh-my-cortex 0.1.6 上验证）。

这不是对 oh-my-cortex 的重写。OMX 源码约 27 万行，完整重写不现实；适配器在运行时加载已发布的 V1
bundle，并把它的运行时接口翻译到 V2：

- `{ id, server }` → `{ id, setup(ctx) }`
- V1 `client`（sessions/messages/prompt/status）→ 基于 V2 `ctx` 的垫片
- V1 hooks → V2 `session.hook`、`tool.hook`、`agent/command/mcp.transform`、`event.subscribe`
- OMX 的配置产物 → 生成的 agent Markdown、运行时命令、MCP 服务器

[English](./README.md) | 简体中文

## 环境要求

- OpenCode 2.x
- Node.js 20+
- `oh-my-cortex@0.1.6`（安装脚本会自动装到 `~/.local/share/opencode/omx-v2`，不需要全局 npm 安装）

## 安装

单项目安装（推荐，隔离于其他项目）：

```bash
./install.sh /path/to/project
cd /path/to/project && opencode
```

全局安装（所有项目可用）：

```bash
./install.sh --global
opencode
```

安装脚本会：

1. 如果缺少 `oh-my-cortex@0.1.6`，先安装到 `~/.local/share/opencode/omx-v2`；
2. 把 `adapter.js` 复制到 `.opencode/plugins/omx-v2.js`（项目）或
   `~/.config/opencode/plugins/omx-v2.js`（全局）；
3. 把 10 个生成的 agent 文件复制到对应的 `agents/` 目录；
4. 单项目安装时写入 `.opencode/omx-v2.json`，让适配器后续继续把 agent 写到该项目，而不是全局目录。

**安装后必须完全退出并重启 OpenCode。** Agent 文件只在启动时发现：首次运行写入文件，下一次启动才会加载。

## 使用

TUI：选择 `Chief---Deepworker` 或 `Founder---Deep-Agent` 作为主 agent。

命令行：

```bash
opencode run --agent Chief---Deepworker -m deepseek/deepseek-flash "审查这个改动"
```

命令：`/dw-loop`、`/cortex-loop`、`/challenge`、`/decide`、`/lens`、`/hyperplan`、
`/brainstorm`、`/checkpoint`、`/handoff`，以及另外 18 个。

## 已验证

- 10 个 agent 正常加载，模型和提示词正确
- Chief 能正确自称 Chief（prompt hook 注入生效）
- 23 个 OMX 工具注册成功；`cortex_search` 可执行
- 27 个命令注册成功；`$ARGUMENTS` 替换正常
- 同步委派可用：`call_cortex_agent(subagent_type="researcher", run_in_background=false)` 返回子 agent 结果
- 无插件加载错误；稳定包路径解析正常

## 已知限制

- `deepwork` / `cortex-loop` 的多阶段流程未做端到端测试
- 后台委派（`run_in_background=true`）未完整验证
- Compaction 映射是尽力而为
- V2 的 `prompt` hook 不提供 message parts/model，prompt 阶段的附件可能丢失
- agent ID 仍是 slug 形式（`Chief---Deepworker`）；V2 会忽略自定义显示名
- 全局安装会让 OMX 工具/命令出现在所有项目，并可能覆盖其他插件的同名工具；单项目安装可避免

## 模型

生成的 agent 默认使用 `model: deepseek/deepseek-flash`，这是开发时使用的模型。修改
`.opencode/agents/*.md`（或 `~/.config/opencode/agents/*.md`）里的 `model:` 行即可换成其他
provider/model。首次运行前设置 `OMX_AGENT_MODEL` 可以改变适配器写入的默认值；设置
`OMX_FORCE_MODEL` 可以控制委派子会话使用的模型。

## 卸载

```bash
./uninstall.sh /path/to/project   # 单项目
./uninstall.sh --global           # 全局
```

## 目录结构

```
adapter.js          V2 插件入口 + V1→V2 转换（约 556 行）
agents/             10 个生成的 agent 模板
install.sh          依赖安装 + 安装（项目或全局）
uninstall.sh        移除插件/agents/标记文件
```

日志：`~/.config/opencode/omx-v2/adapter.log`（可用 `OMX_ADAPTER_LOG` 覆盖）。
调试：`OMX_ADAPTER_DEBUG=1`。

## 许可证

oh-my-cortex 使用 Sustainable Use License 1.0（SUL-1.0）。本适配器是衍生作品，按相同条款分发；
参见仓库根目录的 `LICENSE.md` 和 [`NOTICE.md`](./NOTICE.md)。仅限免费、非商业用途。
