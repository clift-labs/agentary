// ─────────────────────────────────────────────────────────────────────────────
// Feral Autonomous Chat
// ─────────────────────────────────────────────────────────────────────────────
//
// When the user types 3+ words that don't match a known command, Dobbie
// "thinks for himself" — a 3-step LLM pipeline that:
//   1. Selects catalog nodes relevant to the user's request
//   2. Generates a Feral process JSON using those nodes
//   3. Runs the process, then synthesizes a natural response
// ─────────────────────────────────────────────────────────────────────────────

import chalk from 'chalk';
import * as readline from 'readline';
import ora from 'ora';
import { bootstrapFeral } from '../feral/bootstrap.js';
import { hydrateProcessFromString } from '../feral/process/process-json-hydrator.js';
import type { ProcessSource } from '../feral/process/process-factory.js';
import type { Process } from '../feral/process/process.js';
import { getModelForCapability, createDobbieSystemPrompt } from '../llm/router.js';
import { debug } from '../utils/debug.js';

// ─────────────────────────────────────────────────────────────────────────────
// IN-MEMORY PROCESS SOURCE
// ─────────────────────────────────────────────────────────────────────────────

class InMemoryProcessSource implements ProcessSource {
    private processes: Process[] = [];

    add(process: Process): void {
        this.processes.push(process);
    }

