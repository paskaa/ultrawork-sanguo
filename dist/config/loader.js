"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJsonc = parseJsonc;
exports.deepMerge = deepMerge;
exports.loadConfig = loadConfig;
exports.getAgentConfig = getAgentConfig;
exports.getCategoryConfig = getCategoryConfig;
exports.getModelForAgent = getModelForAgent;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const schema_js_1 = require("./schema.js");
/**
 * Parse JSONC (JSON with Comments) content
 * Removes comments while preserving URLs with //
 */
function parseJsonc(content) {
    // First, protect URLs by replacing them with placeholders
    const urlPattern = /(https?:\/\/[^\s"'<>]+)/g;
    const urls = [];
    let urlIndex = 0;
    const protectedContent = content.replace(urlPattern, (match) => {
        urls.push(match);
        return `__URL_PLACEHOLDER_${urlIndex++}__`;
    });
    // Remove comments from protected content
    const cleaned = protectedContent
        .replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
        .replace(/\/\/.*$/gm, ""); // Remove line comments
    // Restore URLs
    const restored = cleaned.replace(/__URL_PLACEHOLDER_(\d+)__/g, (_, index) => {
        return urls[parseInt(index)] || match;
    });
    return JSON.parse(restored);
}
function deepMerge(base, override) {
    const result = { ...base };
    for (const key of Object.keys(override)) {
        const overrideValue = override[key];
        if (overrideValue !== undefined) {
            if (typeof overrideValue === "object" && overrideValue !== null && !Array.isArray(overrideValue)) {
                result[key] = deepMerge(base[key] || {}, overrideValue);
            }
            else {
                result[key] = overrideValue;
            }
        }
    }
    return result;
}
const defaultConfig = {
    agents: schema_js_1.DEFAULT_AGENTS,
    categories: schema_js_1.DEFAULT_CATEGORIES,
    task_routing: {
        rules: schema_js_1.DEFAULT_ROUTING_RULES,
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
};
/**
 * 获取用户级配置目录
 * Windows: C:\Users\{username}\.opencode\
 * macOS/Linux: ~/.opencode/
 */
function getUserConfigDir() {
    return path.join(os.homedir(), ".opencode");
}
/**
 * 从指定路径加载配置文件
 */
function loadConfigFromFile(configDir) {
    const configPaths = [
        path.join(configDir, "ultrawork-sanguo.jsonc"),
        path.join(configDir, "ultrawork-sanguo.json"),
    ];
    for (const configPath of configPaths) {
        if (fs.existsSync(configPath)) {
            try {
                const content = fs.readFileSync(configPath, "utf-8");
                const rawConfig = parseJsonc(content);
                const result = schema_js_1.UltraWorkSanguoConfigSchema.safeParse(rawConfig);
                if (result.success) {
                    console.log(`[UltraWork] Config loaded from ${configPath}`);
                    return result.data;
                }
                else {
                    console.warn(`[UltraWork] Config validation error in ${configPath}`);
                }
            }
            catch (err) {
                console.warn(`[UltraWork] Error loading config from ${configPath}:`, err);
            }
        }
    }
    return null;
}
function loadConfig(directory) {
    // 1. 优先加载用户级配置
    const userConfigDir = getUserConfigDir();
    const userConfig = loadConfigFromFile(userConfigDir);
    // 2. 加载项目级配置（回退）
    const projectConfigDir = path.join(directory, ".opencode");
    const projectConfig = loadConfigFromFile(projectConfigDir);
    // 3. 合并配置：用户级优先，项目级作为补充
    // 注意：用户级配置优先，所以用户级配置在后
    let mergedConfig = defaultConfig;
    if (projectConfig) {
        mergedConfig = deepMerge(mergedConfig, projectConfig);
    }
    if (userConfig) {
        mergedConfig = deepMerge(mergedConfig, userConfig);
    }
    return mergedConfig;
}
function getAgentConfig(config, agentName) {
    const disabled = config.disabled_agents ?? [];
    if (disabled.includes(agentName)) {
        return undefined;
    }
    return config.agents?.[agentName];
}
function getCategoryConfig(config, categoryName) {
    const disabled = config.disabled_categories ?? [];
    if (disabled.includes(categoryName)) {
        return undefined;
    }
    return config.categories?.[categoryName];
}
function getModelForAgent(config, agentName) {
    const agentConfig = getAgentConfig(config, agentName);
    return agentConfig?.model;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbmZpZy9sb2FkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFNQSxnQ0FLQztBQUVELDhCQWdCQztBQTBFRCxnQ0FzQkM7QUFFRCx3Q0FNQztBQUVELDhDQU1DO0FBRUQsNENBR0M7QUFsSkQsdUNBQXdCO0FBQ3hCLDJDQUE0QjtBQUM1Qix1Q0FBd0I7QUFDeEIsMkNBQW9IO0FBR3BILFNBQWdCLFVBQVUsQ0FBSSxPQUFlO0lBQzNDLE1BQU0sT0FBTyxHQUFHLE9BQU87U0FDcEIsT0FBTyxDQUFDLG1CQUFtQixFQUFFLEVBQUUsQ0FBQztTQUNoQyxPQUFPLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFBO0lBQzNCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQU0sQ0FBQTtBQUNqQyxDQUFDO0FBRUQsU0FBZ0IsU0FBUyxDQUFvQyxJQUFPLEVBQUUsUUFBb0I7SUFDeEYsTUFBTSxNQUFNLEdBQUcsRUFBRSxHQUFHLElBQUksRUFBTyxDQUFBO0lBQy9CLEtBQUssTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQWdCLEVBQUUsQ0FBQztRQUN2RCxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDbkMsSUFBSSxhQUFhLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDaEMsSUFBSSxPQUFPLGFBQWEsS0FBSyxRQUFRLElBQUksYUFBYSxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztnQkFDakcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLFNBQVMsQ0FDcEIsSUFBSSxDQUFDLEdBQUcsQ0FBNkIsSUFBSSxFQUFFLEVBQzVDLGFBQXdDLENBQzNCLENBQUE7WUFDakIsQ0FBQztp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LENBQUE7QUFDMUMsQ0FBQztBQUVELFNBQWdCLGdCQUFnQixDQUFDLE1BQTZCLEVBQUUsU0FBaUI7SUFDL0UsTUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQTtJQUNyRCxPQUFPLFdBQVcsRUFBRSxLQUFLLENBQUE7QUFDM0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCJcbmltcG9ydCAqIGFzIG9zIGZyb20gXCJvc1wiXG5pbXBvcnQgeyBVbHRyYVdvcmtTYW5ndW9Db25maWdTY2hlbWEsIERFRkFVTFRfQUdFTlRTLCBERUZBVUxUX0NBVEVHT1JJRVMsIERFRkFVTFRfUk9VVElOR19SVUxFUyB9IGZyb20gXCIuL3NjaGVtYS5qc1wiXG5pbXBvcnQgdHlwZSB7IFVsdHJhV29ya1Nhbmd1b0NvbmZpZywgQWdlbnRDb25maWcsIENhdGVnb3J5Q29uZmlnIH0gZnJvbSBcIi4vc2NoZW1hLmpzXCJcblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlSnNvbmM8VD4oY29udGVudDogc3RyaW5nKTogVCB7XG4gIGNvbnN0IGNsZWFuZWQgPSBjb250ZW50XG4gICAgLnJlcGxhY2UoL1xcL1xcKltcXHNcXFNdKj9cXCpcXC8vZywgXCJcIilcbiAgICAucmVwbGFjZSgvXFwvXFwvLiokL2dtLCBcIlwiKVxuICByZXR1cm4gSlNPTi5wYXJzZShjbGVhbmVkKSBhcyBUXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWVwTWVyZ2U8VCBleHRlbmRzIFJlY29yZDxzdHJpbmcsIHVua25vd24+PihiYXNlOiBULCBvdmVycmlkZTogUGFydGlhbDxUPik6IFQge1xuICBjb25zdCByZXN1bHQgPSB7IC4uLmJhc2UgfSBhcyBUXG4gIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKG92ZXJyaWRlKSBhcyAoa2V5b2YgVClbXSkge1xuICAgIGNvbnN0IG92ZXJyaWRlVmFsdWUgPSBvdmVycmlkZVtrZXldXG4gICAgaWYgKG92ZXJyaWRlVmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHR5cGVvZiBvdmVycmlkZVZhbHVlID09PSBcIm9iamVjdFwiICYmIG92ZXJyaWRlVmFsdWUgIT09IG51bGwgJiYgIUFycmF5LmlzQXJyYXkob3ZlcnJpZGVWYWx1ZSkpIHtcbiAgICAgICAgcmVzdWx0W2tleV0gPSBkZWVwTWVyZ2UoXG4gICAgICAgICAgKGJhc2Vba2V5XSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgfHwge30sXG4gICAgICAgICAgb3ZlcnJpZGVWYWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxuICAgICAgICApIGFzIFRba2V5b2YgVF1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdFtrZXldID0gb3ZlcnJpZGVWYWx1ZSBhcyBUW2tleW9mIFRdXG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxuY29uc3QgZGVmYXVsdENvbmZpZzogVWx0cmFXb3JrU2FuZ3VvQ29uZmlnID0ge1xuICBhZ2VudHM6IERFRkFVTFRfQUdFTlRTLFxuICBjYXRlZ29yaWVzOiBERUZBVUxUX0NBVEVHT1JJRVMsXG4gIHRhc2tfcm91dGluZzoge1xuICAgIHJ1bGVzOiBERUZBVUxUX1JPVVRJTkdfUlVMRVMsXG4gICAgZGVmYXVsdF9jYXRlZ29yeTogXCJkZWVwXCIsXG4gICAgZGVmYXVsdF9hZ2VudDogXCJ6aGFveXVuXCIsXG4gIH0sXG4gIGJhY2tncm91bmRfdGFzazoge1xuICAgIGRlZmF1bHRDb25jdXJyZW5jeTogNSxcbiAgICBzdGFsZVRpbWVvdXRNczogMTgwMDAwLFxuICAgIHByb3ZpZGVyQ29uY3VycmVuY3k6IHtcbiAgICAgIFwiemFpLWNvZGluZy1wbGFuXCI6IDUsXG4gICAgICBcIm9wZW5jb2RlXCI6IDEwLFxuICAgICAgXCJraW1pLWZvci1jb2RpbmdcIjogMyxcbiAgICB9LFxuICB9LFxuICBydW50aW1lX2ZhbGxiYWNrOiB7XG4gICAgZW5hYmxlZDogdHJ1ZSxcbiAgICByZXRyeV9vbl9lcnJvcnM6IFs0MDAsIDQyOSwgNTAzLCA1MjldLFxuICAgIG1heF9mYWxsYmFja19hdHRlbXB0czogMyxcbiAgICBjb29sZG93bl9zZWNvbmRzOiA2MCxcbiAgICBub3RpZnlfb25fZmFsbGJhY2s6IHRydWUsXG4gIH0sXG4gIHVsdHJhd29yazoge1xuICAgIHRyaWdnZXJzOiBbXCIvdWx3XCIsIFwiL3VsdHJhd29ya1wiLCBcInVsd1wiLCBcInVsdHJhd29ya1wiXSxcbiAgICBkZWZhdWx0X29yY2hlc3RyYXRvcjogXCJ6aHVnZWxpYW5nXCIsXG4gICAgYXV0b19jYXRlZ29yeV9kZXRlY3Rpb246IHRydWUsXG4gICAgcGFyYWxsZWxfZXhlY3V0aW9uOiB0cnVlLFxuICAgIG1heF9jb25jdXJyZW50X2FnZW50czogNSxcbiAgICBwcm9ncmVzc19yZXBvcnRpbmc6IHRydWUsXG4gIH0sXG59XG5cbi8qKlxuICog6I635Y+W55So5oi357qn6YWN572u55uu5b2VXG4gKiBXaW5kb3dzOiBDOlxcVXNlcnNcXHt1c2VybmFtZX1cXC5vcGVuY29kZVxcXG4gKiBtYWNPUy9MaW51eDogfi8ub3BlbmNvZGUvXG4gKi9cbmZ1bmN0aW9uIGdldFVzZXJDb25maWdEaXIoKTogc3RyaW5nIHtcbiAgcmV0dXJuIHBhdGguam9pbihvcy5ob21lZGlyKCksIFwiLm9wZW5jb2RlXCIpXG59XG5cbi8qKlxuICog5LuO5oyH5a6a6Lev5b6E5Yqg6L296YWN572u5paH5Lu2XG4gKi9cbmZ1bmN0aW9uIGxvYWRDb25maWdGcm9tRmlsZShjb25maWdEaXI6IHN0cmluZyk6IFBhcnRpYWw8VWx0cmFXb3JrU2FuZ3VvQ29uZmlnPiB8IG51bGwge1xuICBjb25zdCBjb25maWdQYXRocyA9IFtcbiAgICBwYXRoLmpvaW4oY29uZmlnRGlyLCBcInVsdHJhd29yay1zYW5ndW8uanNvbmNcIiksXG4gICAgcGF0aC5qb2luKGNvbmZpZ0RpciwgXCJ1bHRyYXdvcmstc2FuZ3VvLmpzb25cIiksXG4gIF1cblxuICBmb3IgKGNvbnN0IGNvbmZpZ1BhdGggb2YgY29uZmlnUGF0aHMpIHtcbiAgICBpZiAoZnMuZXhpc3RzU3luYyhjb25maWdQYXRoKSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhjb25maWdQYXRoLCBcInV0Zi04XCIpXG4gICAgICAgIGNvbnN0IHJhd0NvbmZpZyA9IHBhcnNlSnNvbmM8UmVjb3JkPHN0cmluZywgdW5rbm93bj4+KGNvbnRlbnQpXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IFVsdHJhV29ya1Nhbmd1b0NvbmZpZ1NjaGVtYS5zYWZlUGFyc2UocmF3Q29uZmlnKVxuICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgW1VsdHJhV29ya10gQ29uZmlnIGxvYWRlZCBmcm9tICR7Y29uZmlnUGF0aH1gKVxuICAgICAgICAgIHJldHVybiByZXN1bHQuZGF0YSBhcyBQYXJ0aWFsPFVsdHJhV29ya1Nhbmd1b0NvbmZpZz5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oYFtVbHRyYVdvcmtdIENvbmZpZyB2YWxpZGF0aW9uIGVycm9yIGluICR7Y29uZmlnUGF0aH1gKVxuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGBbVWx0cmFXb3JrXSBFcnJvciBsb2FkaW5nIGNvbmZpZyBmcm9tICR7Y29uZmlnUGF0aH06YCwgZXJyKVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbFxufVxuXG5leHBvcnQgZnVuY3Rpb24gbG9hZENvbmZpZyhkaXJlY3Rvcnk6IHN0cmluZyk6IFVsdHJhV29ya1Nhbmd1b0NvbmZpZyB7XG4gIC8vIDEuIOS8mOWFiOWKoOi9veeUqOaIt+e6p+mFjee9rlxuICBjb25zdCB1c2VyQ29uZmlnRGlyID0gZ2V0VXNlckNvbmZpZ0RpcigpXG4gIGNvbnN0IHVzZXJDb25maWcgPSBsb2FkQ29uZmlnRnJvbUZpbGUodXNlckNvbmZpZ0RpcilcblxuICAvLyAyLiDliqDovb3pobnnm67nuqfphY3nva7vvIjlm57pgIDvvIlcbiAgY29uc3QgcHJvamVjdENvbmZpZ0RpciA9IHBhdGguam9pbihkaXJlY3RvcnksIFwiLm9wZW5jb2RlXCIpXG4gIGNvbnN0IHByb2plY3RDb25maWcgPSBsb2FkQ29uZmlnRnJvbUZpbGUocHJvamVjdENvbmZpZ0RpcilcblxuICAvLyAzLiDlkIjlubbphY3nva7vvJrnlKjmiLfnuqfkvJjlhYjvvIzpobnnm67nuqfkvZzkuLrooaXlhYVcbiAgLy8g5rOo5oSP77ya55So5oi357qn6YWN572u5LyY5YWI77yM5omA5Lul55So5oi357qn6YWN572u5Zyo5ZCOXG4gIGxldCBtZXJnZWRDb25maWc6IFBhcnRpYWw8VWx0cmFXb3JrU2FuZ3VvQ29uZmlnPiA9IGRlZmF1bHRDb25maWdcblxuICBpZiAocHJvamVjdENvbmZpZykge1xuICAgIG1lcmdlZENvbmZpZyA9IGRlZXBNZXJnZShtZXJnZWRDb25maWcsIHByb2plY3RDb25maWcpXG4gIH1cblxuICBpZiAodXNlckNvbmZpZykge1xuICAgIG1lcmdlZENvbmZpZyA9IGRlZXBNZXJnZShtZXJnZWRDb25maWcsIHVzZXJDb25maWcpXG4gIH1cblxuICByZXR1cm4gbWVyZ2VkQ29uZmlnIGFzIFVsdHJhV29ya1Nhbmd1b0NvbmZpZ1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWdlbnRDb25maWcoY29uZmlnOiBVbHRyYVdvcmtTYW5ndW9Db25maWcsIGFnZW50TmFtZTogc3RyaW5nKTogQWdlbnRDb25maWcgfCB1bmRlZmluZWQge1xuICBjb25zdCBkaXNhYmxlZCA9IGNvbmZpZy5kaXNhYmxlZF9hZ2VudHMgPz8gW11cbiAgaWYgKGRpc2FibGVkLmluY2x1ZGVzKGFnZW50TmFtZSkpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkXG4gIH1cbiAgcmV0dXJuIGNvbmZpZy5hZ2VudHM/LlthZ2VudE5hbWVdXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDYXRlZ29yeUNvbmZpZyhjb25maWc6IFVsdHJhV29ya1Nhbmd1b0NvbmZpZywgY2F0ZWdvcnlOYW1lOiBzdHJpbmcpOiBDYXRlZ29yeUNvbmZpZyB8IHVuZGVmaW5lZCB7XG4gIGNvbnN0IGRpc2FibGVkID0gY29uZmlnLmRpc2FibGVkX2NhdGVnb3JpZXMgPz8gW11cbiAgaWYgKGRpc2FibGVkLmluY2x1ZGVzKGNhdGVnb3J5TmFtZSkpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkXG4gIH1cbiAgcmV0dXJuIGNvbmZpZy5jYXRlZ29yaWVzPy5bY2F0ZWdvcnlOYW1lXVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TW9kZWxGb3JBZ2VudChjb25maWc6IFVsdHJhV29ya1Nhbmd1b0NvbmZpZywgYWdlbnROYW1lOiBzdHJpbmcpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICBjb25zdCBhZ2VudENvbmZpZyA9IGdldEFnZW50Q29uZmlnKGNvbmZpZywgYWdlbnROYW1lKVxuICByZXR1cm4gYWdlbnRDb25maWc/Lm1vZGVsXG59Il19