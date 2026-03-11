// ─────────────────────────────────────────────────────────────────────────────
// Feral MCP — Catalog Source
// ─────────────────────────────────────────────────────────────────────────────

import type { CatalogSource } from './catalog.js';
import type { CatalogNode } from './catalog-node.js';
import { createCatalogNode } from './catalog-node.js';
import type { McpToolInfo } from '../../skills/mcp-manager.js';

/**
 * Provides CatalogNodes for tools discovered from MCP skill servers.
 * Takes pre-discovered tool info (solves sync getCatalogNodes() constraint).
 */
export class McpCatalogSource implements CatalogSource {
    private tools: McpToolInfo[];

    constructor(tools: McpToolInfo[]) {
        this.tools = tools;
    }

    getCatalogNodes(): CatalogNode[] {
        return this.tools.map(tool =>
            createCatalogNode({
                key: `mcp_${tool.skillId}_${tool.name}`,
                nodeCodeKey: 'mcp_call_tool',
                name: `${tool.skillId}: ${tool.name}`,
                group: `skill:${tool.skillId}`,
                description: tool.description,
                configuration: {
                    skill_id: tool.skillId,
                    tool_name: tool.name,
                },
            }),
        );
    }
}
