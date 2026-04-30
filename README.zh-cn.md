# oh-my-cortex

**OpenCode 的认知操作系统。**

oh-my-cortex (OMX) 是一个多智能体插件，将 OpenCode 转变为思维伙伴——不仅用于代码，还用于决策、战略、沟通、风险管理等各个方面。

安装 OMX，输入 `deepwork`。获得一支由 11 名专业智能体组成的团队，他们会挑战你的假设、适应敏感领域、结构化你的决策，并精确执行。

---

## 为什么选择 OMX？

大多数 AI 工具对你说的一切都表示同意。OMX 会提出反对意见。

大多数 AI 工具只会写代码。OMX 帮助你思考。

大多数 AI 工具对所有任务使用同一个模型。OMX 自动将合适的大脑路由到合适的工作。

---

## OMX 的不同之处

### Challenge Engine

智能体不仅仅是执行——它们在弱推理变成错误决策之前就提出挑战。

从温和提示到完全对抗性审查，4 个级别的反馈：

| 级别 | 名称 | 行为 |
|---|---|---|
| 1 | **Nudge** | 指出一个假设或改进点（始终激活） |
| 2 | **Probe** | 展示权衡、风险、盲点、更好的选择 |
| 3 | **Mirror** | 指出回避、弱逻辑、机会成本——然后开出处方 |
| 4 | **Red Team** | 从竞争对手、怀疑论者、投资者、监管者的角度进行攻击 |

使用 `/challenge 3` 手动设置，或者当你说"说实话"或"我遗漏了什么？"时自动激活。

### Domain Lenses

OMX 检测到对话进入敏感领域时会自动调整：

| 领域 | 变化 |
|---|---|
| **Health** | 非诊断性。推荐专业医疗。仅提供循证信息。 |
| **Legal** | 保守。区分信息和建议。注意管辖权。 |
| **Financial** | 数据驱动。标注风险承受能力。区分信息和金融建议。 |
| **Security** | 优先分诊。仅防御。保全证据。升级至专业人员。 |
| **Political** | 关注利益相关者。保全面子。遵守协议。 |

使用 `/lens security` 手动激活，或让 OMX 从上下文中自动检测。

### 超越代码

OMX 处理其他编码工具无法处理的事务：

- **商业战略** — 竞争分析、并购评估、市场进入规划
- **敏感沟通** — 考虑受众意识、杠杆保持、截图防护的消息起草
- **风险评估** — 威胁分诊、危机规划、事件响应
- **研究综合** — 多源三角验证、证据审查、高管摘要
- **决策支持** — 包含权衡和建议的结构化选项 A/B/C 分析
- **教练辅导** — 技能发展、反思练习、建设性挑战

### 结构化推理

每个 OMX 智能体在不确定性重要时使用置信度标签：

- **Confirmed** — 已验证、有来源、直接已知
- **Likely** — 有充分支持的推断
- **Possible** — 合理但未验证
- **Speculative** — 仅为假设

没有虚假的确定性。没有无根据的声明。当智能体不知道时，它会如实说明。

---

## OMX 团队

### 主要智能体（通过 Tab 选择）

| 智能体 | 职责 |
|---|---|
| **Chief** | 主编排器。按目标、利害关系、风险和紧急程度对每个请求进行分类。委派给专家。挑战弱假设。推动任务完成。 |
| **Founder** | 自主深度工作者。给出目标而非指令。探索上下文，研究模式，端到端执行。 |

### 子智能体（由 Chief 自动调用）

| 智能体 | 职责 |
|---|---|
| **Thinker** | 全领域顾问。架构、商业战略、风险、健康、法律、金融、政治分析。只读——纯推理，零操作。 |
| **Researcher** | 知识查找器。文档、开源示例、标准、最佳实践。 |
| **Tracker** | 代码库探索器。快速文件发现、模式搜索、本地上下文映射。 |
| **Planner** | 战略访谈者。先提问，后规划。通过迭代提问创建详细工作计划。 |
| **Reviewer** | 缺口发现者。捕获隐藏假设、歧义、缺失的验收标准、利益相关者盲点。 |
| **Critic** | 质量关卡。仅在引用经过验证且验收标准具体时才批准。 |
| **Lead** | 项目经理。将实施任务委派给 Worker，积累经验，验证完成情况。 |
| **Worker** | 任务执行者。专注、有纪律、范围限定。不能再委派。 |
| **Spotter** | 视觉分析师。截图、图表、PDF、图像。 |

---

## 命令

| 命令 | 功能 |
|---|---|
| `deepwork` 或 `dw` | 全面激活——所有智能体，最大强度，自主执行 |
| `/dw-loop` | Cortex 循环——持续工作直到 100% 完成 |
| `/challenge [1-4]` | 设置挑战级别（1=nudge, 2=probe, 3=mirror, 4=red-team） |
| `/checkpoint` | 强制对话摘要——决策、假设、行动项 |
| `/lens [domain]` | 激活领域镜头（health, legal, financial, security, political） |
| `/decide` | 结构化决策框架——选项、权衡、风险、建议 |
| `/start-work` | 从 Planner 生成的计划执行 |
| `/cancel-cortex` | 停止 Cortex 循环 |

---

## 安装

### 快速开始

将以下内容粘贴到你的 OpenCode 会话中：

```
Install and configure oh-my-cortex by following the instructions here:
https://raw.githubusercontent.com/michaelxer/oh-my-cortex/refs/heads/dev/docs/guide/installation.md
```

### 手动安装

```bash
# 添加到你的 OpenCode 配置
# ~/.config/opencode/opencode.jsonc
{
  "plugin": ["oh-my-cortex"]
}

# 重启 OpenCode——插件会从 npm 自动安装
# 或手动安装：
cd ~/.config/opencode
npm install oh-my-cortex
```

### 交互式设置

```bash
bunx oh-my-cortex install
```

安装程序会询问你拥有哪些 AI 提供商，并自动为每个智能体匹配最强的可用模型。任何模型都可以工作——OMX 会适应你的环境。

---

## 致谢

OMX 建立在 [@code-yeongyu](https://github.com/code-yeongyu) 的 [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) 基础之上——使这一切成为可能的原始多智能体编排架构。SUL-1.0 许可证。

同一生态系统中还有：[oh-my-crew](https://github.com/michaelxer/oh-my-crew)——具有内容过滤安全提示和 Session Guardian 的基于角色的智能体分支。

---

## 许可证

[SUL-1.0](LICENSE.md)

---

*OMX... Think deeper.*
