import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CookingMode } from './CookingMode.jsx';

describe('CookingMode component', () => {
    it('nao renderiza quando isOpen e false ou sem passos', () => {
        const { container } = render(<CookingMode isOpen={false} recipe={{ steps: ['Passo 1'] }} />);
        expect(container.firstChild).toBeNull();
    });

    it('renderiza o primeiro passo e navega para o proximo', () => {
        const recipe = {
            id: 1,
            title: 'Bolo de Milho',
            steps: ['Bater os ingredientes no liquidificador por 5 minutos', 'Assar no forno']
        };

        const handleClose = vi.fn();
        const handleComplete = vi.fn();

        render(
            <CookingMode
                isOpen={true}
                recipe={recipe}
                onClose={handleClose}
                onComplete={handleComplete}
            />
        );

        expect(screen.getByText('Bater os ingredientes no liquidificador por 5 minutos')).toBeInTheDocument();
        expect(screen.getByText('⏱️ Iniciar Timer (5 min)')).toBeInTheDocument();

        const nextBtn = screen.getByRole('button', { name: /Próximo Passo/i });
        fireEvent.click(nextBtn);

        expect(screen.getByText('Assar no forno')).toBeInTheDocument();
    });
});
