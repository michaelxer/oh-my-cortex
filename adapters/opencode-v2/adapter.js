// oh-my-cortex V1 -> OpenCode V2 compatibility adapter (MVP)
// Loads the installed oh-my-cortex bundle, then re-registers its V1 hooks,
// tools, commands and MCP servers through the V2 plugin API.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { createRequire } from "node:module"
import { pathToFileURL } from "node:url"

const STABLE_DIST = path.join(os.homedir(), ".local", "share", "opencode", "omx-v2", "node_modules", "oh-my-cortex", "dist", "index.js")
const NPX_DIST = path.join(os.homedir(), ".npm", "_npx", "431bfef5e9deb2a8", "node_modules", "oh-my-cortex", "dist", "index.js")
const OMX_DIST = process.env.OMX_DIST || (fs.existsSync(STABLE_DIST) ? STABLE_DIST : NPX_DIST)
const LOG_FILE = process.env.OMX_ADAPTER_LOG || path.join(os.homedir(), ".config", "opencode", "omx-v2", "adapter.log")
const WRITE_AGENTS = process.env.OMX_WRITE_AGENTS !== "0"
const BUILTIN_AGENTS = new Set(["build", "plan", "general", "explore", "compaction", "title", "summary"])
function resolveAgentDir(ctx) {
  if (process.env.OMX_AGENT_DIR) return process.env.OMX_AGENT_DIR
  let root = ctx.location?.directory || process.cwd()
  while (true) {
    try {
      const marker = path.join(root, ".opencode", "omx-v2.json")
      if (fs.existsSync(marker)) {
        const m = JSON.parse(fs.readFileSync(marker, "utf8"))
        if (typeof m.agentDir === "string" && m.agentDir) {
          return path.isAbsolute(m.agentDir) ? m.agentDir : path.join(root, m.agentDir)
        }
      }
    } catch (e) { log("agent dir marker failed", String(e)) }
    const parent = path.dirname(root)
    if (parent === root) break
    root = parent
  }
  return path.join(os.homedir(), ".config", "opencode", "agents")
}
const FORCE_MODEL = process.env.OMX_FORCE_MODEL || "deepseek/deepseek-flash"
function forcedModelRef() {
  const [providerID, rest] = FORCE_MODEL.split("/")
  if (!providerID || !rest) return undefined
  const [id, variant] = rest.split("#")
  return { providerID, id, ...(variant ? { variant } : {}) }
}

const requireFromOmx = createRequire(OMX_DIST)
const requireHere = createRequire(import.meta.url)
let zod
try { zod = requireFromOmx("zod") } catch { zod = undefined }

function log(msg, extra) {
  const line = `${new Date().toISOString()} ${msg}${extra === undefined ? "" : " " + safeJson(extra)}`
  try { fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true }); fs.appendFileSync(LOG_FILE, line + "\n") } catch {}
  if (process.env.OMX_ADAPTER_DEBUG) console.error("[omx-v2] " + line)
}
function safeJson(v) { try { return JSON.stringify(v) } catch { return String(v) } }
function isRecord(v) { return typeof v === "object" && v !== null }
async function guard(name, fn) {
  try { return await fn() } catch (e) { log(`ERROR ${name}`, e?.stack || String(e)); return undefined }
}

// ---------------------------------------------------------------------------
// V1 client shim backed by the V2 plugin context
// ---------------------------------------------------------------------------

function wrap(data) { return { data } }

function partsToText(parts) {
  if (!Array.isArray(parts)) return ""
  return parts.filter(p => p && p.type === "text" && typeof p.text === "string").map(p => p.text).join("\n")
}

