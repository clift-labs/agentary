// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT ENTITY TYPE DEFINITIONS
// Only the two built-in types: task (todos) and note.
// All other types are user-defined via `dobbie type add`.
// ─────────────────────────────────────────────────────────────────────────────

import type { EntityTypeConfig } from './entity-type-config.js';

export const DEFAULT_ENTITY_TYPES: EntityTypeConfig[] = [
    {
        name: 'task',
        plural: 'tasks',
        directory: 'todos',
        description: 'Actionable items to complete',
        defaultTags: ['todo'],
        fields: [
            { key: 'status',   type: 'enum',   label: 'Status',
              values: ['open', 'in-progress', 'done', 'blocked'], default: 'open',   required: true },
            { key: 'priority', type: 'enum',   label: 'Priority',
              values: ['low', 'medium', 'high', 'critical'],       default: 'medium', required: true },
            { key: 'dueDate',  type: 'date',   label: 'Due Date',  required: false },
        ],
        completionField: 'status',
        completionValue: 'done',
    },
    {
        name: 'note',
        plural: 'notes',
        directory: 'notes',
        description: 'Free-form notes and references',
        defaultTags: ['note'],
        fields: [],
    },
];

/** Names of built-in types that cannot be removed. */
export const BUILT_IN_TYPE_NAMES = new Set(['task', 'note']);
