import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { SecretsSchema, ConfigSchema, type Secrets, type Config } from './schemas/index.js';

const DOBBIE_DIR = path.join(os.homedir(), '.dobbie');
const SECRETS_PATH = path.join(DOBBIE_DIR, 'secrets.json');
const CONFIG_PATH = path.join(DOBBIE_DIR, 'config.json');

// Default configuration
const DEFAULT_CONFIG: Config = {
    taskModelMapping: {
        today: { provider: 'claude', model: 'claude-sonnet-4-20250514' },
        remember: { provider: 'claude', model: 'claude-3-5-haiku-20241022' },
    },
    defaultProvider: 'claude',
};

const DEFAULT_SECRETS: Secrets = {
    providers: {},
};

async function ensureDobbieDir(): Promise<void> {
    await fs.mkdir(DOBBIE_DIR, { recursive: true });
}

export async function loadSecrets(): Promise<Secrets> {
    try {
        await ensureDobbieDir();
        const data = await fs.readFile(SECRETS_PATH, 'utf-8');
        return SecretsSchema.parse(JSON.parse(data));
    } catch {
        return DEFAULT_SECRETS;
    }
}

export async function saveSecrets(secrets: Secrets): Promise<void> {
    await ensureDobbieDir();
    await fs.writeFile(SECRETS_PATH, JSON.stringify(secrets, null, 2));
}

export async function loadConfig(): Promise<Config> {
    try {
        await ensureDobbieDir();
        const data = await fs.readFile(CONFIG_PATH, 'utf-8');
        return ConfigSchema.parse(JSON.parse(data));
    } catch {
        return DEFAULT_CONFIG;
    }
}

export async function saveConfig(config: Config): Promise<void> {
    await ensureDobbieDir();
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export async function getApiKey(provider: string): Promise<string | null> {
    const secrets = await loadSecrets();
    return secrets.providers[provider]?.apiKey ?? null;
}

export async function setApiKey(provider: string, apiKey: string): Promise<void> {
    const secrets = await loadSecrets();
    secrets.providers[provider] = { apiKey };
    await saveSecrets(secrets);
}

export async function getTaskModel(task: string): Promise<{ provider: string; model: string } | null> {
    const config = await loadConfig();
    return config.taskModelMapping[task] ?? null;
}

export async function setTaskModel(task: string, provider: string, model: string): Promise<void> {
    const config = await loadConfig();
    config.taskModelMapping[task] = { provider, model };
    await saveConfig(config);
}

export { DOBBIE_DIR, SECRETS_PATH, CONFIG_PATH };