function makeClient(ctx, aliases = new Map()) {
  const running = new Set()
  const resolveAgent = (name) => (typeof name === "string" && aliases.get(name)) || (typeof name === "string" && aliases.get(name.toLowerCase())) || name
  const sessionID = (args) => args?.path?.id ?? args?.sessionID ?? args?.path?.sessionID
  const prompt = async (args = {}) => {
    const id = sessionID(args)
    const body = args.body ?? args
    if (body.agent) {
      log("agent prompt", { sessionID: id, agent: body.agent, resolved: resolveAgent(body.agent), model: body.model })
      await ctx.session.switchAgent({ sessionID: id, agent: resolveAgent(body.agent) })
      const ref = body.model
        ? { providerID: body.model.providerID, id: body.model.modelID ?? body.model.id }
        : forcedModelRef()
      if (ref) await ctx.session.switchModel({ sessionID: id, model: ref })
    }
    const admitted = await ctx.session.prompt({ sessionID: id, text: body.text ?? partsToText(body.parts) })
    if (body.agent) {
      running.add(id)
      ctx.session.wait({ sessionID: id }).then(() => running.delete(id)).catch(() => running.delete(id))
    }
    return admitted
  }
  return {
    session: {
      messages: async (args) => {
        const raw = await ctx.session.context({ sessionID: sessionID(args) })
        const arr0 = Array.isArray(raw) ? raw : (raw?.messages ?? [])
        log("context read", { sessionID: sessionID(args), len: arr0.length, entries: arr0.slice(0, 5).map(m => ({ type: m.type, role: m.role, infoRole: m.info?.role, parts: m.parts?.length, content: m.content?.length })) })
        const arr = arr0
        const list = arr.map(m => {
          const info = m.info ?? { id: m.id, role: m.role ?? m.type, time: m.time ?? { created: 0 } }
          const parts = m.parts ?? (Array.isArray(m.content) ? m.content : [])
          return { info, parts }
        })
        return wrap(list)
      },
      todo: async () => wrap([]),
      promptAsync: async (args) => { prompt(args).catch(e => log("promptAsync error", e?.stack || String(e))); return true },
      summarize: async (args) => ctx.session.compact({ sessionID: sessionID(args) }),
      get: async (args) => wrap(await ctx.session.get({ sessionID: sessionID(args) })),
      status: async () => wrap(Object.fromEntries([...running].map(id => [id, { type: "busy" }]))),
      create: async (args) => wrap(await ctx.session.create(args?.body ?? {})),
      abort: async (args) => ctx.session.interrupt({ sessionID: sessionID(args) }),
      children: async () => wrap([]),
      prompt,
      command: async (args) => ctx.session.command({ sessionID: sessionID(args), command: args?.body?.command, arguments: args?.body?.arguments }),
    },
    tui: { showToast: async (args) => log("toast", args?.body ?? args) },
    app: { log: async (args) => log("app.log", args?.body ?? args) },
    config: { get: async () => wrap({}) },
  }
}

// ---------------------------------------------------------------------------
// Tool conversion
// ---------------------------------------------------------------------------

function zodType(schema) {
  const d = schema?._zod?.def
  if (!d) return {}
  switch (d.type) {
    case "string": return { type: "string" }
    case "number": return { type: "number" }
    case "boolean": return { type: "boolean" }
    case "bigint": return { type: "integer" }
    case "date": return { type: "string", format: "date-time" }
    case "enum": return { type: "string", enum: Object.keys(d.entries || {}) }
    case "literal": return { const: d.values?.[0] }
    case "array": return { type: "array", items: zodType(d.element) }
    case "tuple": return { type: "array", items: (d.items || []).map(zodType) }
    case "object": {
      const shape = d.shape || {}
      const properties = {}
      const required = []
      for (const [key, field] of Object.entries(shape)) {
        properties[key] = zodType(field)
        const ft = field?._zod?.def?.type
        if (ft !== "optional" && ft !== "default" && ft !== "prefault") required.push(key)
      }
      return { type: "object", properties, ...(required.length ? { required } : {}), additionalProperties: false }
    }
    case "union": {
      const options = (d.options || []).map(zodType)
      const literals = options.filter(o => "const" in o).map(o => o.const)
      if (literals.length === options.length) return { enum: literals }
      return { anyOf: options }
    }
    case "record": return { type: "object", additionalProperties: zodType(d.valueType) }
    case "optional":
    case "nullable":
    case "default":
    case "prefault":
    case "readonly": return zodType(d.innerType)
    case "pipe": return zodType(d.in)
    case "transform": return zodType(d.in)
    case "any":
    case "unknown": return {}
    default: return {}
  }
}

