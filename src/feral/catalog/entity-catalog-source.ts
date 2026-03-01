// ─────────────────────────────────────────────────────────────────────────────
// Feral CCF — Entity Catalog Source
// ─────────────────────────────────────────────────────────────────────────────
//
// Pre-configured CatalogNodes for entity CRUD operations across all entity types.
// Each entity type gets: list, find, create, update, delete, sort, review, and questions nodes.
// ─────────────────────────────────────────────────────────────────────────────

import type { CatalogNode } from './catalog-node.js';

interface EntityConfig {
    type: string;
    plural: string;
    createFields?: string;
    updateFields?: string;
    sortBy?: string;
}

const ENTITY_CONFIGS: EntityConfig[] = [
    { type: 'task', plural: 'tasks', createFields: 'status,priority,dueDate', updateFields: 'status,priority,dueDate', sortBy: 'priority,dueDate' },
    { type: 'note', plural: 'notes' },
    { type: 'event', plural: 'events', createFields: 'startDate,endDate,location,recurring', updateFields: 'startDate,endDate,location,recurring' },
    { type: 'research', plural: 'research', createFields: 'status,sources', updateFields: 'status,sources,appendContent' },
    { type: 'goal', plural: 'goals', createFields: 'status,priority,smart,milestones', updateFields: 'status,priority,smart,milestones,addMilestone', sortBy: 'priority,status' },
    { type: 'person', plural: 'people', createFields: 'company,group,phone,email,handle', updateFields: 'company,group,phone,email,handle' },
];

/**
 * Provides CatalogNodes for all entity-type CRUD operations.
 */
