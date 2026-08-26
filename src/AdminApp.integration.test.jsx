import React from 'react';
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { AdminApp } from './AdminApp.jsx';
import * as sessionModule from './auth/session.js';
import { createSupabaseHandlers } from './test-mocks/supabase-handlers.js';
import { lerFilaSincronizacao } from './cache/db.js';

describe('Fluxos 4 e 5: AdminApp Form → Payload de Salvar & Modo Offline (AdminApp.integration.test.jsx)', () => {
  let capturedPayload = null;
  let rpcCallCount = 0;

  const server = setupServer(
    ...createSupabaseHandlers({
      onSaveRpc: (payload) => {
        capturedPayload = payload;
        rpcCallCount++;
      }
    })
  );

  beforeAll(() => {
    server.listen();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'confirm').mockReturnValue(true);
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
    capturedPayload = null;
    rpcCallCount = 0;
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    localStorage.clear();
  });

  afterAll(() => {
    server.close();
    vi.restoreAllMocks();
  });

  it('Fluxo 4: preenche o formulário com seções de ingredientes, passos e tags, e envia o payload correto para salvar_receita', async () => {
    const { container } = render(<AdminApp />);

    // 1. Aguarda carregamento do painel administrativo autenticado
    expect(await screen.findByText('Painel de Receitas')).toBeInTheDocument();
    expect(await screen.findByText(/Carnes/i)).toBeInTheDocument();

    // 2. Preenche Título
    const titleInput = screen.getByPlaceholderText(/Ex: Risoto de Alho Poró/i);
    fireEvent.change(titleInput, { target: { value: 'Empadão de Frango Especial' } });

    // 3. Seleciona Categoria 'Massas' (id 2)
    const massasRadio = screen.getByRole('radio', { name: /Massas/i });
    fireEvent.click(massasRadio);

    // 4. Preenche ingrediente 1
    const ing1Name = screen.getByLabelText('Nome do ingrediente 1');
    const ing1Qty = screen.getByLabelText('Quantidade do ingrediente 1');
    const ing1Unit = screen.getByLabelText('Unidade do ingrediente 1');
    fireEvent.change(ing1Name, { target: { value: 'Farinha de Trigo' } });
    fireEvent.change(ing1Qty, { target: { value: '500' } });
    fireEvent.change(ing1Unit, { target: { value: 'g' } });

    // Adiciona ingrediente 2
    const addIngBtn = screen.getByRole('button', { name: /\+ Adicionar Ingrediente/i });
    fireEvent.click(addIngBtn);

    const ing2Name = screen.getByLabelText('Nome do ingrediente 2');
    const ing2Qty = screen.getByLabelText('Quantidade do ingrediente 2');
    const ing2Unit = screen.getByLabelText('Unidade do ingrediente 2');
    fireEvent.change(ing2Name, { target: { value: 'Peito de Frango Desfiado' } });
    fireEvent.change(ing2Qty, { target: { value: '400' } });
    fireEvent.change(ing2Unit, { target: { value: 'g' } });

    // Adiciona seção e divide os ingredientes em grupos: 'Massa' e 'Recheio'
    const addSectionBtn = screen.getByRole('button', { name: /\+ Adicionar Seção \(Massa, Recheio\.\.\.\)/i });
    fireEvent.click(addSectionBtn);

    // Renomeia Seção 1 para 'Massa'
    const section1Title = screen.getByLabelText(/Nome da seção Seção 1/i);
    fireEvent.change(section1Title, { target: { value: 'Massa' } });

    // Atribui ingrediente 1 à seção 'Massa'
    const ing1GroupSelect = screen.getByLabelText('Seção do ingrediente 1');
    fireEvent.change(ing1GroupSelect, { target: { value: 'Massa' } });

    // Atribui ingrediente 2 à nova seção 'Recheio'
    const ing2GroupSelect = screen.getByLabelText('Seção do ingrediente 2');
    fireEvent.change(ing2GroupSelect, { target: { value: '__NEW_SECTION__' } });

    const section2Title = screen.getByLabelText(/Nome da seção Seção 2/i);
    fireEvent.change(section2Title, { target: { value: 'Recheio' } });

    // 5. Preenche 2 passos de preparo
    const step1Input = screen.getByLabelText('Texto do passo 1');
    fireEvent.change(step1Input, { target: { value: 'Misture a manteiga com a farinha até formar a massa.' } });

    const addStepBtn = screen.getByRole('button', { name: /\+ Adicionar Passo/i });
    fireEvent.click(addStepBtn);

    const step2Input = screen.getByLabelText('Texto do passo 2');
    fireEvent.change(step2Input, { target: { value: 'Coloque o recheio e asse por 35 minutos a 200°C.' } });

    // 6. Adiciona Tag via Autocomplete ('Fit')
    const tagInput = screen.getByLabelText('Campo de tag');
    fireEvent.change(tagInput, { target: { value: 'Fit' } });

    const tagSuggestion = await screen.findByRole('option', { name: 'Fit' });
    fireEvent.mouseDown(tagSuggestion);

    // 7. Submete o formulário
    const form = container.querySelector('#admin-panel');
    fireEvent.submit(form);

    // 8. Validações do Payload interceptado na borda HTTP
    await waitFor(() => {
      expect(capturedPayload).not.toBeNull();
    });

    expect(capturedPayload.p_title).toBe('Empadão de Frango Especial');
    expect(capturedPayload.p_category_id).toBe(2);
    expect(capturedPayload.p_category_key).toBe('massas');
    expect(capturedPayload.p_tags).toContain('Fit');

    // Valida ingredientes com group_name correto
    expect(capturedPayload.p_ingredientes).toHaveLength(2);
    expect(capturedPayload.p_ingredientes[0]).toEqual({
      name: 'Farinha de Trigo',
      qty: 500,
      unit: 'g',
      group_name: 'Massa',
      ordem: 0
    });
    expect(capturedPayload.p_ingredientes[1]).toEqual({
      name: 'Peito de Frango Desfiado',
      qty: 400,
      unit: 'g',
      group_name: 'Recheio',
      ordem: 1
    });

    // Valida passos de preparo
    expect(capturedPayload.p_passos).toHaveLength(2);
    expect(capturedPayload.p_passos[0]).toEqual({
      step_text: 'Misture a manteiga com a farinha até formar a massa.',
      ordem: 0
    });
    expect(capturedPayload.p_passos[1]).toEqual({
      step_text: 'Coloque o recheio e asse por 35 minutos a 200°C.',
      ordem: 1
    });
  });

  it('Fluxo 5: ao salvar com navigator.onLine = false, NÃO chama a RPC online e enfileira no IndexedDB', async () => {
    // Simula navegador offline
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

    const { container } = render(<AdminApp />);

    expect(await screen.findByText('Painel de Receitas')).toBeInTheDocument();

    // Preenche dados básicos válidos
    const titleInput = screen.getByPlaceholderText(/Ex: Risoto de Alho Poró/i);
    fireEvent.change(titleInput, { target: { value: 'Receita Offline para Sincronizar' } });

    const carnesRadio = screen.getByRole('radio', { name: /Carnes/i });
    fireEvent.click(carnesRadio);

    const ingName = screen.getByLabelText('Nome do ingrediente 1');
    const ingQty = screen.getByLabelText('Quantidade do ingrediente 1');
    const ingUnit = screen.getByLabelText('Unidade do ingrediente 1');
    fireEvent.change(ingName, { target: { value: 'Carne Moída' } });
    fireEvent.change(ingQty, { target: { value: '500' } });
    fireEvent.change(ingUnit, { target: { value: 'g' } });

    const stepInput = screen.getByLabelText('Texto do passo 1');
    fireEvent.change(stepInput, { target: { value: 'Refogue a carne com temperos.' } });

    // Submete o formulário
    const form = container.querySelector('#admin-panel');
    fireEvent.submit(form);

    // 1. Confirma que a RPC online NÃO foi chamada
    await waitFor(async () => {
      const fila = await lerFilaSincronizacao();
      expect(fila.length).toBeGreaterThan(0);
    });

    expect(rpcCallCount).toBe(0);

    // 2. Confirma que a receita foi persistida na fila do IndexedDB
    const fila = await lerFilaSincronizacao();
    const itemEnfileirado = fila.find((f) => f.payload.p_title === 'Receita Offline para Sincronizar');
    expect(itemEnfileirado).toBeDefined();
    expect(itemEnfileirado.payload.p_category_id).toBe(1);
    expect(itemEnfileirado.payload.p_category_key).toBe('carnes');
    expect(itemEnfileirado.payload.p_ingredientes[0].name).toBe('Carne Moída');
  });
});