function toJsonSchema(args) {
  if (!args || Object.keys(args).length === 0) return { type: "object", properties: {}, additionalProperties: false }
  const properties = {}
  const required = []
  for (const [key, field] of Object.entries(args)) {
    let converted = {}
    try { converted = zodType(field) } catch (e) { log(`zod field failed ${key}`, e?.stack || String(e)) }
    if (field?.description) converted = { ...converted, description: field.description }
    properties[key] = converted
    const ft = field?._zod?.def?.type
    if (ft !== "optional" && ft !== "default" && ft !== "prefault") required.push(key)
  }
  return { type: "object", properties, ...(required.length ? { required } : {}), additionalProperties: false }
}

function resultToContent(result) {
  if (typeof result === "string") return { content: result }
  if (isRecord(result)) {
    if (typeof result.output === "string") {
      return { content: result.output, ...(isRecord(result.metadata) ? { metadata: result.metadata } : {}) }
    }
    if (typeof result.content === "string") return result
  }
  return { content: result === undefined ? "" : safeJson(result) }
}

function convertTool(name, def) {
  if (!def || typeof def.execute !== "function") return undefined
  let input
  try { input = toJsonSchema(def.args) } catch (e) { log(`tool schema failed ${name}`, e?.stack || String(e)); input = { type: "object", properties: {}, additionalProperties: false } }
  return {
    name,
    description: def.description || name,
    input,
    execute: async (args, context) => {
      const result = await def.execute(args, {
        sessionID: context?.sessionID,
        messageID: context?.messageID,
        agent: context?.agent,
        abort: context?.signal,
      })
      return resultToContent(result)
    },
  }
}

// ---------------------------------------------------------------------------
// Hook conversion
// ---------------------------------------------------------------------------

function modelRef(model) {
  if (!model) return undefined
  if (typeof model === "string") {
    const [providerID, rest] = model.split("/")
    if (!rest) return undefined
    const [id, variant] = rest.split("#")
    return { providerID, id, ...(variant ? { variant } : {}) }
  }
  const providerID = model.providerID ?? model.providerId ?? model.provider
  const id = model.modelID ?? model.modelId ?? model.id
  if (!providerID || !id) return undefined
  return { providerID, id, ...(model.variant ? { variant: model.variant } : {}) }
}

function toV1Messages(event) {
  return (event.messages || []).map(m => ({
    info: { id: m.id, role: m.role, sessionID: event.sessionID, ...(m.metadata ? { metadata: m.metadata } : {}) },
    parts: Array.isArray(m.content) ? m.content : [],
  }))
}

