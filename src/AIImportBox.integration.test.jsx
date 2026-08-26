import React from 'react';
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { AdminApp } from './AdminApp.jsx';
import * as sessionModule from './auth/session.js';
import { createSupabaseHandlers } from './test-mocks/supabase-handlers.js';

let currentAiResponse = null;

const server = setupServer(
  ...createSupabaseHandlers({
    aiParsedResponse: () => currentAiResponse
  })
);

describe('Fluxo 6: Importação por IA → Fallback de Categoria em 3 Níveis (AIImportBox.integration.test.jsx)', () => {
  beforeAll(() => {
    server.listen();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(sessionModule, 'getSession').mockResolvedValue({
      user: { id: 'admin-test-id', email: 'admin@chefdigital.com' }
    });
    vi.spyOn(sessionModule, 'onAuthStateChange').mockImplementation((cb) => {
      cb({ user: { id: 'admin-test-id', email: 'admin@chefdigital.com' } });
      return () => {};
    });
  });

  afterEach(() => {
    server.resetHandlers();
    currentAiResponse = null;
    localStorage.clear();
  });

  afterAll(() => {
    server.close();
    vi.restoreAllMocks();
  });

  it('Nível 2 (parcial): seleciona categoria correta quando a IA retorna categoria aproximada ("carne bovina" -> "carnes")', async () => {
    currentAiResponse = {
      ok: true,
      recipe: {
        title: 'Costela Gaúcha no Bafo',
        category: 'carne bovina', // Chave não exata, mas contém "carne"
        emoji: '🥩',
        ingredients: [
          { name: 'Costela bovina', qty: 1.5, unit: 'kg', group_name: 'Principal' }
        ],
        steps: [
          'Tempere a costela com sal grosso e asse lentamente.'
        ],
        servings: 6,
        prep_time: 20,
        cook_time: 180,
        tips: 'Asse embrulhada em papel alumínio.'
      }
    };

    render(<AdminApp />);
    expect(await screen.findByText('Painel de Receitas')).toBeInTheDocument();
    expect(await screen.findByText(/Carnes/i)).toBeInTheDocument();

    // Insere texto no AIImportBox
    const aiTextarea = screen.getByLabelText(/Texto, URL ou imagem da receita para importação inteligente/i);
    fireEvent.change(aiTextarea, { target: { value: 'Costela no bafo com sal grosso...' } });

    // Dispara importação inteligente
    const importBtn = screen.getByRole('button', { name: /Importar e preencher receita com IA/i });
    fireEvent.click(importBtn);

    // Aguarda preenchimento automático do formulário
    await waitFor(() => {
      expect(screen.getByDisplayValue('Costela Gaúcha no Bafo')).toBeInTheDocument();
    });

    // 1. Confirma que a categoria 'Carnes' (id 1) foi selecionada pelo fallback de nível 2
    const carnesRadio = screen.getByRole('radio', { name: /Carnes/i });
    expect(carnesRadio).toBeChecked();

    const massasRadio = screen.getByRole('radio', { name: /Massas/i });
    expect(massasRadio).not.toBeChecked();

    // Confirma ingredientes e passos preenchidos
    expect(screen.getByDisplayValue('Costela bovina')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tempere a costela com sal grosso e asse lentamente.')).toBeInTheDocument();
  });

  it('Nível 3 (primeira disponível): faz fallback para a primeira categoria quando a categoria é desconhecida', async () => {
    currentAiResponse = {
      ok: true,
      recipe: {
        title: 'Bebida Exótica Lunar',
        category: 'galactica_inexistente_xyz', // Categoria completamente desconhecida
        emoji: '🪐',
        ingredients: [
          { name: 'Fruta cósmica', qty: 2, unit: 'unidade(s)' }
        ],
        steps: [
          'Misture tudo com gelo espacial.'
        ]
      }
    };

    render(<AdminApp />);
    expect(await screen.findByText('Painel de Receitas')).toBeInTheDocument();

    const aiTextarea = screen.getByLabelText(/Texto, URL ou imagem da receita para importação inteligente/i);
    fireEvent.change(aiTextarea, { target: { value: 'Receita desconhecida de outro mundo' } });

    const importBtn = screen.getByRole('button', { name: /Importar e preencher receita com IA/i });
    fireEvent.click(importBtn);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Bebida Exótica Lunar')).toBeInTheDocument();
    });

    // 2. Confirma que a primeira categoria ('Carnes', id 1) foi selecionada pelo fallback de nível 3
    const carnesRadio = screen.getByRole('radio', { name: /Carnes/i });
    expect(carnesRadio).toBeChecked();
  });

  it('Nível 1 (exato): seleciona diretamente a categoria quando a chave bate exatamente', async () => {
    currentAiResponse = {
      ok: true,
      recipe: {
        title: 'Mousse de Chocolate Cremoso',
        category: 'doces', // Chave exata
        emoji: '🍫',
        ingredients: [
          { name: 'Chocolate meio amargo', qty: 200, unit: 'g' },
          { name: 'Creme de leite', qty: 1, unit: 'lata(s)' }
        ],
        steps: [
          'Derreta o chocolate e incorpore o creme de leite delicadamente.'
        ]
      }
    };

    render(<AdminApp />);
    expect(await screen.findByText('Painel de Receitas')).toBeInTheDocument();

    const aiTextarea = screen.getByLabelText(/Texto, URL ou imagem da receita para importação inteligente/i);
    fireEvent.change(aiTextarea, { target: { value: 'Mousse de chocolate simples' } });

    const importBtn = screen.getByRole('button', { name: /Importar e preencher receita com IA/i });
    fireEvent.click(importBtn);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Mousse de Chocolate Cremoso')).toBeInTheDocument();
    });

    // 3. Confirma que a categoria 'Doces & Sobremesas' (key: doces, id 3) foi selecionada
    const docesRadio = screen.getByRole('radio', { name: /Doces & Sobremesas/i });
    expect(docesRadio).toBeChecked();
  });
});
