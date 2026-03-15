/**
 * Agentary "10 Questions" — a personal-assistant onboarding interview.
 *
 * Covers personality selection, agent naming, identity, work, relationships,
 * health, growth, and how the user wants their agent to help.
 * Answers are stored as a concise AI-context block in the vault root .vault.md
 * so every LLM call has the full picture.
 *
 * Run automatically on first launch, or manually via `agentary interview`.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { saveProfile, getVaultRoot } from '../state/manager.js';
import { loadCalConfig, saveCalConfig } from './cal.js';
import { PERSONALITIES, getPersonality, type Personality } from '../personalities.js';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function pause(ms = 400): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
}

async function printLines(lines: string[]): Promise<void> {
    for (const line of lines) {
        console.log(line);
        await pause(300);
    }
}

function sectionHeader(n: number, label: string): string {
    return chalk.cyan(`🤖 [${n}/10] ${label}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// THE 10 QUESTIONS
// ─────────────────────────────────────────────────────────────────────────────

interface TenQAnswers {
    personality: 'butler' | 'rockstar' | 'executive' | 'friend';
    agentName: string;
    name: string;
    gender: 'male' | 'female' | 'other';
    location: string;
    work: string;
    workGoals: string;
    relationships: string;
    health: string;
    growth: string;
    struggles: string;
    helpStyle: string;
    // bonus: calendar URLs (not one of the 10, asked after)
    personalCalUrl?: string;
    workCalUrl?: string;
}

export async function runInterview(): Promise<void> {
    // ── Q0: Personality selection ────────────────────────────────────────
    console.log(chalk.cyan('\n🤖 Welcome to Agentary!\n'));
    console.log(chalk.gray('   First, choose the personality for your agent:\n'));

    const { personalityId } = await inquirer.prompt([{
        type: 'list',
        name: 'personalityId',
        message: chalk.cyan('Choose your agent\'s personality:'),
        choices: Object.values(PERSONALITIES).map(p => ({
            name: `${p.label} — ${p.description}`,
            value: p.id,
        })),
        default: 'butler',
    }]);

    const personality = getPersonality(personalityId);
    console.log(chalk.green(`\n   ✓ ${personality.label} selected!\n`));
    await pause();

    // ── Q0b: Agent name ─────────────────────────────────────────────────
    const { agentName } = await inquirer.prompt([{
        type: 'input',
        name: 'agentName',
        message: chalk.cyan('🤖 What would you like to name your agent?'),
        default: 'Agent',
        validate: (v: string) => v.trim().length > 0 || 'Please enter at least one character.',
    }]);

    console.log(chalk.green(`\n   ✓ Your agent is now named "${agentName.trim()}"!\n`));
    await pause();

    // ── Print personality-driven intro ───────────────────────────────────
    const introLines = personality.introLines.map(l =>
        `   ${chalk.cyan(l.replace(/{agent}/g, agentName.trim()))}`
    );
    await printLines(introLines);

    // ── Q1: Name ─────────────────────────────────────────────────────────
    const { name } = await inquirer.prompt([{
        type: 'input',
        name: 'name',
        message: sectionHeader(1, 'What\'s your name?'),
        validate: (v: string) => v.trim().length > 0 || 'Need at least one letter!',
    }]);
    console.log(pick(personality.reactions.name)(name.trim()));
    await pause();

    // ── Q2: Gender ───────────────────────────────────────────────────────
    // Build preview honorifics from the selected personality
    const malePreview = personality.honorifics.male.slice(0, 3).join(' / ') || '(uses name)';
    const femalePreview = personality.honorifics.female.slice(0, 3).join(' / ') || '(uses name)';
    const otherPreview = personality.honorifics.other.slice(0, 3).join(' / ') || '(uses name)';

    const { gender } = await inquirer.prompt([{
        type: 'list',
        name: 'gender',
        message: sectionHeader(2, 'How should your agent address you?'),
        choices: [
            { name: `${malePreview}  (male)`, value: 'male' },
            { name: `${femalePreview}  (female)`, value: 'female' },
            { name: `${otherPreview}  (neutral)`, value: 'other' },
        ],
    }]);
    console.log(pick(personality.reactions.generic)(''));
    await pause();

    // ── Q3: Location ─────────────────────────────────────────────────────
    const { location } = await inquirer.prompt([{
        type: 'input',
        name: 'location',
        message: sectionHeader(3, 'Where are you based? (city / region)'),
        default: '',
    }]);
    if (location.trim()) {
        console.log(pick(personality.reactions.generic)(''));
        await pause();
    }

    // ── Q4: Work ─────────────────────────────────────────────────────────
    const { work } = await inquirer.prompt([{
        type: 'input',
        name: 'work',
        message: sectionHeader(4, 'What do you do for work? (role, industry, or "student", "retired", etc.)'),
        default: '',
    }]);
    if (work.trim()) {
        console.log(pick(personality.reactions.generic)(''));
        await pause();
    }

    // ── Q5: Work / career goals ──────────────────────────────────────────
    const { workGoals } = await inquirer.prompt([{
        type: 'input',
        name: 'workGoals',
        message: sectionHeader(5, 'What are you working towards right now? (career goals, projects, ambitions)'),
        default: '',
    }]);
    if (workGoals.trim()) {
        console.log(pick(personality.reactions.generic)(''));
        await pause();
    }

    // ── Q6: Relationships & family ───────────────────────────────────────
    const { relationships } = await inquirer.prompt([{
        type: 'input',
        name: 'relationships',
        message: sectionHeader(6, 'Tell me about your people — partner, kids, family, close friends?'),
        default: '',
    }]);
    if (relationships.trim()) {
        console.log(pick(personality.reactions.deep)(''));
        await pause();
    }

    // ── Q7: Health & fitness ─────────────────────────────────────────────
    const { health } = await inquirer.prompt([{
        type: 'input',
        name: 'health',
        message: sectionHeader(7, 'How about health & fitness? Any exercise routine, diet goals, or health things to track?'),
        default: '',
    }]);
    if (health.trim()) {
        console.log(pick(personality.reactions.generic)(''));
        await pause();
    }

    // ── Q8: Personal growth ──────────────────────────────────────────────
    const { growth } = await inquirer.prompt([{
        type: 'input',
        name: 'growth',
        message: sectionHeader(8, 'What are you learning or want to grow in? (skills, hobbies, habits, reading)'),
        default: '',
    }]);
    if (growth.trim()) {
        console.log(pick(personality.reactions.generic)(''));
        await pause();
    }

    // ── Q9: Struggles ────────────────────────────────────────────────────
    const { struggles } = await inquirer.prompt([{
        type: 'input',
        name: 'struggles',
        message: sectionHeader(9, 'What do you struggle with? (procrastination, focus, balance, stress — anything to watch for)'),
        default: '',
    }]);
    if (struggles.trim()) {
        console.log(pick(personality.reactions.deep)(''));
        await pause();
    }

    // ── Q10: How to help ─────────────────────────────────────────────────
    const { helpStyle } = await inquirer.prompt([{
        type: 'input',
        name: 'helpStyle',
        message: sectionHeader(10, 'How do you want your agent to help? (gentle nudges, strict accountability, just organise, be proactive, etc.)'),
        default: '',
    }]);
    if (helpStyle.trim()) {
        console.log(pick(personality.reactions.generic)(''));
        await pause();
    }

    // ── Bonus: Calendar URLs (not counted in the 10) ─────────────────────
    console.log(chalk.gray('\n   Almost done! Two optional bonus questions about calendars...\n'));

    const { personalCalUrl } = await inquirer.prompt([{
        type: 'input',
        name: 'personalCalUrl',
        message: chalk.cyan('🤖 Got a personal Google Calendar ICS link? (Enter to skip)'),
        default: '',
    }]);

    const { workCalUrl } = await inquirer.prompt([{
        type: 'input',
        name: 'workCalUrl',
        message: chalk.cyan('🤖 Work Google Calendar ICS link? (Enter to skip)'),
        default: '',
    }]);

    // ── Save ──────────────────────────────────────────────────────────────

    const answers: TenQAnswers = {
        personality: personalityId,
        agentName: agentName.trim(),
        name: name.trim(),
        gender,
        location: location.trim(),
        work: work.trim(),
        workGoals: workGoals.trim(),
        relationships: relationships.trim(),
        health: health.trim(),
        growth: growth.trim(),
        struggles: struggles.trim(),
        helpStyle: helpStyle.trim(),
        personalCalUrl: personalCalUrl.trim() || undefined,
        workCalUrl: workCalUrl.trim() || undefined,
    };

    // 1. Save basic profile to .state.json (for honorifics, name lookup)
    await saveProfile({
        userName: answers.name,
        agentName: answers.agentName,
        personality: answers.personality,
        gender: answers.gender,
        workType: answers.work || undefined,
        familySituation: answers.relationships || undefined,
        cityLive: answers.location || undefined,
        personalCalUrl: answers.personalCalUrl,
        workCalUrl: answers.workCalUrl,
    });

    // 2. Write the full context to vault .vault.md
    await writeAnswersToVaultFile(answers);

    // 3. Auto-configure calendars
    if (answers.personalCalUrl || answers.workCalUrl) {
        const cfg = await loadCalConfig();
        if (answers.personalCalUrl && !cfg.calendars.some(c => c.id === 'personal')) {
            cfg.calendars.push({ id: 'personal', name: 'Personal', url: answers.personalCalUrl });
        }
        if (answers.workCalUrl && !cfg.calendars.some(c => c.id === 'work')) {
            cfg.calendars.push({ id: 'work', name: 'Work', url: answers.workCalUrl });
        }
        await saveCalConfig(cfg);
    }

    // Print personality-driven outro
    const outroLines = personality.outroLines.map(l =>
        `   ${chalk.cyan(l.replace(/{agent}/g, answers.agentName))}`
    );
    outroLines.push(`   ${chalk.gray(`(You can re-do this anytime with: agentary interview)`)}\n`);
    await printLines(outroLines);
}

// ─────────────────────────────────────────────────────────────────────────────
// VAULT FILE WRITER
// ─────────────────────────────────────────────────────────────────────────────

const ABOUT_HEADING = '## About You';
const ABOUT_MARKER_START = '<!-- 10Q:START -->';
const ABOUT_MARKER_END = '<!-- 10Q:END -->';

/**
 * Build a concise, AI-context-friendly block from the 10 Questions answers.
 * Uses terse key: value format — optimised for token efficiency.
 */
