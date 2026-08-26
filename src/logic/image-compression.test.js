import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateImageFile,
  calculateTargetDimensions,
  compressImageFile
} from './image-compression.js';

describe('image-compression logic', () => {
  describe('validateImageFile', () => {
    it('rejeita arquivo nulo/indefinido', () => {
      const result = validateImageFile(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Nenhum arquivo');
    });

    it('rejeita formato não suportado (ex: pdf ou texto)', () => {
      const fakeFile = new File(['dummy'], 'doc.pdf', { type: 'application/pdf' });
      const result = validateImageFile(fakeFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Formato inválido');
    });

    it('aceita formatos válidos (jpeg, png, webp, avif, gif)', () => {
      ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'].forEach((type) => {
        const file = new File(['dummy'], 'img.test', { type });
        const result = validateImageFile(file);
        expect(result.valid).toBe(true);
      });
    });

    it('rejeita arquivos acima do tamanho máximo', () => {
      const fakeLargeFile = {
        name: 'huge.jpg',
        type: 'image/jpeg',
        size: 15 * 1024 * 1024 // 15MB
      };
      const result = validateImageFile(fakeLargeFile, 10 * 1024 * 1024);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Imagem muito pesada');
    });
  });

  describe('calculateTargetDimensions', () => {
    it('mantém dimensões originais se menores que o máximo', () => {
      const dim = calculateTargetDimensions(400, 300, 800, 800);
      expect(dim).toEqual({ width: 400, height: 300 });
    });

    it('reduz proporcionalmente quando a largura ultrapassa maxWidth', () => {
      const dim = calculateTargetDimensions(1600, 800, 800, 800);
      expect(dim).toEqual({ width: 800, height: 400 });
    });

    it('reduz proporcionalmente quando a altura ultrapassa maxHeight', () => {
      const dim = calculateTargetDimensions(600, 1200, 800, 800);
      expect(dim).toEqual({ width: 400, height: 800 });
    });

    it('trata valores zerados ou negativos com segurança', () => {
      const dim = calculateTargetDimensions(0, 0, 800, 800);
      expect(dim).toEqual({ width: 800, height: 800 });
    });
  });

  describe('compressImageFile', () => {
    let originalCreateObjectURL;
    let originalRevokeObjectURL;

    beforeEach(() => {
      originalCreateObjectURL = globalThis.URL.createObjectURL;
      originalRevokeObjectURL = globalThis.URL.revokeObjectURL;
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      globalThis.URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      globalThis.URL.createObjectURL = originalCreateObjectURL;
      globalThis.URL.revokeObjectURL = originalRevokeObjectURL;
      vi.restoreAllMocks();
    });

    it('rejeita se a validação falhar', async () => {
      await expect(compressImageFile(null)).rejects.toThrow('Nenhum arquivo');
    });

    it('executa pipeline no canvas e retorna blob comprimido', async () => {
      // Mock do Image
      class MockImage {
        constructor() {
          this.naturalWidth = 1600;
          this.naturalHeight = 1200;
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      }
      globalThis.Image = MockImage;

      // Mock do Canvas
      const mockBlob = new Blob(['compressed-webp-bytes'], { type: 'image/webp' });
      const mockCtx = {
        drawImage: vi.fn(),
        imageSmoothingEnabled: false,
        imageSmoothingQuality: 'low'
      };

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => mockCtx),
        toBlob: vi.fn((cb) => cb(mockBlob))
      };

      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'canvas') return mockCanvas;
        return originalCreateElement(tagName);
      });

      const file = new File(['raw-img'], 'dish.jpg', { type: 'image/jpeg' });
      const result = await compressImageFile(file, { maxWidth: 800 });

      expect(result).toBe(mockBlob);
      expect(mockCanvas.width).toBe(800);
      expect(mockCanvas.height).toBe(600);
      expect(mockCtx.drawImage).toHaveBeenCalled();
    });
  });
});
