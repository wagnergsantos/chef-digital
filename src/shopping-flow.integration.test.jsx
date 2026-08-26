import React from 'react';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { App } from './App.jsx';
import { createSupabaseHandlers } from './test-mocks/supabase-handlers.js';

const server = setupServer(...createSupabaseHandlers());

describe('Fluxo 2: Lista de Compras + Consolidação e Normalização de Unidades (shopping-flow.integration.test.jsx)', () => {
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    localStorage.clear();
  });
  afterAll(() => server.close());

  it('adiciona ingredientes ao drawer de compras, planeja receitas e consolida unidades normalizadas ("colheres de sopa" + "cs" -> "c. sopa")', async () => {
    const { container } = render(<App />);

    // Aguarda carregar dados
    expect(await screen.findByText('Frango com Legumes Assados')).toBeInTheDocument();
    expect(screen.getByText('Macarrão com Molho Pesto')).toBeInTheDocument();

    // 1. Abre o modal do Frango e adiciona ingredientes à lista de compras
    fireEvent.click(screen.getByText('Frango com Legumes Assados'));
    const modal = await screen.findByRole('dialog', { name: /Receita: Frango com Legumes Assados/i });
    expect(modal).toBeInTheDocument();

    const addToShoppingBtn = within(modal).getByRole('button', { name: /Adicionar todos os ingredientes à lista de compras/i });
    fireEvent.click(addToShoppingBtn);

    // Fecha o modal
    const closeBtn = within(modal).getByRole('button', { name: /Fechar receita/i });
    fireEvent.click(closeBtn);

    // 2. Abre o ShoppingDrawer pelo botão do cabeçalho
    const headerShoppingBtn = container.querySelector('.header-controls .btn-shopping');
    expect(headerShoppingBtn).not.toBeNull();
    fireEvent.click(headerShoppingBtn);

    // Confirma que os itens da receita aparecem no drawer
    const shoppingDrawer = await screen.findByRole('dialog', { name: /Lista de Compras/i });
    const drawerQueries = within(shoppingDrawer);
    expect(drawerQueries.getByText('Frango com Legumes Assados')).toBeInTheDocument();
    expect(drawerQueries.getByText('peito de frango')).toBeInTheDocument();
    expect(drawerQueries.getByText('cenoura')).toBeInTheDocument();
    expect(drawerQueries.getByText('azeite')).toBeInTheDocument();

    // Fecha o ShoppingDrawer
    const closeShoppingBtn = drawerQueries.getByRole('button', { name: /Fechar lista de compras/i });
    fireEvent.click(closeShoppingBtn);

    // 3. Planeja as duas receitas no Menu Semanal
    // Frango (id 1): azeite = 2 colheres de sopa (rende 4)
    // Macarrão (id 2): azeite = 3 cs (rende 2)
    const planFrangoBtn = screen.getByRole('button', { name: /Planejar Frango com Legumes Assados para a semana/i });
    const planMacarraoBtn = screen.getByRole('button', { name: /Planejar Macarrão com Molho Pesto para a semana/i });
    fireEvent.click(planFrangoBtn);
    fireEvent.click(planMacarraoBtn);

    // 4. Abre o PlannerDrawer
    const headerPlannerBtn = container.querySelector('.header-controls .btn-planner');
    expect(headerPlannerBtn).not.toBeNull();
    fireEvent.click(headerPlannerBtn);

    const plannerDrawer = await screen.findByRole('dialog', { name: /Menu Semanal Planejado/i });
    expect(plannerDrawer).toBeInTheDocument();

    // 5. Clica em "Consolidar Lista de Compras"
    const consolidateBtn = within(plannerDrawer).getByRole('button', { name: /Consolidar Lista de Compras/i });
    fireEvent.click(consolidateBtn);

    // 6. Confirma que o ShoppingDrawer abriu com o grupo "Menu Semanal Consolidado"
    const consolidatedTitle = await screen.findByText('Menu Semanal Consolidado');
    expect(consolidatedTitle).toBeInTheDocument();

    // 7. Validação do ponto central: "azeite" deve ter sido unificado
    // Frango (4 porções base / 1x planejada = 2 c. sopa) + Macarrão (2 porções base / 1x planejada = 3 c. sopa) = 5 c. sopa
    const shoppingListContainer = document.getElementById('shopping-list-items');
    expect(shoppingListContainer).toBeInTheDocument();

    // Verifica que 5 c. sopa foi gerado (2 + 3 somados com unidade normalizada "c. sopa")
    expect(screen.getByText(/- 5 c\. sopa/i)).toBeInTheDocument();
  });
});
