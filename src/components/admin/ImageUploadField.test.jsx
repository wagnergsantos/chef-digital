import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ImageUploadField } from './ImageUploadField.jsx';
import * as adminApi from '../../api/admin.js';

vi.mock('../../api/admin.js', () => ({
  uploadRecipeImage: vi.fn(),
  deleteRecipeImageFromStorage: vi.fn().mockResolvedValue(undefined)
}));

describe('ImageUploadField Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza a dropzone quando não há valor de imagem', () => {
    render(<ImageUploadField value="" onChange={vi.fn()} />);

    expect(screen.getByText(/Arraste e solte uma foto aqui/i)).toBeInTheDocument();
    expect(screen.getByText(/PNG, JPG, WebP/i)).toBeInTheDocument();
  });

  it('renderiza o preview quando há URL de imagem', () => {
    render(
      <ImageUploadField
        value="https://xyz.supabase.co/storage/v1/object/public/recipe-images/recipe_123.webp"
        onChange={vi.fn()}
      />
    );

    const img = screen.getByAltText('Preview da receita');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://xyz.supabase.co/storage/v1/object/public/recipe-images/recipe_123.webp');
    expect(screen.getByRole('button', { name: /Trocar foto/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Remover/i })).toBeInTheDocument();
  });

  it('chama onChange com string vazia ao clicar em Remover', () => {
    const handleChange = vi.fn();
    render(
      <ImageUploadField
        value="https://xyz.supabase.co/image.webp"
        onChange={handleChange}
      />
    );

    const removeBtn = screen.getByRole('button', { name: /Remover/i });
    fireEvent.click(removeBtn);

    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('permite alternar para input manual de URL', () => {
    const handleChange = vi.fn();
    render(<ImageUploadField value="10.png" onChange={handleChange} />);

    const toggleBtn = screen.getByRole('button', { name: /Inserir caminho ou URL manualmente/i });
    fireEvent.click(toggleBtn);

    const input = screen.getByPlaceholderText(/Ex: 10\.png/i);
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('10.png');

    fireEvent.change(input, { target: { value: '11.png' } });
    expect(handleChange).toHaveBeenCalledWith('11.png');
  });

  it('faz upload de imagem válida e chama onChange com a URL retornada', async () => {
    const handleChange = vi.fn();
    adminApi.uploadRecipeImage.mockResolvedValueOnce(
      'https://supabase.co/storage/v1/object/public/recipe-images/recipe_999.webp'
    );

    render(<ImageUploadField value="" onChange={handleChange} />);

    const file = new File(['mock-content'], 'prato.png', { type: 'image/png' });
    const input = screen.getByTestId('file-picker-input');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(adminApi.uploadRecipeImage).toHaveBeenCalledWith(file);
      expect(handleChange).toHaveBeenCalledWith(
        'https://supabase.co/storage/v1/object/public/recipe-images/recipe_999.webp'
      );
    });
  });

  it('exibe erro caso o upload falhe', async () => {
    adminApi.uploadRecipeImage.mockRejectedValueOnce(new Error('Bucket não encontrado'));

    render(<ImageUploadField value="" onChange={vi.fn()} />);

    const file = new File(['mock-content'], 'prato.png', { type: 'image/png' });
    const input = screen.getByTestId('file-picker-input');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Bucket não encontrado');
    });
  });
});
