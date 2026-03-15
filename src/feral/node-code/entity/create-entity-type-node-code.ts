// ─────────────────────────────────────────────────────────────────────────────
// Feral CCF — Create Entity Type NodeCode
// ─────────────────────────────────────────────────────────────────────────────
//
// Given a type name and plain-English description, asks the LLM to design the
// field schema, then registers the new entity type in ~/.agentary/entity-types.json.
//
// Config:
//   type_name    — singular slug, e.g. "person" or "album"
//   description  — what this entity represents, e.g. "A music album to remember"
//
// Context output:
//   entity_type  — the full EntityTypeConfig that was created
// ─────────────────────────────────────────────────────────────────────────────

import type { Context } from '../../context/context.js';
import type { Result } from '../../result/result.js';
import { ResultStatus } from '../../result/result.js';
import type { ConfigurationDescription, ResultDescription } from '../../configuration/configuration-description.js';
import { AbstractNodeCode } from '../abstract-node-code.js';
import { NodeCodeCategory } from '../node-code.js';
import { addEntityType, type EntityTypeConfig, type FieldDef } from '../../../entities/entity-type-config.js';
import { getModelForCapability } from '../../../llm/router.js';

const ALREADY_EXISTS = 'already_exists';

const SYSTEM_PROMPT = `You are a data modelling assistant for a personal knowledge-management CLI called Agentary.
Given a type name and description, produce a JSON object defining the fields for that entity type.

Rules:
- Return ONLY a valid JSON object — no markdown, no commentary, no code fences.
- The object must have these top-level keys:
    plural        : string  (plural form of the type name)
    description   : string  (short description ≤ 80 chars)
    fields        : array of field objects (see below)
    completionField : string | null   (which field tracks done/complete state, or null)
    completionValue : string | null   (the value that means done, or null)
- Each field object must have:
    key      : string  (camelCase identifier, no spaces)
    label    : string  (human-readable label)
    type     : one of: string | number | boolean | date | datetime | enum
    required : boolean
- Enum fields must also include:
    values   : string[]  (allowed values)
    default  : string    (the default value, must be in values)
- Keep it practical: 2–6 fields is usually right. Do not over-engineer.
- Only add a completionField/completionValue if the entity genuinely has a done/archived/complete state.`;

export class CreateEntityTypeNodeCode extends AbstractNodeCode {
    static readonly configDescriptions: ConfigurationDescription[] = [
        {
            key: 'type_name',
            name: 'Type Name',
            description: 'Singular slug for the new entity type (e.g. "album", "person"). Supports {context_key} interpolation.',
            type: 'string',
        },
        {
            key: 'description',
            name: 'Description',
            description: 'Plain-English description of what this entity represents. Supports {context_key} interpolation.',
            type: 'string',
        },
    ];

    static readonly resultDescriptions: ResultDescription[] = [
        { status: ResultStatus.OK, description: 'Entity type created successfully.' },
        { status: ALREADY_EXISTS, description: 'An entity type with this name already exists.' },
        { status: ResultStatus.ERROR, description: 'Failed to create entity type.' },
    ];

    constructor() {
        super(
            'create_entity_type',
            'Create Entity Type',
            'Uses the LLM to design a field schema, then registers a new entity type.',
            NodeCodeCategory.DATA,
        );
    }

    async process(context: Context): Promise<Result> {
        const rawName = this.getRequiredConfigValue('type_name') as string;
        const rawDesc = this.getRequiredConfigValue('description') as string;

        const typeName = this.interpolate(rawName, context).trim().toLowerCase().replace(/\s+/g, '-');
        const description = this.interpolate(rawDesc, context).trim();

        if (!typeName) {
            context.set('error', 'type_name is required.');
            return this.result(ResultStatus.ERROR, 'type_name is required.');
        }

        // ── Ask LLM to design the schema ────────────────────────────────────
        const userPrompt = `Design the field schema for a "${typeName}" entity type.\n\nDescription: ${description}`;

        let schemaJson: string;
        try {
            const llm = await getModelForCapability('reason');
            schemaJson = await llm.chat(
                [{ role: 'user' as const, content: userPrompt }],
                { systemPrompt: SYSTEM_PROMPT, temperature: 0.2, maxTokens: 1024 },
            );
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            context.set('error', `LLM call failed: ${msg}`);
            return this.result(ResultStatus.ERROR, `LLM call failed: ${msg}`);
        }

        // ── Parse and validate ───────────────────────────────────────────────
        let schema: {
            plural?: string;
            description?: string;
            fields?: FieldDef[];
            completionField?: string | null;
            completionValue?: string | null;
        };
        try {
            // Strip any accidental code fences
            const cleaned = schemaJson.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
            schema = JSON.parse(cleaned);
        } catch {
            context.set('error', 'LLM returned invalid JSON.');
            return this.result(ResultStatus.ERROR, `LLM returned invalid JSON: ${schemaJson.slice(0, 200)}`);
        }

        if (!Array.isArray(schema.fields)) {
            context.set('error', 'LLM schema missing "fields" array.');
            return this.result(ResultStatus.ERROR, 'LLM schema missing "fields" array.');
        }

        const plural = (schema.plural ?? typeName + 's').trim();
        const config: EntityTypeConfig = {
            name: typeName,
            plural,
            directory: plural,
            description: schema.description ?? description,
            defaultTags: [typeName],
            fields: schema.fields,
        };

        if (schema.completionField) {
            config.completionField = schema.completionField;
            config.completionValue = schema.completionValue ?? undefined;
        }

        // ── Register ─────────────────────────────────────────────────────────
        try {
            await addEntityType(config);
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes('already exists')) {
                context.set('error', msg);
                return this.result(ALREADY_EXISTS, msg);
            }
            context.set('error', msg);
            return this.result(ResultStatus.ERROR, msg);
        }

        context.set('entity_type', config);
        return this.result(ResultStatus.OK, `Created entity type "${typeName}" with ${config.fields.length} field(s).`);
    }
}