async function registerSessionHooks(ctx, v1) {
  // V1 chat.message -> V2 prompt
  if (typeof v1["chat.message"] === "function") {
    await guard("hook prompt", () => ctx.session.hook("prompt", async (event) => {
      const out = {
        message: { role: "user" },
        parts: [{ type: "text", text: event.prompt?.text ?? "" }],
      }
      await v1["chat.message"]({ sessionID: event.sessionID, agent: event.agent, model: event.model }, out)
      const text = partsToText(out.parts)
      if (typeof text === "string") event.prompt.text = text
      const ref = modelRef(out.message?.model)
      if (ref) await guard("switchModel", () => ctx.session.switchModel({ sessionID: event.sessionID, model: ref }))
    }))
  }

  // V1 chat.params -> V2 context
  if (typeof v1["chat.params"] === "function") {
    await guard("hook context params", () => ctx.session.hook("context", async (event) => {
      const ref = modelRef(event.model)
      if (!ref) return
      const out = { options: {} }
      await v1["chat.params"]({
        sessionID: event.sessionID,
        agent: { name: typeof event.agent === "string" ? event.agent : event.agent?.name },
        model: { providerID: ref.providerID, modelID: ref.id },
        provider: { id: ref.providerID },
        message: { variant: ref.variant },
      }, out)
      if (typeof out.temperature === "number") event.options.temperature = out.temperature
      if (typeof out.topP === "number") event.options.topP = out.topP
      if (typeof out.maxOutputTokens === "number") event.options.maxTokens = out.maxOutputTokens
      if (isRecord(out.options)) Object.assign(event.options, out.options)
    }))
  }

  // V1 chat.headers -> V2 model.request
  if (typeof v1["chat.headers"] === "function") {
    await guard("hook model.request", () => ctx.session.hook("model.request", async (event) => {
      const out = { headers: {} }
      await v1["chat.headers"]({
        sessionID: event.sessionID,
        agent: event.agent,
        model: event.model,
        provider: { id: modelRef(event.model)?.providerID },
        message: {},
      }, out)
      if (isRecord(out.headers)) Object.assign(event.headers, out.headers)
    }))
  }

  // V1 experimental.chat.system.transform -> V2 context (system parts)
  const sysHook = v1["experimental.chat.system.transform"]
  if (typeof sysHook === "function") {
    await guard("hook context system", () => ctx.session.hook("context", async (event) => {
      const out = { system: (event.system || []).map(p => p?.text ?? "").filter(Boolean) }
      await sysHook({ sessionID: event.sessionID, model: event.model }, out)
      if (Array.isArray(out.system)) event.system = out.system.map(text => ({ type: "text", text }))
    }))
  }

  // V1 experimental.chat.messages.transform -> V2 context (messages)
  const msgHook = v1["experimental.chat.messages.transform"]
  if (typeof msgHook === "function") {
    await guard("hook context messages", () => ctx.session.hook("context", async (event) => {
      const out = { messages: toV1Messages(event) }
      await msgHook({}, out)
      if (!Array.isArray(out.messages)) return
      event.messages = out.messages.map(m => ({
        ...(isRecord(m.info) ? m.info : {}),
        id: m.info?.id,
        role: m.info?.role ?? "user",
        content: Array.isArray(m.parts) ? m.parts : [],
      }))
    }))
  }

  // V1 experimental.session.compacting -> V2 compaction (best effort)
  const compactHook = v1["experimental.session.compacting"]
  if (typeof compactHook === "function") {
    await guard("hook compaction", () => ctx.session.hook("compaction", async (event) => {
      const out = { context: [] }
      await compactHook({ sessionID: event.sessionID }, out)
      if (Array.isArray(out.context) && out.context.length && Array.isArray(event.messages)) {
        event.messages.push({ id: "omx-compaction-context", role: "user", content: [{ type: "text", text: out.context.join("\n") }] })
      }
    }))
  }
}

async function registerToolHooks(ctx, v1) {
  if (typeof v1["tool.execute.before"] === "function") {
    await guard("hook tool.before", () => ctx.tool.hook("execute.before", async (event) => {
      const input = { tool: event.tool, sessionID: event.sessionID, callID: event.id }
      const output = { args: isRecord(event.input) ? event.input : {} }
      await v1["tool.execute.before"](input, output)
      if (isRecord(output.args)) event.input = output.args
    }))
  }

  if (typeof v1["tool.execute.after"] === "function") {
    await guard("hook tool.after", () => ctx.tool.hook("execute.after", async (event) => {
      const input = { tool: event.tool, sessionID: event.sessionID, callID: event.id ?? "" }
      const res = event.result
      let text
      if (res?.output?.type === "text") text = res.output.text ?? ""
      else if (res?.output?.type === "file") text = res.output.content ?? ""
      else text = typeof res === "string" ? res : safeJson(res)
      const output = { title: event.tool, output: text, metadata: isRecord(res?.metadata) ? res.metadata : {} }
      await v1["tool.execute.after"](input, output)
      if (event.result && event.result.output?.type === "text" && typeof output.output === "string") {
        event.result.output.text = output.output
      }
      if (isRecord(output.metadata) && event.result) event.result.metadata = { ...(event.result.metadata || {}), ...output.metadata }
    }))
  }
}

