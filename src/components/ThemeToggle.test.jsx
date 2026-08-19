import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from './ThemeToggle.jsx';

describe('ThemeToggle component', () => {
    it('renderiza o botao de alternar tema com acessibilidade', () => {
        const handleToggle = vi.fn();
        render(<ThemeToggle theme="light" onToggle={handleToggle} />);

        const btn = screen.getByRole('button', { name: /Alternar para Modo Escuro/i });
        expect(btn).toBeInTheDocument();

        fireEvent.click(btn);
        expect(handleToggle).toHaveBeenCalledTimes(1);
    });
});
