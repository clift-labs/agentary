// ─────────────────────────────────────────────────────────────────────────────
// Feral — File Access Guard
// ─────────────────────────────────────────────────────────────────────────────
// Restricts NodeCode file operations to allowed directories:
//   1. The active vault root (and everything under it)
//   2. ~/.dobbi/ (Dobbi's system configuration directory)
//
// All NodeCodes that perform file I/O must call assertPathAllowed() before
// any read/write operation.
// ─────────────────────────────────────────────────────────────────────────────

import path from 'path';
import os from 'os';
import { findVaultRoot } from '../../state/manager.js';

const DOBBI_SYSTEM_DIR = path.join(os.homedir(), '.dobbi');

export class FileAccessDeniedError extends Error {
    constructor(filePath: string) {
        super(
            `File access denied: "${filePath}" is outside the vault and ~/.dobbi/. ` +
            `Feral NodeCodes may only access files within the active vault or the Dobbi system directory.`,
        );
        this.name = 'FileAccessDeniedError';
    }
}

/**
 * Resolve a file path to absolute form, normalising away any `..` segments.
 */
function resolveAbsolute(filePath: string): string {
    return path.resolve(filePath);
}

/**
 * Check whether `filePath` falls within `allowedDir` (inclusive).
 * Both paths are normalised before comparison.
 */
function isUnder(filePath: string, allowedDir: string): boolean {
    const resolved = resolveAbsolute(filePath);
    const dir = resolveAbsolute(allowedDir);
    // Add trailing separator so "/foo/bar" doesn't match "/foo/barbaz"
    return resolved === dir || resolved.startsWith(dir + path.sep);
}

/**
 * Assert that a file path is within an allowed directory.
 * Throws FileAccessDeniedError if not.
 *
 * Allowed directories:
 *   - The active vault root (if one exists)
 *   - ~/.dobbi/ (always allowed for config/state access)
 */
export async function assertPathAllowed(filePath: string): Promise<void> {
    const resolved = resolveAbsolute(filePath);

    // Always allow ~/.dobbi/
    if (isUnder(resolved, DOBBI_SYSTEM_DIR)) return;

    // Allow the vault root (if one is active)
    const vaultRoot = await findVaultRoot();
    if (vaultRoot && isUnder(resolved, vaultRoot)) return;

    throw new FileAccessDeniedError(resolved);
}

/**
 * Synchronous variant for use in sync NodeCode paths.
 * Requires the vault root to be passed in explicitly.
 */
export function assertPathAllowedSync(filePath: string, vaultRoot: string | null): void {
    const resolved = resolveAbsolute(filePath);

    if (isUnder(resolved, DOBBI_SYSTEM_DIR)) return;
    if (vaultRoot && isUnder(resolved, vaultRoot)) return;

    throw new FileAccessDeniedError(resolved);
}
