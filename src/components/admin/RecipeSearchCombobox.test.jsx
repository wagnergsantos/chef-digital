import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { RecipeSearchCombobox } from './RecipeSearchCombobox.jsx';

describe('RecipeSearchCombobox Component', () => {
  const mockRecipes = [
    {
      id: 1,
      title: 'Bolo Completo',
      emoji: '🍰',
      image: 'https://example.com/bolo.jpg',
      categoria_id: 1,
      prep_time: 20,
      cook_time: 40,
      servings: 8,
      tags: ['Doce']
    },
    {
      id: 2,
      title: 'Sopa Sem Foto',
      emoji: '🍲',
      image: '',
      categoria_id: 2,
      prep_time: 15,
      cook_time: 30,
      servings: 4,
      tags: ['Sopa']
    },
    {
      id: 3,
      title: 'Item A Revisar',
      emoji: '🥗',
      image: 'https://example.com/salada.jpg',
      categoria_id: 3,
      prep_time: 10,
      cook_time: 0,
      servings: 2,
      tags: ['A Revisar']
    }
  ];

  it('renders search input and audit chips with counts', () => {
    render(
      <RecipeSearchCombobox
        recipes={mockRecipes}
        selectedRecipeId={null}
        onSelectRecipe={vi.fn()}
        onLoadRecipe={vi.fn()}
        onDeleteRecipe={vi.fn()}
        loadingLoad={false}
        loadingDelete={false}
      />
    );

    expect(screen.getByPlaceholderText(/Buscar receita pelo nome ou tag/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sem foto/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /A Revisar/i })).toBeInTheDocument();
  });

  it('filters dropdown list when clicking Sem foto chip', () => {
    render(
      <RecipeSearchCombobox
        recipes={mockRecipes}
        selectedRecipeId={null}
        onSelectRecipe={vi.fn()}
        onLoadRecipe={vi.fn()}
        onDeleteRecipe={vi.fn()}
        loadingLoad={false}
        loadingDelete={false}
      />
    );

    const noPhotoChip = screen.getByRole('button', { name: /Sem foto/i });
    fireEvent.click(noPhotoChip);

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    expect(screen.getByText('Sopa Sem Foto')).toBeInTheDocument();
    expect(screen.queryByText('Bolo Completo')).not.toBeInTheDocument();
  });

  it('calls onSelectRecipe when item is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <RecipeSearchCombobox
        recipes={mockRecipes}
        selectedRecipeId={null}
        onSelectRecipe={handleSelect}
        onLoadRecipe={vi.fn()}
        onDeleteRecipe={vi.fn()}
        loadingLoad={false}
        loadingDelete={false}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    const item = screen.getByText('Bolo Completo');
    fireEvent.mouseDown(item);

    expect(handleSelect).toHaveBeenCalledWith(1);
  });
});
