import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function readMainBundleText() {
    const assetsDir = join(process.cwd(), 'dist', 'assets');
    const files = readdirSync(assetsDir);
    const mainFile = files.find((file) => /^main-.*\.js$/.test(file));
    if (!mainFile) {
        throw new Error('main bundle not found in dist/assets');
    }
    return readFileSync(join(assetsDir, mainFile), 'utf8');
}

describe('Build structure: entry split integrity', () => {
    it('does not lazy-load admin entry chunk from main bundle', () => {
        expect(existsSync(join(process.cwd(), 'dist', 'assets'))).toBe(true);
        const mainBundle = readMainBundleText();
        expect(mainBundle).not.toMatch(/admin-.*\.js/);
    });
});