export class EntityCatalogSource {
    getCatalogNodes(): CatalogNode[] {
        const nodes: CatalogNode[] = [];

        for (const cfg of ENTITY_CONFIGS) {
            const { type, plural, createFields, updateFields, sortBy } = cfg;

            nodes.push({
                key: `list_${plural}`,
                nodeCodeKey: 'list_entities',
                name: `List ${capitalize(plural)}`,
                group: 'entity',
                description: `Lists all ${plural} in the active project.`,
                configuration: { entity_type: type, context_path: 'entities' },
            });

            nodes.push({
                key: `find_${type}`,
                nodeCodeKey: 'find_entity',
                name: `Find ${capitalize(type)}`,
                group: 'entity',
                description: `Finds a ${type} by title.`,
                configuration: { entity_type: type, title_context_key: 'title', context_path: 'entity' },
            });

            nodes.push({
                key: `create_${type}`,
                nodeCodeKey: 'create_entity',
                name: `Create ${capitalize(type)}`,
                group: 'entity',
                description: `Creates a new ${type}.`,
                configuration: createFields
                    ? { entity_type: type, extra_fields: createFields }
                    : { entity_type: type },
            });

            nodes.push({
                key: `update_${type}`,
                nodeCodeKey: 'update_entity',
                name: `Update ${capitalize(type)}`,
                group: 'entity',
                description: `Updates an existing ${type}.`,
                configuration: updateFields
                    ? { entity_type: type, patch_fields: updateFields }
                    : { entity_type: type },
            });

            nodes.push({
                key: `delete_${type}`,
                nodeCodeKey: 'delete_entity',
                name: `Delete ${capitalize(type)}`,
                group: 'entity',
                description: `Deletes a ${type} by title.`,
                configuration: { entity_type: type },
            });

            // Only entity types with a 'status' field get a complete node
            if (['task', 'goal', 'research'].includes(type)) {
                nodes.push({
                    key: `complete_${type}`,
                    nodeCodeKey: 'complete_entity',
                    name: `Complete ${capitalize(type)}`,
                    group: 'entity',
                    description: `Finds a ${type} by title and marks it as complete.`,
                    configuration: { entity_type: type },
                });
            }

            nodes.push({
                key: `sort_${plural}`,
                nodeCodeKey: 'sort_entities',
                name: `Sort ${capitalize(plural)}`,
                group: 'entity',
                description: `Sorts a ${plural} array by configurable fields.`,
                configuration: sortBy
                    ? { context_path: 'entities', sort_by: sortBy }
                    : { context_path: 'entities' },
            });

            // ── AI-powered review & questions ────────────────────────────

            nodes.push({
                key: `load_vault_context_${type}`,
                nodeCodeKey: 'load_vault_context',
                name: `Load Vault Context for ${capitalize(type)}`,
                group: 'entity',
                description: `Collects .socks.md context chain for ${plural}.`,
                configuration: { entity_type: type, context_path: 'vault_context' },
            });

            nodes.push({
                key: `review_${type}`,
                nodeCodeKey: 'llm_chat',
                name: `Review ${capitalize(type)}`,
                group: 'entity',
                description: `Reviews a ${type} and provides constructive feedback.`,
                configuration: {
                    capability: 'reason',
                    system_prompt: `You are a thoughtful reviewer. Analyse the ${type} provided and give constructive, actionable feedback on clarity, completeness, and quality. Be specific.\n\nContext:\n{vault_context}`,
                    prompt: `Please review this ${type}:\n\n{entity}\n\nProvide your review with specific suggestions for improvement.`,
                    response_context_path: 'llm_response',
                },
            });

            nodes.push({
                key: `questions_${type}`,
                nodeCodeKey: 'llm_chat',
                name: `Questions for ${capitalize(type)}`,
                group: 'entity',
                description: `Generates probing questions about a ${type}.`,
                configuration: {
                    capability: 'reason',
                    system_prompt: `You are a curious analyst. Given a ${type}, generate insightful questions that probe for gaps, unstated assumptions, and next steps. Be concise and number your questions.\n\nContext:\n{vault_context}`,
                    prompt: `Here is a ${type}:\n\n{entity}\n\nWhat questions should be asked about this ${type}?`,
                    response_context_path: 'llm_response',
                },
            });
        }

        // ── Import pipeline nodes ───────────────────────────────────────
        nodes.push({
            key: 'import_classify',
            nodeCodeKey: 'llm_chat',
            name: 'Import — Classify Document',
            group: 'import',
            description: 'LLM multi-entity extraction from an inbox document.',
            configuration: {
                capability: 'reason',
                system_prompt: 'You are a document classifier. Analyze content and extract structured entities. Always respond with valid JSON only.',
                prompt: `Analyze the following document and extract ALL discrete items.
A single document may contain multiple items of different types.

Classify each item into one of these categories:
- note: General information, ideas, thoughts, meeting notes
- task: Tasks, action items, things to do, reminders
- event: Scheduled activities with specific dates/times
- research: Reference material, articles, documentation
- goal: Aspirations, objectives, long-term targets
- person: People, contacts, team members, stakeholders

For each item, return a FLAT JSON object (no nesting) with these fields:
- category: one of the above
- title: A clear, concise title
- content: The cleaned-up content in markdown format
- tags: array of relevant keywords

Plus type-specific fields AT THE TOP LEVEL:
- task: priority (low/medium/high), dueDate (YYYY-MM-DD), status ("open")
- event: startDate (ISO datetime), endDate (ISO datetime), location (string)
- research: status ("active"), sources (array of strings)
- goal: status ("active"), priority (low/medium/high), smart (object with specific/measurable/achievable/relevant/timeBound), milestones (array)
- person: company (string), group (string), phone (string), email (string), handle (string)
- note: no extra fields needed

Respond with a JSON array. Even for a single item, return an array:
[{"category":"task","title":"Buy groceries","content":"Pick up milk and bread","tags":["errands"],"priority":"medium","status":"open"}]

Original filename: {filename}

Content to analyze:
{file_content}`,
                response_context_path: 'llm_response',
            },
        });

        nodes.push({
            key: 'import_clean_json',
            nodeCodeKey: 'clean_llm_json',
            name: 'Import — Clean JSON',
            group: 'import',
            description: 'Strips code fences from the LLM classification response.',
            configuration: {
                source_context_path: 'llm_response',
                target_context_path: 'clean_json',
            },
        });

        nodes.push({
            key: 'import_decode_json',
            nodeCodeKey: 'json_decode',
            name: 'Import — Decode JSON',
            group: 'import',
            description: 'Parses the cleaned JSON into an entities array.',
            configuration: {
                source_context_path: 'clean_json',
                target_context_path: 'entities',
            },
        });

        nodes.push({
            key: 'import_iterate',
            nodeCodeKey: 'array_iterator',
            name: 'Import — Iterate Entities',
            group: 'import',
            description: 'Loops over extracted entities, spreading each into context.',
            configuration: {
                source_context_path: 'entities',
                cursor_context_path: '_import_cursor',
                item_context_path: '_current_entity',
                spread_fields: 'true',
            },
        });

        nodes.push({
            key: 'import_route',
            nodeCodeKey: 'context_value_result',
            name: 'Import — Route by Category',
            group: 'import',
            description: 'Returns the entity category as the result status for edge-based routing.',
            configuration: {
                context_path: 'category',
            },
        });

        return nodes;
    }
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