// ---------------------------------------------------------------------------
// Config: agents (files), commands, MCP
// ---------------------------------------------------------------------------

function normalizeModelString(model) {
  if (typeof model !== "string") return undefined
  // Only keep models that are likely available; otherwise inherit session model.
  if (process.env.OMX_KEEP_MODELS === "1") return model
  return /deepseek/i.test(model) ? model : undefined
}

function agentFrontmatter(key, a) {
  const lines = ["---"]
  const rawDescription = typeof a.description === "string" ? a.description : `${key} agent`
  const description = rawDescription.replace(/^(\([^)]*\)\s*)+/, "").replace(/\(opencode-project\)\s*/g, "").trim() || `${key} agent`
  lines.push(`description: ${JSON.stringify(description)}`)
  lines.push(`mode: ${a.mode === "primary" ? "primary" : "subagent"}`)
  const model = normalizeModelString(a.model) || process.env.OMX_AGENT_MODEL || "deepseek/deepseek-flash"
  if (model) lines.push(`model: ${model}`)
  if (typeof a.temperature === "number") lines.push(`temperature: ${a.temperature}`)
  if (typeof a.top_p === "number") lines.push(`top_p: ${a.top_p}`)
  if (a.hidden === true) lines.push(`hidden: true`)
  lines.push("---", "")
  return lines.join("\n") + (typeof a.prompt === "string" ? a.prompt : `You are ${key}.`)
}

function writeAgents(dir, agents) {
  fs.mkdirSync(dir, { recursive: true })
  const written = []
  for (const [key, a] of Object.entries(agents || {})) {
    if (!a || typeof a !== "object") continue
    const id = key.trim()
    if (!id) continue
    const file = path.join(dir, `${id.replace(/[^\w.-]+/g, "-")}.md`)
    const body = agentFrontmatter(id, a)
    try {
      const prev = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : undefined
      if (prev !== body) fs.writeFileSync(file, body)
      written.push(id)
    } catch (e) { log(`agent write failed ${id}`, e?.stack || String(e)) }
  }
  return written
}

function mcpToV2(m, name) {
  if (!m || typeof m !== "object") return undefined
  const disabled = m.enabled === false
  if (m.type === "remote" || m.url) {
    return { type: "remote", url: m.url, ...(m.headers ? { headers: m.headers } : {}), disabled }
  }
  return {
    type: "local",
    command: Array.isArray(m.command) ? m.command : [m.command].filter(Boolean),
    ...(m.environment ? { environment: m.environment } : {}),
    disabled,
  }
}

async function registerCommands(ctx, commands) {
  const entries = Object.entries(commands || {}).filter(([, c]) => c && typeof c === "object")
  if (!entries.length) return
  await guard("commands transform", () => ctx.command.transform(editor => {
    for (const [name, c] of entries) {
      const template = typeof c.template === "string" ? c.template : ""
      if (!template) continue
      editor.add({
        name,
        description: typeof c.description === "string" ? c.description : undefined,
        execute: async ({ sessionID, prompt, delivery }) => {
          const text = template.replace(/\$ARGUMENTS/g, prompt?.text ?? "")
          if (c.agent) await ctx.session.switchAgent({ sessionID, agent: c.agent })
          await ctx.session.prompt({ sessionID, text, delivery })
        },
      })
    }
  }))
}

async function registerMcp(ctx, servers) {
  const entries = Object.entries(servers || {}).map(([n, m]) => [n, mcpToV2(m, n)]).filter(([, m]) => m)
  if (!entries.length) return
  await guard("mcp transform", () => ctx.mcp.transform(editor => {
    for (const [name, config] of entries) editor.set(name, config)
  }))
}

// ---------------------------------------------------------------------------
// Plugin entry
// ---------------------------------------------------------------------------

