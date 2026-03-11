// ─────────────────────────────────────────────────────────────────────────────
// MCP Skills — Configuration
// ─────────────────────────────────────────────────────────────────────────────

import path from 'path';
import { promises as fsPromises } from 'fs';
import { DOBBI_DIR } from '../config.js';

const SKILLS_CONFIG_PATH = path.join(DOBBI_DIR, 'skills.json');

export interface SkillEntry {
    id: string;
    name: string;
    command: string;
    args: string[];
    env: Record<string, string>;
}

export interface SkillsConfig {
    skills: SkillEntry[];
}

export async function loadSkillsConfig(): Promise<SkillsConfig> {
    try {
        const raw = await fsPromises.readFile(SKILLS_CONFIG_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        return { skills: parsed.skills ?? [] };
    } catch {
        return { skills: [] };
    }
}

export async function saveSkillsConfig(cfg: SkillsConfig): Promise<void> {
    await fsPromises.mkdir(DOBBI_DIR, { recursive: true });
    await fsPromises.writeFile(SKILLS_CONFIG_PATH, JSON.stringify(cfg, null, 2));
}