    getProcesses(): Process[] {
        return this.processes;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE PROCESSES (for the LLM prompt)
// ─────────────────────────────────────────────────────────────────────────────

const EXAMPLE_PROCESSES = [
    {
        description: 'Simple linear process: list tasks then sort them',
        json: {
            schema_version: 1,
            key: 'tasks.list',
            description: 'List all tasks, sorted by priority and due date',
            context: {},
            nodes: [
                { key: 'start', catalog_node_key: 'start', configuration: {}, edges: { ok: 'list' } },
                { key: 'list', catalog_node_key: 'list_tasks', configuration: {}, edges: { ok: 'sort' } },
                { key: 'sort', catalog_node_key: 'sort_tasks', configuration: {}, edges: { ok: 'done' } },
                { key: 'done', catalog_node_key: 'stop', configuration: {}, edges: {} },
            ],
        },
    },
    {
        description: 'System info: gather multiple system values in sequence',
        json: {
            schema_version: 1,
            key: 'system.info',
            description: 'Gather local system information',
            context: {},
            nodes: [
                { key: 'start', catalog_node_key: 'start', configuration: {}, edges: { ok: 'hostname' } },
                { key: 'hostname', catalog_node_key: 'get_hostname', configuration: {}, edges: { ok: 'uptime', error: 'uptime' } },
                { key: 'uptime', catalog_node_key: 'get_uptime', configuration: {}, edges: { ok: 'done', error: 'done' } },
                { key: 'done', catalog_node_key: 'stop', configuration: {}, edges: {} },
            ],
        },
    },
    {
        description: 'LLM-powered: read a file, send it to an LLM for classification, store the result',
        json: {
            schema_version: 1,
            key: 'classify.file',
            description: 'Read a file and classify its contents with AI',
            context: {},
            nodes: [
                { key: 'start', catalog_node_key: 'start', configuration: {}, edges: { ok: 'read' } },
                { key: 'read', catalog_node_key: 'read_file', configuration: { file_path: '{file_path}', context_path: 'file_content' }, edges: { ok: 'classify', error: 'done' } },
                { key: 'classify', catalog_node_key: 'llm_chat', configuration: { capability: 'categorize', prompt: 'Classify this content: {file_content}', response_context_path: 'classification' }, edges: { ok: 'done', error: 'done' } },
                { key: 'done', catalog_node_key: 'stop', configuration: {}, edges: {} },
            ],
        },
    },
    {
        description: 'Create multiple entities: a goal and a todont from user input',
        json: {
            schema_version: 1,
            key: 'multi.create',
            description: 'Create a goal and a todont based on user input',
            context: {},
            nodes: [
                { key: 'start', catalog_node_key: 'start', configuration: {}, edges: { ok: 'create_goal' } },
                { key: 'create_goal', catalog_node_key: 'create_goal', configuration: { entity_title: 'Run 10 miles', entity_body: 'Train progressively to run 10 miles by mid-March' }, edges: { ok: 'create_todont', already_exists: 'create_todont', error: 'create_todont' } },
                { key: 'create_todont', catalog_node_key: 'create_todont', configuration: { entity_title: 'No pizza or beer', entity_body: 'Avoid pizza and beer while training for the 10-mile run' }, edges: { ok: 'done', already_exists: 'done', error: 'done' } },
                { key: 'done', catalog_node_key: 'stop', configuration: {}, edges: {} },
            ],
        },
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// CORE: feralChat
// ─────────────────────────────────────────────────────────────────────────────

export async function feralChat(userInput: string): Promise<void> {
    const spinner = ora({ text: chalk.dim('Dobbie is thinking…'), color: 'cyan' }).start();

    try {
        // ── Bootstrap Feral ──────────────────────────────────────────────
        const inMemorySource = new InMemoryProcessSource();
        const runtime = await bootstrapFeral([inMemorySource]);
        const allNodes = runtime.catalog.getAllCatalogNodes();

        // Build catalog summary for LLM
        const catalogSummary = allNodes
            .filter(n => !n.key.startsWith('speak_'))  // skip output variants
            .map(n => `- ${n.key}: ${n.description || n.name} [group: ${n.group}]`)
            .join('\n');

        debug('chat', `Catalog has ${allNodes.length} nodes, sending ${catalogSummary.split('\n').length} to LLM`);

        // ── STEP 1: Select catalog nodes ─────────────────────────────────
        spinner.text = chalk.dim('Selecting capabilities…');

        const llm = await getModelForCapability('reason');

        const step1Response = await llm.chat(
            [{
                role: 'user' as const,
                content: `The user said: "${userInput}"

DOBBIE'S ENTITY TYPES:
Dobbie manages these entity types. When the user mentions something that maps to an entity, prefer creating it:
- task (plural: tasks) — A to-do item with status, priority, and optional due date
- note (plural: notes) — A freeform note or piece of information
- event (plural: events) — A calendar event with date/time
- goal (plural: goals) — A SMART goal with measurable criteria and target date
- research (plural: research) — A research topic to investigate
- person (plural: people) — A contact with name, company, email, phone
- todont (plural: todonts) — Something to AVOID doing (always active, or within a date window)
- recurrence (plural: recurrences) — A recurring template that generates todos/events

Each entity type has create_*, list_*, find_*, update_*, delete_* catalog nodes.
For example: create_goal, create_todont, list_tasks, find_note, etc.

When the user's request implies creating entities, ALWAYS select the appropriate create_* nodes.
When the user mentions avoiding something → create a todont.
When the user mentions a goal or objective → create a goal.
When the user mentions multiple entities, select multiple create_* nodes.

Here are all available catalog nodes in the Feral process engine. Each node performs a specific action:

${catalogSummary}

IMPORTANT RULES:
- Every process MUST start with "start" and end with "stop"
- Always include "start" and "stop" in your selection
- The "llm_chat" node sends a prompt to an LLM. It supports {context_key} interpolation in prompts
- Only select nodes that are directly useful for fulfilling the user's request
- Prefer entity nodes (list_*, find_*, create_*) for data operations
- Prefer system nodes (get_time, get_date, etc.) for system information
- When the user wants to CREATE something, use the create_* nodes — don't just use llm_chat to give advice

Return a JSON object with this exact structure:
{
    "reasoning": "Why these nodes were selected",
    "nodes": ["start", "stop", "node_key_1", "node_key_2"]
}

Return ONLY the JSON object, no markdown fences.`,
            }],
            {
                systemPrompt: 'You are a process designer for the Feral CCF system. Select the minimal set of catalog nodes needed to fulfill the user\'s request. Always include "start" and "stop". Be precise and concise.',
                temperature: 0.3,
            },
        );

        debug('chat', `Step 1 response: ${step1Response}`);

        let nodeSelection: { reasoning: string; nodes: string[] };
        try {
            nodeSelection = JSON.parse(cleanJson(step1Response));
        } catch {
            throw new Error('Failed to parse node selection from LLM');
        }

        // Ensure start/stop are included
        if (!nodeSelection.nodes.includes('start')) nodeSelection.nodes.unshift('start');
        if (!nodeSelection.nodes.includes('stop')) nodeSelection.nodes.push('stop');

        // Gather selected node details + their config descriptions
        const selectedNodes = nodeSelection.nodes
            .map(key => {
                try {
                    return runtime.catalog.getCatalogNode(key);
                } catch {
                    return null;
                }
            })
            .filter(Boolean);

        const selectedNodeDetails = selectedNodes
            .map(n => {
                const config = Object.keys(n!.configuration).length > 0
                    ? `  config: ${JSON.stringify(n!.configuration)}`
                    : '';
                return `- ${n!.key} (${n!.group}): ${n!.description || n!.name}${config}`;
            })
            .join('\n');

        // Get config descriptions for the selected node codes
        const nodeCodeDetails: string[] = [];
        for (const n of selectedNodes) {
            if (!n) continue;
            try {
                const nodeCode = runtime.nodeCodeFactory.getNodeCode(n.nodeCodeKey);
                const Ctor = nodeCode.constructor as { configDescriptions?: Array<{ key: string; name: string; description: string; type: string; default?: unknown; isOptional?: boolean }> };
                const Ctor2 = nodeCode.constructor as { resultDescriptions?: Array<{ status: string; description: string }> };
                const configs = Ctor.configDescriptions ?? [];
                const results = Ctor2.resultDescriptions ?? [];
                if (configs.length > 0 || results.length > 0) {
                    const configStr = configs.map(c =>
                        `    - ${c.key} (${c.type}${c.isOptional ? ', optional' : ''}${c.default != null ? `, default: ${JSON.stringify(c.default)}` : ''}): ${c.description}`
                    ).join('\n');
                    const resultStr = results.map(r => `    → "${r.status}": ${r.description}`).join('\n');
                    nodeCodeDetails.push(`${n.key} (nodeCode: ${n.nodeCodeKey}):\n  Configuration:\n${configStr}\n  Results (edge keys):\n${resultStr}`);
                }
            } catch {
                // Skip if node code not found
            }
        }

        // ── STEP 1.5: Information gathering loop ───────────────────────
        spinner.text = chalk.dim('Checking if more info is needed…');

        const gatheredInfo: Record<string, string> = {};
        const MAX_QUESTIONS = 5;

        for (let i = 0; i < MAX_QUESTIONS; i++) {
            const selectedNodeNames = nodeSelection.nodes.join(', ');
            const previousAnswers = Object.entries(gatheredInfo).length > 0
                ? `\n\nPreviously gathered information:\n${Object.entries(gatheredInfo).map(([k, v]) => `- ${k}: ${v}`).join('\n')}`
                : '';

            const sufficiencyResponse = await llm.chat(
                [{
                    role: 'user' as const,
                    content: `The user said: "${userInput}"

Selected catalog nodes: ${selectedNodeNames}
${previousAnswers}

Do you have ALL the specific information needed to create a Feral process that fulfills this request?
For entity creation, you need at minimum: a title and optionally a body/description.
Consider what the user explicitly provided in their message — don't ask for info they already gave.

Return a JSON object with EXACTLY this structure:
If MORE info needed: { "status": "need_more", "question": "The question to ask the user", "field_name": "a_short_key_for_this_field" }
If SUFFICIENT: { "status": "sufficient" }

Return ONLY the JSON object, no markdown fences.`,
                }],
                {
                    systemPrompt: 'You are an information-gathering assistant. Determine if the user\'s request provides enough detail to proceed. Be practical — if the user gave enough info (e.g., "run 10 miles by March"), that IS a title. Only ask for genuinely missing critical info. Prefer to proceed rather than over-asking.',
                    temperature: 0.2,
                },
            );

            debug('chat', `Sufficiency check ${i + 1}: ${sufficiencyResponse}`);

            let sufficiency: { status: string; question?: string; field_name?: string };
            try {
                sufficiency = JSON.parse(cleanJson(sufficiencyResponse));
            } catch {
                // If we can't parse, assume sufficient and proceed
                debug('chat', 'Could not parse sufficiency response, assuming sufficient');
                break;
            }

            if (sufficiency.status === 'sufficient') {
                debug('chat', 'LLM says we have enough info, proceeding');
                break;
            }

            // Ask the user the follow-up question
            spinner.stop();
            const answer = await askFollowUp(chalk.cyan(`  🧝 ${sufficiency.question} `));
            spinner.start(chalk.dim('Checking if more info is needed…'));

            const trimmed = (answer as string).trim();
            if (trimmed) {
                const fieldName = sufficiency.field_name || `field_${i + 1}`;
                gatheredInfo[fieldName] = trimmed;
            }
        }

        const gatheredInfoStr = Object.entries(gatheredInfo).length > 0
            ? `\n\nADDITIONAL INFO GATHERED FROM USER:\n${Object.entries(gatheredInfo).map(([k, v]) => `- ${k}: ${v}`).join('\n')}`
            : '';

        // ── ORCHESTRATION LOOP ────────────────────────────────────────────
        // Iteratively: generate process → run → check completion → repeat
        const MAX_ITERATIONS = 3;
        const allResults: Record<string, unknown>[] = [];
        const allReasonings: string[] = [];
        let remainingWork = userInput;

        const examplesStr = EXAMPLE_PROCESSES.map((ex, i) =>
            `Example ${i + 1}: ${ex.description}\n${JSON.stringify(ex.json, null, 2)}`
        ).join('\n\n');

        for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
            // ── STEP 2: Generate process ─────────────────────────────────
            spinner.text = chalk.dim(`Designing process${iteration > 0 ? ` (step ${iteration + 1})` : ''}…`);

            const previousResultsStr = allResults.length > 0
                ? `\n\nRESULTS FROM PREVIOUS STEPS:\n${JSON.stringify(allResults, null, 2)}`
                : '';

            const step2Response = await llm.chat(
                [{
                    role: 'user' as const,
                    content: `Build a Feral process to handle: "${remainingWork}"
${gatheredInfoStr}${previousResultsStr}

SELECTED CATALOG NODES (you must only use nodes from this list):
${selectedNodeDetails}

NODE CONFIGURATION DETAILS:
${nodeCodeDetails.join('\n\n')}

PROCESS FORMAT RULES:
1. schema_version MUST be 1
2. key should be "chat.generated"
3. First node MUST have key "start" with catalog_node_key "start"
4. Last node MUST have key "done" with catalog_node_key "stop" and empty edges {}
5. "edges" maps result status strings to the next node key
6. Most nodes produce "ok" and "error" results
7. Use {context_key} syntax in configuration values to interpolate context values
8. The context starts with: user_input = "${userInput}"
9. Keep the process as simple as possible — prefer fewer nodes
10. For entity creation, ALWAYS set entity_title and entity_body in the configuration with concrete values

EXAMPLE PROCESSES:
${examplesStr}

Return a JSON object with this exact structure:
{
    "reasoning": "Why this process structure was chosen",
    "process": { ... the process JSON ... }
}

Return ONLY the JSON object, no markdown fences.`,
                }],
                {
                    systemPrompt: 'You are a process designer for the Feral CCF engine. Generate a valid process JSON that solves the user\'s request using the provided catalog nodes. The process will be executed immediately by the Feral engine. Be precise with catalog_node_key values — they must match exactly.',
                    temperature: 0.3,
                },
            );

            debug('chat', `Step 2 response (iteration ${iteration + 1}): ${step2Response}`);

            let processDesign: { reasoning: string; process: Record<string, unknown> };
            try {
                processDesign = JSON.parse(cleanJson(step2Response));
            } catch {
                throw new Error('Failed to parse process design from LLM');
            }

            allReasonings.push(processDesign.reasoning);

            // ── STEP 3: Execute the generated process ────────────────────
            spinner.text = chalk.dim(`Running process${iteration > 0 ? ` (step ${iteration + 1})` : ''}…`);

            let processJsonStr: string;
            try {
                processJsonStr = JSON.stringify(processDesign.process);
            } catch {
                throw new Error('Generated process is not valid JSON');
            }

            const process = hydrateProcessFromString(processJsonStr);
            inMemorySource.add(process);

            let contextResult: Record<string, unknown>;
            try {
                const ctx = await runtime.runner.run(process.key, { user_input: userInput });
                contextResult = ctx.getAll();
            } catch (error) {
                debug('chat', `Process execution failed: ${error}`);
                contextResult = { _error: error instanceof Error ? error.message : String(error) };
            }

            // Filter internal keys
            const iterationResult = Object.entries(contextResult)
                .filter(([k]) => !k.startsWith('_') && k !== 'user_input')
                .reduce((acc, [k, v]) => {
                    acc[k] = typeof v === 'string' && v.length > 2000 ? v.slice(0, 2000) + '…' : v;
                    return acc;
                }, {} as Record<string, unknown>);

            allResults.push(iterationResult);

            // ── STEP 4: Check completion ──────────────────────────────────
            if (iteration < MAX_ITERATIONS - 1) {
                spinner.text = chalk.dim('Checking if task is complete…');

                const completionResponse = await llm.chat(
                    [{
                        role: 'user' as const,
                        content: `The user originally said: "${userInput}"

We have completed ${iteration + 1} step(s) so far.

Step reasoning: ${allReasonings.join(' → ')}

Results from all steps:
${JSON.stringify(allResults, null, 2)}

Is the user's ENTIRE request fulfilled? Consider:
- Did we create ALL entities the user mentioned?
- Did we perform ALL actions the user asked for?
- Are there remaining items that still need to be done?

Return a JSON object with EXACTLY this structure:
If COMPLETE: { "status": "complete" }
If MORE WORK NEEDED: { "status": "more_work", "remaining": "Description of what still needs to be done" }

Return ONLY the JSON object, no markdown fences.`,
                    }],
                    {
                        systemPrompt: 'You are a task completion checker. Be thorough — if the user asked for multiple things (e.g., create a goal AND avoid pizza), make sure ALL parts have been addressed.',
                        temperature: 0.2,
                    },
                );

                debug('chat', `Completion check (iteration ${iteration + 1}): ${completionResponse}`);

                let completion: { status: string; remaining?: string };
                try {
                    completion = JSON.parse(cleanJson(completionResponse));
                } catch {
                    debug('chat', 'Could not parse completion response, assuming complete');
                    break;
                }

                if (completion.status === 'complete') {
                    debug('chat', 'Task complete, exiting orchestration loop');
                    break;
                }

                // Update the remaining work for the next iteration
                remainingWork = completion.remaining || userInput;
                debug('chat', `More work needed: ${remainingWork}`);
            }
        }

        // ── STEP 5: Synthesize response ──────────────────────────────────
        spinner.text = chalk.dim('Composing response…');

        const synthesisPrompt = `You are Dobbie, a helpful personal assistant. The user said: "${userInput}"

To answer, I selected these capabilities:
${nodeSelection.reasoning}

I ran ${allResults.length} process step(s):
${allReasonings.map((r, i) => `Step ${i + 1}: ${r}`).join('\n')}

The process used these catalog nodes:
${selectedNodes.filter(Boolean).map(n => `- ${n!.key}: ${n!.description || n!.name}`).join('\n')}

Here are the results from all process steps:
${JSON.stringify(allResults, null, 2)}

${allResults.some(r => r._error) ? `Note: Some steps encountered errors.` : ''}

Now compose a helpful, natural response to the user. Be concise and friendly. If processes produced data, present it clearly. If there were errors, acknowledge them gracefully and suggest what the user could try instead.`;

        const step5Response = await llm.chat(
            [{ role: 'user' as const, content: synthesisPrompt }],
            {
                systemPrompt: createDobbieSystemPrompt('You are responding to a natural language request from your user. Be helpful, concise, and warm.'),
                temperature: 0.7,
            },
        );

        spinner.stop();

        console.log(chalk.cyan(`\n  ${step5Response.trim().split('\n').join('\n  ')}\n`));

    } catch (error) {
        spinner.stop();
        const msg = error instanceof Error ? error.message : String(error);
        debug('chat', `Autonomous chat failed: ${msg}`);
        console.log(chalk.yellow(`\n  Hmm, Dobbie tried to think about that but got confused: ${msg}`));
        console.log(chalk.dim('  Try rephrasing, or use a specific command like "todo", "note", "today".\n'));
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Strip markdown fences, fix common LLM JSON mistakes, and trim whitespace.
 */
function cleanJson(raw: string): string {
    let s = raw.trim();
    // Remove ```json ... ``` or ``` ... ```
    s = s.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
    // Fix trailing commas before } or ] (very common LLM error)
    s = s.replace(/,\s*([\}\]])/g, '$1');
    // Fix missing closing quotes: "key": "value\n  →  "key": "value"\n
    s = s.replace(/":\s*"([^"]*?)(\n)/g, '": "$1"$2');
    return s.trim();
}

/**
 * Ask a follow-up question using a temporary readline.
 * Disables raw mode and removes existing stdin listeners to prevent
 * the shell's paused readline from double-echoing characters.
 */
function askFollowUp(question: string): Promise<string> {
    // Save and remove existing stdin listeners to prevent the shell's
    // paused readline from processing the same keystrokes.
    const savedListeners = process.stdin.rawListeners('data').slice();
    process.stdin.removeAllListeners('data');

    // Disable raw mode so the temporary readline gets clean cooked input.
    const wasRaw = process.stdin.isRaw ?? false;
    if (process.stdin.isTTY && wasRaw) process.stdin.setRawMode(false);

    const tempRl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => {
        tempRl.question(question, (answer: string) => {
            tempRl.close();

            // Restore raw mode and stdin listeners for the shell readline
            if (process.stdin.isTTY && wasRaw) process.stdin.setRawMode(true);
            for (const listener of savedListeners) {
                process.stdin.on('data', listener as (...args: unknown[]) => void);
            }

            resolve(answer);
        });
    });
}
