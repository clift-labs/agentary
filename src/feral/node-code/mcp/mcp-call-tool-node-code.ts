// ─────────────────────────────────────────────────────────────────────────────
// Feral CCF — MCP Call Tool NodeCode
// ─────────────────────────────────────────────────────────────────────────────

import type { Context } from '../../context/context.js';
import type { Result } from '../../result/result.js';
import { ResultStatus } from '../../result/result.js';
import type { ConfigurationDescription, ResultDescription } from '../../configuration/configuration-description.js';
import { AbstractNodeCode } from '../abstract-node-code.js';
import { NodeCodeCategory } from '../node-code.js';
import { mcpManager } from '../../../skills/mcp-manager.js';

export class McpCallToolNodeCode extends AbstractNodeCode {
    readonly allowExtraConfig = true;

    static readonly configDescriptions: ConfigurationDescription[] = [
        { key: 'skill_id', name: 'Skill ID', description: 'The MCP skill server ID.', type: 'string' },
        { key: 'tool_name', name: 'Tool Name', description: 'The tool name to call on the MCP server.', type: 'string' },
        { key: 'arguments_context_path', name: 'Arguments Context Path', description: 'Context key containing the tool arguments object.', type: 'string', isOptional: true },
        { key: 'response_context_path', name: 'Response Path', description: 'Context key to store the MCP tool response.', type: 'string', default: 'mcp_response' },
    ];
    static readonly resultDescriptions: ResultDescription[] = [
        { status: ResultStatus.OK, description: 'MCP tool call completed successfully.' },
        { status: ResultStatus.ERROR, description: 'MCP tool call failed.' },
    ];

    constructor() {
        super('mcp_call_tool', 'MCP Call Tool', 'Call a tool on an MCP skill server.', NodeCodeCategory.DATA);
    }

    async process(context: Context): Promise<Result> {
        const skillId = this.getRequiredConfigValue('skill_id') as string;
        const toolName = this.getRequiredConfigValue('tool_name') as string;
        const argsPath = this.getOptionalConfigValue('arguments_context_path') as string | null;
        const responsePath = this.getRequiredConfigValue('response_context_path', 'mcp_response') as string;

        let args: Record<string, unknown> = {};
        if (argsPath && context.has(argsPath)) {
            const raw = context.get(argsPath);
            args = typeof raw === 'object' && raw !== null ? raw as Record<string, unknown> : {};
        }

        try {
            const result = await mcpManager.callTool(skillId, toolName, args);
            context.set(responsePath, result);
            return this.result(ResultStatus.OK, `MCP tool ${skillId}/${toolName} called successfully.`);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return this.result(ResultStatus.ERROR, `MCP tool ${skillId}/${toolName} failed: ${message}`);
        }
    }
}
