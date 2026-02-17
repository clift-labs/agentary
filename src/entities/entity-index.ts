// ─────────────────────────────────────────────────────────────────────────────
// ENTITY INDEX & RELATIONSHIP GRAPH
// ─────────────────────────────────────────────────────────────────────────────
//
// In-memory index of all entities in the active project.
// Stores lightweight node records (id, type, title, filepath) and a directed
// edge list extracted from @slug (people) and type:slug (entity) references.
// ─────────────────────────────────────────────────────────────────────────────

import { promises as fs } from 'fs';
import path from 'path';
import { getVaultRoot, getActiveProject } from '../state/manager.js';
import { parseEntity, type EntityTypeName } from './entity.js';
import { extractPeopleMentions, extractEntityRefs } from '../context/mentions.js';
import { debug } from '../utils/debug.js';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface IndexNode {
    id: string;              // slug (filename without .md)
    type: EntityTypeName;
    title: string;
    filepath: string;
}

export interface IndexEdge {
    source: string;          // composite key "type:id"
    target: string;          // composite key "type:id"
    edgeType: 'mention' | 'reference';  // @slug → mention, type:slug → reference
}

export interface IndexStats {
    nodeCount: number;
    edgeCount: number;
    byType: Record<string, number>;
    builtAt: string;         // ISO timestamp
}

// ─────────────────────────────────────────────────────────────────────────────
// DIR MAPPING
// ─────────────────────────────────────────────────────────────────────────────

const ALL_ENTITY_TYPES: EntityTypeName[] = [
    'note', 'task', 'event', 'research', 'goal', 'recurrence', 'person',
];

const DIR_MAP: Record<EntityTypeName, string> = {
    note: 'notes',
    task: 'todos',
    event: 'events',
    research: 'research',
    goal: 'goals',
    recurrence: 'recurrences',
    person: 'people',
};

// ─────────────────────────────────────────────────────────────────────────────
// ENTITY INDEX
// ─────────────────────────────────────────────────────────────────────────────

export class EntityIndex {
    private nodes = new Map<string, IndexNode>();     // key = "type:id"
    private edges: IndexEdge[] = [];
    private _builtAt: Date | null = null;

    // ── Key helpers ─────────────────────────────────────────────────────

    private static key(type: EntityTypeName, id: string): string {
        return `${type}:${id}`;
    }

    // ── Build ───────────────────────────────────────────────────────────

    /**
     * Scan all entity directories, build node map and edge list.
     */
    async build(): Promise<void> {
        const vaultRoot = await getVaultRoot();
        const project = await getActiveProject();
        if (!project) {
            debug('index', 'No active project — skipping index build');
            return;
        }

        const projectDir = path.join(vaultRoot, 'projects', project);

        // Pass 1: collect all nodes
        for (const entityType of ALL_ENTITY_TYPES) {
            const dir = path.join(projectDir, DIR_MAP[entityType]);

            try {
                const files = await fs.readdir(dir);
                for (const file of files) {
                    if (!file.endsWith('.md') || file.startsWith('.')) continue;

                    const filepath = path.join(dir, file);
                    const id = path.basename(file, '.md');
                    const key = EntityIndex.key(entityType, id);

                    try {
                        const raw = await fs.readFile(filepath, 'utf-8');
                        const { meta } = parseEntity(filepath, raw);

                        this.nodes.set(key, {
                            id,
                            type: entityType,
                            title: (meta.title as string) || id,
                            filepath,
                        });
                    } catch (err) {
                        debug('index', `Failed to parse ${filepath}: ${err}`);
                    }
                }
            } catch {
                // Directory doesn't exist — skip
            }
        }

        // Pass 2: extract edges from content
        for (const entityType of ALL_ENTITY_TYPES) {
            const dir = path.join(projectDir, DIR_MAP[entityType]);

            try {
                const files = await fs.readdir(dir);
                for (const file of files) {
                    if (!file.endsWith('.md') || file.startsWith('.')) continue;

                    const filepath = path.join(dir, file);
                    const id = path.basename(file, '.md');
                    const sourceKey = EntityIndex.key(entityType, id);

                    try {
                        const raw = await fs.readFile(filepath, 'utf-8');
                        const { content } = parseEntity(filepath, raw);

                        // @slug → person mention edges
                        const peopleSlugs = extractPeopleMentions(content);
                        for (const slug of peopleSlugs) {
                            const targetKey = EntityIndex.key('person', slug);
                            if (this.nodes.has(targetKey)) {
                                this.edges.push({
                                    source: sourceKey,
                                    target: targetKey,
                                    edgeType: 'mention',
                                });
                            }
                        }

                        // type:slug → entity reference edges
                        const entityRefs = extractEntityRefs(content);
                        for (const ref of entityRefs) {
                            const targetKey = EntityIndex.key(ref.type, ref.slug);
                            if (this.nodes.has(targetKey)) {
                                this.edges.push({
                                    source: sourceKey,
                                    target: targetKey,
                                    edgeType: 'reference',
                                });
                            }
                        }
                    } catch (err) {
                        debug('index', `Failed to extract refs from ${filepath}: ${err}`);
                    }
                }
            } catch {
                // Directory doesn't exist — skip
            }
        }

        this._builtAt = new Date();
        debug('index', `Built index: ${this.nodes.size} nodes, ${this.edges.length} edges`);
    }

    /**
     * Clear and rebuild the index.
     */
    async rebuild(): Promise<void> {
        this.nodes.clear();
        this.edges = [];
        this._builtAt = null;
        await this.build();
    }

    // ── Queries ──────────────────────────────────────────────────────────

    getNode(key: string): IndexNode | undefined {
        return this.nodes.get(key);
    }

    getNodes(type?: EntityTypeName): IndexNode[] {
        const all = [...this.nodes.values()];
        return type ? all.filter(n => n.type === type) : all;
    }

    getEdgesFrom(key: string): IndexEdge[] {
        return this.edges.filter(e => e.source === key);
    }

    getEdgesTo(key: string): IndexEdge[] {
        return this.edges.filter(e => e.target === key);
    }

    getNeighbors(key: string): { node: IndexNode; direction: 'out' | 'in'; edgeType: string }[] {
        const results: { node: IndexNode; direction: 'out' | 'in'; edgeType: string }[] = [];
        const seen = new Set<string>();

        for (const edge of this.edges) {
            if (edge.source === key && !seen.has(`out:${edge.target}`)) {
                const node = this.nodes.get(edge.target);
                if (node) {
                    results.push({ node, direction: 'out', edgeType: edge.edgeType });
                    seen.add(`out:${edge.target}`);
                }
            }
            if (edge.target === key && !seen.has(`in:${edge.source}`)) {
                const node = this.nodes.get(edge.source);
                if (node) {
                    results.push({ node, direction: 'in', edgeType: edge.edgeType });
                    seen.add(`in:${edge.source}`);
                }
            }
        }

        return results;
    }

    getAllEdges(): IndexEdge[] {
        return [...this.edges];
    }

    getStats(): IndexStats {
        const byType: Record<string, number> = {};
        for (const node of this.nodes.values()) {
            byType[node.type] = (byType[node.type] || 0) + 1;
        }
        return {
            nodeCount: this.nodes.size,
            edgeCount: this.edges.length,
            byType,
            builtAt: this._builtAt?.toISOString() || 'never',
        };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLETON
// ─────────────────────────────────────────────────────────────────────────────

let _index: EntityIndex | null = null;

export function getEntityIndex(): EntityIndex {
    if (!_index) {
        _index = new EntityIndex();
    }
    return _index;
}
