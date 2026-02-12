import type { LLMCapability } from '../schemas/index.js';
import type { TaskLogger, Canvas, EntityType } from '../service/protocol.js';
import type { ContextProvider } from '../service/context/provider.js';

// ─────────────────────────────────────────────────────────────────────────────
// Service Tool Interface
// ─────────────────────────────────────────────────────────────────────────────

export interface LLMProxy {
    chat(messages: { role: string; content: string }[], options?: { systemPrompt?: string }): Promise<string>;
}

export interface ServiceToolExecutionContext {
    taskId: string;
    stepId: string;
    sessionId?: string;

    // Unified context access
    ctx: ContextProvider;

    // Task-specific data
    previousOutputs: readonly unknown[];
    canvas?: Canvas;

    // Debug logging
    log: TaskLogger;

    // Proxied services
    llm: LLMProxy;
}

export interface ServiceToolResult {
    success: boolean;
    output: unknown;
    tokensToSet?: Record<string, string>;
    canvasUpdate?: Partial<Canvas>;
    error?: string;
}

export interface ServiceTool {
    name: string;
    description: string;
    type: 'deterministic' | 'ai';
    capability?: LLMCapability;

    // Input schema for validation
    inputSchema?: {
        type: string;
        properties?: Record<string, {
            type: string;
            description?: string;
            required?: boolean;
            properties?: Record<string, { type: string; description?: string }>;
            items?: { type: string };
        }>;
        required?: string[];
    };

    execute(input: unknown, context: ServiceToolExecutionContext): Promise<ServiceToolResult>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool Registry
// ─────────────────────────────────────────────────────────────────────────────

const serviceTools: Map<string, ServiceTool> = new Map();

export function registerServiceTool(tool: ServiceTool): void {
    serviceTools.set(tool.name, tool);
}

export function getServiceTool(name: string): ServiceTool | undefined {
    return serviceTools.get(name);
}

export function listServiceTools(): ServiceTool[] {
    return Array.from(serviceTools.values());
}

export function hasServiceTool(name: string): boolean {
    return serviceTools.has(name);
}
