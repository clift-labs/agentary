import type { Task, TaskContext, EntityType } from '../protocol.js';
import { getSubdirectoryContext, getProjectContext, buildContextChain } from '../../context/reader.js';
import { getVaultRoot, getActiveProject } from '../../state/manager.js';

/**
 * Full context containing all available context information.
 */
export interface FullContext {
    globalContext: string;
    projectContext: string;
    entityContext: string;
    symbols: ReadonlyMap<string, string>;
    taskTokens: Readonly<Record<string, string>>;
    combined: string;
}

/**
 * Context provider for unified access to different context levels.
 */
export class ContextProvider {
    private cache: Map<string, { content: string; loadedAt: Date }> = new Map();
    private symbols: Map<string, string> = new Map();
    private cacheMaxAgeMs = 60000; // 1 minute cache

    constructor(
        private vaultRoot: string,
        private currentProject: string | null,
        private taskContext: TaskContext
    ) {
        this.initializeDefaultSymbols();
    }

    /**
     * Create a context provider from the current environment.
     */
    static async create(taskContext: TaskContext): Promise<ContextProvider> {
        const vaultRoot = await getVaultRoot();
        const currentProject = await getActiveProject();
        return new ContextProvider(vaultRoot, currentProject, taskContext);
    }

    /**
     * Initialize default symbols.
     */
    private initializeDefaultSymbols(): void {
        const now = new Date();
        this.symbols.set('current_date', now.toISOString().split('T')[0]);
        this.symbols.set('current_time', now.toISOString());
        this.symbols.set('vault_path', this.vaultRoot);
        if (this.currentProject) {
            this.symbols.set('project_name', this.currentProject);
        }
    }

    /**
     * Get the global symbol table.
     */
    getGlobalSymbols(): ReadonlyMap<string, string> {
        return this.symbols;
    }

    /**
     * Get a single symbol value.
     */
    getSymbol(key: string): string | undefined {
        return this.symbols.get(key) ?? this.taskContext.tokens[key];
    }

    /**
     * Get the current task context.
     */
    getTaskContext(): TaskContext {
        return this.taskContext;
    }

    /**
     * Get tokens from the task context.
     */
    getTaskTokens(): Readonly<Record<string, string>> {
        return this.taskContext.tokens;
    }

    /**
     * Get global context from vault root.
     */
    async getGlobalContext(): Promise<string> {
        return this.getCachedContext('global', async () => {
            const contexts = await buildContextChain(this.vaultRoot);
            return contexts.reverse().join('\n\n---\n\n');
        });
    }

    /**
     * Get context for a specific project.
     */
    async getProjectContext(projectName?: string): Promise<string> {
        const project = projectName ?? this.currentProject;
        if (!project) {
            return '';
        }

        return this.getCachedContext(`project:${project}`, async () => {
            return getProjectContext(project);
        });
    }

    /**
     * Get the full context chain from root to project.
     */
    async getProjectContextChain(projectName?: string): Promise<string> {
        const project = projectName ?? this.currentProject;
        if (!project) {
            return this.getGlobalContext();
        }

        return this.getCachedContext(`project-chain:${project}`, async () => {
            return getProjectContext(project);
        });
    }

    /**
     * Get context for a specific entity type.
     */
    async getEntityContext(entity: EntityType, projectName?: string): Promise<string> {
        const project = projectName ?? this.currentProject;
        if (!project) {
            return '';
        }

        return this.getCachedContext(`entity:${project}:${entity}`, async () => {
            return getSubdirectoryContext(project, entity);
        });
    }

    /**
     * Get the full context chain from root to entity.
     */
    async getEntityContextChain(entity: EntityType, projectName?: string): Promise<string> {
        const project = projectName ?? this.currentProject;
        if (!project) {
            return this.getGlobalContext();
        }

        return this.getCachedContext(`entity-chain:${project}:${entity}`, async () => {
            return getSubdirectoryContext(project, entity);
        });
    }

    /**
     * Get all relevant context for a task.
     */
    async getFullContext(entity: EntityType, projectName?: string): Promise<FullContext> {
        const [globalContext, projectContext, entityContext] = await Promise.all([
            this.getGlobalContext(),
            this.getProjectContext(projectName),
            this.getEntityContext(entity, projectName),
        ]);

        const combined = [globalContext, projectContext, entityContext]
            .filter(Boolean)
            .join('\n\n---\n\n');

        return {
            globalContext,
            projectContext,
            entityContext,
            symbols: this.symbols,
            taskTokens: this.taskContext.tokens,
            combined,
        };
    }

    /**
     * Invalidate cache for a specific path or all cache.
     */
    invalidateCache(path?: string): void {
        if (path) {
            // Invalidate entries containing this path
            for (const key of this.cache.keys()) {
                if (key.includes(path)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
    }

    /**
     * Get cached context or load it.
     */
    private async getCachedContext(
        key: string,
        loader: () => Promise<string>
    ): Promise<string> {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.loadedAt.getTime() < this.cacheMaxAgeMs) {
            return cached.content;
        }

        const content = await loader();
        this.cache.set(key, { content, loadedAt: new Date() });
        return content;
    }
}
