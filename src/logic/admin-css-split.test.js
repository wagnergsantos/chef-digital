import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function readProjectFile(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('Build structure: public/admin css split', () => {
    it('keeps admin-only selectors out of estilos.css', () => {
        const publicCss = readProjectFile('estilos.css');
        expect(publicCss).not.toMatch(/\.admin-/);
        expect(publicCss).not.toMatch(/\.form-group\b/);
        expect(publicCss).not.toMatch(/\.form-label\b/);
        expect(publicCss).not.toMatch(/\.form-input\b/);
    });

    it('has eliminated global src/admin.css in favor of CSS Modules', () => {
        const adminHtml = readProjectFile('admin.html');
        const indexHtml = readProjectFile('index.html');
        expect(adminHtml).not.toContain('href="src/admin.css"');
        expect(indexHtml).not.toContain('href="src/admin.css"');
        expect(existsSync(join(process.cwd(), 'src/admin.css'))).toBe(false);
    });
});
