import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuditExportModal } from './AuditExportModal.jsx';
import * as adminApi from '../../api/admin.js';

describe('AuditExportModal', () => {
  const mockCategories = [
    { id: 1, key: 'carnes', label: 'Carnes' },
    { id: 2, key: 'massas', label: 'Massas' }
  ];

  const mockRecipesList = [
    {
      id: 1,
      title: 'Bife Incompleto',
      category_id: 1,
      categoria_id: 1,
      image: 'bife.jpg',
      prep_time: null,
      cook_time: null,
      servings: null,
      tags: []
    },
    {
      id: 2,
      title: 'Macarronada Pronta',
      category_id: 2,
      categoria_id: 2,
      image: 'macarrao.jpg',
      prep_time: 15,
      cook_time: 20,
      servings: 4,
      tags: ['Massas']
    }
  ];

  const mockTags = ['Almoço', 'Jantar', 'Rápido', 'Fácil'];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza abas e informações iniciais com tags no cabeçalho', async () => {
    render(
      <AuditExportModal
        categories={mockCategories}
        recipesList={mockRecipesList}
        allExistingTags={mockTags}
        onClose={vi.fn()}
        onRefreshData={vi.fn()}
      />
    );

    expect(screen.getByText(/Assistente IA: Completar Receitas Incompletas/i)).toBeInTheDocument();
    expect(screen.getByText(/4 tags existentes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /1\. Exportar para IA/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /2\. Aplicar Resposta da IA/i })).toBeInTheDocument();
  });

  it('gera payload de exportação com ingredientes e passos', async () => {
    vi.spyOn(adminApi, 'fetchFullRecipesByIds').mockResolvedValue([
      {
        id: 1,
        title: 'Bife Incompleto',
        category_id: 1,
        categoria_id: 1,
        image: 'bife.jpg',
        prep_time: null,
        cook_time: null,
        servings: null,
        tags: [],
        ingredients: [{ name: 'Alcatra', qty: 500, unit: 'g' }],
        steps: [{ step_text: 'Frite os bifes.' }]
      }
    ]);

    render(
      <AuditExportModal
        categories={mockCategories}
        recipesList={mockRecipesList}
        allExistingTags={mockTags}
        onClose={vi.fn()}
        onRefreshData={vi.fn()}
      />
    );

    const generateBtn = screen.getByRole('button', { name: /Gerar Dados/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Copiar Prompt para IA/i })).toBeInTheDocument();
    });

    const textarea = screen.getByLabelText(/JSON gerado para exportação/i);
    const parsed = JSON.parse(textarea.value);

    // Verifica que tags_disponíveis é o primeiro item
    expect(Object.keys(parsed)[0]).toBe('tags_disponiveis');
    expect(parsed.tags_disponiveis).toEqual(['Almoço', 'Fácil', 'Jantar', 'Rápido']);
    expect(parsed.receitas[0].id).toBe(1);
    expect(parsed.receitas[0].ingredients[0].name).toBe('Alcatra');
  });

  it('valida JSON da IA na aba de importação e exibe preview', async () => {
    render(
      <AuditExportModal
        categories={mockCategories}
        recipesList={mockRecipesList}
        allExistingTags={mockTags}
        onClose={vi.fn()}
        onRefreshData={vi.fn()}
      />
    );

    const importTab = screen.getByRole('button', { name: /2\. Aplicar Resposta da IA/i });
    fireEvent.click(importTab);

    const textarea = screen.getByLabelText(/Entrada de JSON da IA/i);
    fireEvent.change(textarea, {
      target: {
        value: JSON.stringify([
          {
            id: 1,
            prep_time: 12,
            cook_time: 18,
            servings: 2,
            tags: ['Rápido', 'Almoço']
          }
        ])
      }
    });

    const validateBtn = screen.getByRole('button', { name: /Validar Resposta/i });
    fireEvent.click(validateBtn);

    expect(await screen.findByText(/Pré-visualização: 1 receitas a atualizar/i)).toBeInTheDocument();
    expect(screen.getByText('Bife Incompleto')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Aplicar 1 Correções no Banco/i })).toBeInTheDocument();
  });
});
