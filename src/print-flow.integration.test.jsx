import React from 'react';
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { App } from './App.jsx';
import { createSupabaseHandlers } from './test-mocks/supabase-handlers.js';

const server = setupServer(...createSupabaseHandlers());

describe('Fluxo 3: Impressão — Contrato Estrutural de DOM (print-flow.integration.test.jsx)', () => {
  beforeAll(() => {
    server.listen();
    if (!window.print) {
      window.print = vi.fn();
    } else {
      vi.spyOn(window, 'print').mockImplementation(() => {});
    }
  });

  afterEach(() => {
    server.resetHandlers();
    localStorage.clear();
    delete document.documentElement.dataset.printing;
  });

  afterAll(() => server.close());

  it('aciona impressão de receita, valida marcação data-printing e integridade estrutural do DOM, e limpa no afterprint', async () => {
    const { container } = render(<App />);

    // Aguarda carregar dados e renderizar grid
    expect(await screen.findByText('Frango com Legumes Assados')).toBeInTheDocument();

    // Abre o RecipeModal
    fireEvent.click(screen.getByText('Frango com Legumes Assados'));
    const modal = await screen.findByRole('dialog', { name: /Receita: Frango com Legumes Assados/i });
    expect(modal).toBeInTheDocument();

    // Garante que o estado inicial não tem data-printing
    expect(document.documentElement.dataset.printing).toBeUndefined();

    // Aciona o botão de impressão da receita
    const printBtn = screen.getByRole('button', { name: /Imprimir receita/i });
    fireEvent.click(printBtn);

    // 1. Contrato: documentElement deve conter dataset.printing === 'recipe'
    expect(document.documentElement.dataset.printing).toBe('recipe');

    // 2. Contrato estrutural: o elemento #recipe-modal DEVE estar dentro da árvore de .app-container
    const modalInContainer = container.querySelector('.app-container #recipe-modal');
    expect(modalInContainer).not.toBeNull();
    expect(modalInContainer).toBe(modal);

    // Confirma que o painel de impressão [data-print-panel] existe dentro do modal
    const printPanel = modal.querySelector('[data-print-panel]');
    expect(printPanel).not.toBeNull();

    // 3. Simula o evento nativo 'afterprint' disparado pelo navegador
    act(() => {
      window.dispatchEvent(new Event('afterprint'));
    });

    // 4. Confirma que o atributo data-printing foi completamente removido
    expect(document.documentElement.dataset.printing).toBeUndefined();
  });
});
