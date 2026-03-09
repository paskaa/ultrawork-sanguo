import * as fs from "fs"
import * as path from "path"
import * as os from "os"
import { UltraWorkSanguoConfigSchema, DEFAULT_AGENTS, DEFAULT_CATEGORIES, DEFAULT_ROUTING_RULES } from "./schema.js"
import type { UltraWorkSanguoConfig, AgentConfig, CategoryConfig } from "./schema.js"

/**
 * Parse JSONC (JSON with Comments) content
 * Removes comments while preserving URLs with //
 */
export function parseJsonc<T>(content: string): T {
  // First, protect URLs by replacing them with placeholders
  const urlPattern = /(https?:\/\/[^\s"'<>]+)/g
  const urls: string[] = []
  let urlIndex = 0
  const protectedContent = content.replace(urlPattern, (match) => {
    urls.push(match)
    return `__URL_PLACEHOLDER_${urlIndex++}__`
  })

  // Remove comments from protected content
  const cleaned = protectedContent
    .replace(/\/\*[\s\S]*?\*\//g, "")  // Remove block comments
    .replace(/\/\/.*$/gm, "")           // Remove line comments

  // Restore URLs
  const restored = cleaned.replace(/__URL_PLACEHOLDER_(\d+)__/g, (_, index) => {
    return urls[parseInt(index)] || match
  })

  return JSON.parse(restored) as T
}

export function deepMerge<T extends Record<string, unknown>>(base: T, override: Partial<T>): T {
  const result = { ...base } as T
  for (const key of Object.keys(override) as (keyof T)[]) {
    const overrideValue = override[key]
    if (overrideValue !== undefined) {
      if (typeof overrideValue === "object" && overrideValue !== null && !Array.isArray(overrideValue)) {
        result[key] = deepMerge(
          (base[key] as Record<string, unknown>) || {},
          overrideValue as Record<string, unknown>
        ) as T[keyof T]
      } else {
        result[key] = overrideValue as T[keyof T]
      }
    }
  }
  return result
}

const defaultConfig: UltraWorkSanguoConfig = {
  agents: DEFAULT_AGENTS,
  categories: DEFAULT_CATEGORIES,
  task_routing: {
    rules: DEFAULT_ROUTING_RULES,
    default_category: "deep",
    default_agent: "zhaoyun",
  },
  background_task: {
    defaultConcurrency: 5,
    staleTimeoutMs: 180000,
    providerConcurrency: {
      "zai-coding-plan": 5,
      "opencode": 10,
      "kimi-for-coding": 3,
    },
  },
  runtime_fallback: {
    enabled: true,
    retry_on_errors: [400, 429, 503, 529],
    max_fallback_attempts: 3,
    cooldown_seconds: 60,
    notify_on_fallback: true,
  },
  ultrawork: {
    triggers: ["/ulw", "/ultrawork", "ulw", "ultrawork"],
    default_orchestrator: "zhugeliang",
    auto_category_detection: true,
    parallel_execution: true,
    max_concurrent_agents: 5,
    progress_reporting: true,
  },
}

/**
 * 获取用户级配置目录
 * Windows: C:\Users\{username}\.opencode\
 * macOS/Linux: ~/.opencode/
 */
function getUserConfigDir(): string {
  return path.join(os.homedir(), ".opencode")
}

/**
 * 从指定路径加载配置文件
 */
function loadConfigFromFile(configDir: string): Partial<UltraWorkSanguoConfig> | null {
  const configPaths = [
    path.join(configDir, "ultrawork-sanguo.jsonc"),
    path.join(configDir, "ultrawork-sanguo.json"),
  ]

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, "utf-8")
        const rawConfig = parseJsonc<Record<string, unknown>>(content)
        const result = UltraWorkSanguoConfigSchema.safeParse(rawConfig)
        if (result.success) {
          console.log(`[UltraWork] Config loaded from ${configPath}`)
          return result.data as Partial<UltraWorkSanguoConfig>
        } else {
          console.warn(`[UltraWork] Config validation error in ${configPath}`)
        }
      } catch (err) {
        console.warn(`[UltraWork] Error loading config from ${configPath}:`, err)
      }
    }
  }
  return null
}

export function loadConfig(directory: string): UltraWorkSanguoConfig {
  // 1. 优先加载用户级配置
  const userConfigDir = getUserConfigDir()
  const userConfig = loadConfigFromFile(userConfigDir)

  // 2. 加载项目级配置（回退）
  const projectConfigDir = path.join(directory, ".opencode")
  const projectConfig = loadConfigFromFile(projectConfigDir)

  // 3. 合并配置：用户级优先，项目级作为补充
  // 注意：用户级配置优先，所以用户级配置在后
  let mergedConfig: Partial<UltraWorkSanguoConfig> = defaultConfig

  if (projectConfig) {
    mergedConfig = deepMerge(mergedConfig, projectConfig)
  }

  if (userConfig) {
    mergedConfig = deepMerge(mergedConfig, userConfig)
  }

  return mergedConfig as UltraWorkSanguoConfig
}

export function getAgentConfig(config: UltraWorkSanguoConfig, agentName: string): AgentConfig | undefined {
  const disabled = config.disabled_agents ?? []
  if (disabled.includes(agentName)) {
    return undefined
  }
  return config.agents?.[agentName]
}

export function getCategoryConfig(config: UltraWorkSanguoConfig, categoryName: string): CategoryConfig | undefined {
  const disabled = config.disabled_categories ?? []
  if (disabled.includes(categoryName)) {
    return undefined
  }
  return config.categories?.[categoryName]
}

export function getModelForAgent(config: UltraWorkSanguoConfig, agentName: string): string | undefined {
  const agentConfig = getAgentConfig(config, agentName)
  return agentConfig?.model
}