export default {
  id: "oh-my-cortex-v2",
  async setup(ctx) {
    log("setup start", { opencode: ctx.app?.version, dir: ctx.location?.directory })
    const mod = await import(pathToFileURL(OMX_DIST).href)
    const omx = mod.default
    if (!omx?.server) throw new Error("oh-my-cortex bundle does not export server()")
    const agentAliases = new Map()
    const client = makeClient(ctx, agentAliases)
    const v1 = await omx.server({
      directory: ctx.location.directory,
      worktree: ctx.location.directory,
      project: ctx.location.project,
      client,
    }, {})
    log("omx server ready", { hooks: Object.keys(v1 || {}) })

    // Apply OMX's V1 config handler to a synthetic config, then mirror the
    // domains V2 lets plugins register dynamically.
    let cfg = {}
    if (typeof v1.config === "function") {
      const synthetic = {}
      await guard("config handler", () => v1.config(synthetic))
      cfg = synthetic
      log("config handler result", {
        agents: Object.keys(synthetic.agent || {}),
        commands: Object.keys(synthetic.command || {}),
        mcp: Object.keys(synthetic.mcp || {}),
      })
    }

    if (WRITE_AGENTS && cfg.agent) {
      const dir = resolveAgentDir(ctx)
      const agentsToWrite = {}
      const seenAgentIds = new Set()
      for (const [key, value] of Object.entries(cfg.agent)) {
        if (BUILTIN_AGENTS.has(key)) continue
        const agentId = key.trim().replace(/[^\w.-]+/g, "-")
        if (seenAgentIds.has(agentId)) continue
        seenAgentIds.add(agentId)
        agentsToWrite[key] = value
      }
      const displayForId = new Map()
      for (const key of Object.keys(agentsToWrite)) {
        const id = key.trim().replace(/[^\w.-]+/g, "-")
        agentAliases.set(key, id)
        agentAliases.set(key.toLowerCase(), id)
        const short = key.split(" - ")[0].trim().toLowerCase()
        if (short && !agentAliases.has(short)) agentAliases.set(short, id)
        displayForId.set(id, key.trim())
      }
      await guard("agent display names", () => ctx.agent.transform(editor => {
        for (const [id, name] of displayForId) {
          if (editor.get(id)) editor.update(id, a => { a.name = name })
        }
      }))
      const written = writeAgents(dir, agentsToWrite)
      log("agents written", { dir, count: written.length, ids: written })
    }

    await registerCommands(ctx, cfg.command)
    log("commands registered", { names: Object.keys(cfg.command || {}) })
    await registerMcp(ctx, cfg.mcp)

    // Tools
    if (isRecord(v1.tool)) {
      const converted = []
      const skipped = []
      for (const [name, def] of Object.entries(v1.tool)) {
        try {
          const tool = convertTool(name, def)
          if (tool) { converted.push(tool); continue }
        } catch (e) { log(`tool convert failed ${name}`, e?.stack || String(e)) }
        skipped.push(name)
      }
      await guard("tool transform", () => ctx.tool.transform(editor => {
        for (const tool of converted) editor.add(tool)
      }))
      log("tools registered", { converted: converted.length, skipped, convertedNames: converted.map(t => t.name) })
      const post = (await ctx.tool.list()).map(t => t.id)
      log("post-transform tools", { count: post.length, tools: post })
    }

    await registerToolHooks(ctx, v1)
    await registerSessionHooks(ctx, v1)

    // V1 event -> V2 public event stream
    if (typeof v1.event === "function") {
      const controller = new AbortController()
      void (async () => {
        try {
          for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
            await guard(`event ${event.type}`, () => v1.event({
              event: {
                type: event.type,
                properties: event.data ?? event.properties ?? event,
              },
            }))
          }
        } catch (e) {
          if (!controller.signal.aborted) log("event loop ended", e?.stack || String(e))
        }
      })()
      return () => controller.abort()
    }
  },
}
