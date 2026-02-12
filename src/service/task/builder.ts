import { randomUUID } from 'crypto';
import type { Task, TaskStep, TaskContext, TaskScope, EntityType, Canvas } from '../protocol.js';

/**
 * Fluent builder for creating multi-step tasks.
 */
export class TaskBuilder {
    private task: Partial<Task>;
    private steps: TaskStep[] = [];

    private constructor(name: string) {
        this.task = {
            id: randomUUID(),
            name,
            scope: { type: 'global' },
            steps: [],
            currentStepIndex: 0,
            context: {
                tokens: {},
                previousOutputs: [],
            },
            log: [],
            createdAt: new Date(),
            status: 'queued',
        };
    }

    static create(name: string): TaskBuilder {
        return new TaskBuilder(name);
    }

    /**
     * Set task scope to a specific project.
     */
    forProject(projectName: string): this {
        this.task.scope = { type: 'project', projectName };
        return this;
    }

    /**
     * Set task scope to global (vault-wide).
     */
    forGlobal(): this {
        this.task.scope = { type: 'global' };
        return this;
    }

    /**
     * Bind task to a session.
     */
    forSession(sessionId: string): this {
        this.task.sessionId = sessionId;
        return this;
    }

    /**
     * Set the entity type for context loading.
     */
    forEntity(entity: EntityType): this {
        if (this.task.context) {
            this.task.context.entity = entity;
        }
        return this;
    }

    /**
     * Set initial canvas.
     */
    withCanvas(canvas: Canvas): this {
        if (this.task.context) {
            this.task.context.canvas = canvas;
        }
        return this;
    }

    /**
     * Set initial tokens.
     */
    withTokens(tokens: Record<string, string>): this {
        if (this.task.context) {
            for (const [key, value] of Object.entries(tokens)) {
                this.task.context.tokens[key] = value;
            }
        }
        return this;
    }

    /**
     * Add a step to the task.
     */
    addStep(toolName: string, input: unknown): this {
        const step: TaskStep = {
            id: randomUUID(),
            toolName,
            input,
            status: 'pending',
        };
        this.steps.push(step);
        return this;
    }

    /**
     * Build the final task.
     */
    build(): Task {
        return {
            ...this.task,
            steps: this.steps,
        } as Task;
    }
}