function buildAboutBlock(a: TenQAnswers): string {
    const lines: string[] = [
        ABOUT_MARKER_START,
        ABOUT_HEADING,
        '',
    ];

    lines.push(`- name: ${a.name}`);
    lines.push(`- gender: ${a.gender}`);

    if (a.location) lines.push(`- location: ${a.location}`);
    if (a.work) lines.push(`- work: ${a.work}`);
    if (a.workGoals) lines.push(`- goals: ${a.workGoals}`);
    if (a.relationships) lines.push(`- relationships: ${a.relationships}`);
    if (a.health) lines.push(`- health: ${a.health}`);
    if (a.growth) lines.push(`- growth: ${a.growth}`);
    if (a.struggles) lines.push(`- struggles: ${a.struggles}`);
    if (a.helpStyle) lines.push(`- help_style: ${a.helpStyle}`);

    lines.push(ABOUT_MARKER_END);
    return lines.join('\n');
}

/**
 * Insert or replace the "About You" block in the vault root .vault.md.
 * If the file has existing 10Q markers, replaces that section.
 * Otherwise appends after the frontmatter/personality section.
 */
async function writeAnswersToVaultFile(answers: TenQAnswers): Promise<void> {
    let vaultRoot: string;
    try {
        vaultRoot = await getVaultRoot();
    } catch {
        // No vault yet — nothing to write to
        return;
    }

    // Try .vault.md first, then legacy .socks.md
    let vaultFilePath = path.join(vaultRoot, '.vault.md');
    try {
        await fs.access(vaultFilePath);
    } catch {
        const legacyPath = path.join(vaultRoot, '.socks.md');
        try {
            await fs.access(legacyPath);
            vaultFilePath = legacyPath;
        } catch {
            // Neither exists — use .vault.md
        }
    }

    const aboutBlock = buildAboutBlock(answers);

    let fileContent: string;
    try {
        fileContent = await fs.readFile(vaultFilePath, 'utf-8');
    } catch {
        // No vault file yet — create a minimal one
        const today = new Date().toISOString().split('T')[0];
        const vaultName = path.basename(vaultRoot);
        fileContent = matter.stringify(
            `\n# ${vaultName}\n\n${aboutBlock}\n`,
            { title: `${vaultName} Vault`, created: today, tags: ['context', 'system', 'root'] },
        );
        await fs.writeFile(vaultFilePath, fileContent);
        return;
    }

    // Parse with gray-matter to preserve frontmatter
    const parsed = matter(fileContent);

    let body = parsed.content;

    // Replace existing 10Q block if present
    const markerRegex = new RegExp(
        `${escapeRegex(ABOUT_MARKER_START)}[\\s\\S]*?${escapeRegex(ABOUT_MARKER_END)}`,
    );

    if (markerRegex.test(body)) {
        body = body.replace(markerRegex, aboutBlock);
    } else {
        // Also replace a plain "## About You" section (up to next ## or end)
        const headingRegex = /## About You\n[\s\S]*?(?=\n## |\n<!-- |$)/;
        if (headingRegex.test(body)) {
            body = body.replace(headingRegex, aboutBlock);
        } else {
            // Append after existing content
            body = body.trimEnd() + '\n\n' + aboutBlock + '\n';
        }
    }

    // Update modified date in frontmatter
    parsed.data.modified = new Date().toISOString().split('T')[0];

    const output = matter.stringify(body, parsed.data);
    await fs.writeFile(vaultFilePath, output);
}

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI COMMAND
// ─────────────────────────────────────────────────────────────────────────────

export const interviewCommand = new Command('interview')
    .description('Run (or re-run) the "10 Questions" personal assistant interview')
    .action(async () => {
        await runInterview();
    });
