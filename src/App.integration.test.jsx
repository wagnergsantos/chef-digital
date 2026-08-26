import React from 'react';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { App } from './App.jsx';
import { createSupabaseHandlers } from './test-mocks/supabase-handlers.js';

const server = setupServer(...createSupabaseHandlers());

describe('Fluxo 1: Busca + Filtro + Abrir Modal (App.integration.test.jsx)', () => {
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    localStorage.clear();
  });
  afterAll(() => server.close());

  it('carrega receitas reais do backend mockado, filtra por busca e categoria e abre o modal com dados completos', async () => {
    render(<App />);

    // 1. Aguarda carregamento inicial dos dados via Supabase
    expect(await screen.findByText('Frango com Legumes Assados')).toBeInTheDocument();
    expect(screen.getByText('Macarrão com Molho Pesto')).toBeInTheDocument();
    expect(screen.getByText('Bolo de Cenoura com Chocolate')).toBeInTheDocument();
    expect(screen.getByText('Salada Caesar Clássica')).toBeInTheDocument();

    // 2. Digita no campo de busca (exercita recipes-filter.js de verdade)
    const searchInput = screen.getByPlaceholderText('Buscar por título ou ingrediente…');
    fireEvent.change(searchInput, { target: { value: 'frango' } });

    // Confirma que apenas o frango permanece visível no grid
    await waitFor(() => {
      expect(screen.getByText('Frango com Legumes Assados')).toBeInTheDocument();
      expect(screen.queryByText('Macarrão com Molho Pesto')).not.toBeInTheDocument();
      expect(screen.queryByText('Bolo de Cenoura com Chocolate')).not.toBeInTheDocument();
    });

    // Limpa a busca
    fireEvent.change(searchInput, { target: { value: '' } });

    await waitFor(() => {
      expect(screen.getByText('Macarrão com Molho Pesto')).toBeInTheDocument();
    });

    // 3. Seleciona a categoria 'Doces & Sobremesas' no FilterSidebar
    const docesBtn = screen.getByRole('button', { name: /Doces & Sobremesas/i });
    fireEvent.click(docesBtn);

    // Confirma que apenas Bolo de Cenoura permanece
    await waitFor(() => {
      expect(screen.getByText('Bolo de Cenoura com Chocolate')).toBeInTheDocument();
      expect(screen.queryByText('Frango com Legumes Assados')).not.toBeInTheDocument();
      expect(screen.queryByText('Macarrão com Molho Pesto')).not.toBeInTheDocument();
    });

    // 4. Clica no card da receita para abrir o RecipeModal
    const boloCard = screen.getByText('Bolo de Cenoura com Chocolate');
    fireEvent.click(boloCard);

    // 5. Confirma que o RecipeModal abriu com a estrutura e dados corretos
    const modal = await screen.findByRole('dialog', { name: /Receita: Bolo de Cenoura com Chocolate/i });
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveAttribute('id', 'recipe-modal');

    // Confirma badges, ingredientes e modo de preparo dentro do modal
    const modalQueries = within(modal);
    expect(modalQueries.getByText('Doces & Sobremesas')).toBeInTheDocument();
    expect(modalQueries.getByText(/Rende: 8/)).toBeInTheDocument();
    expect(modalQueries.getByText(/Preparo: 20 min/)).toBeInTheDocument();
    expect(modalQueries.getByText(/Fogo: 40 min/)).toBeInTheDocument();
    expect(modalQueries.getByText('cenoura')).toBeInTheDocument();
    expect(modalQueries.getByText('chocolate')).toBeInTheDocument();
    expect(modalQueries.getByText('Bata as cenouras com ovos e óleo.')).toBeInTheDocument();
  });
});
