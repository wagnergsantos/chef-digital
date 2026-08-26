import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IngredientsEditor } from './IngredientsEditor.jsx';

describe('IngredientsEditor component', () => {
    it('renderiza lista simples quando nao ha grupos', () => {
        const ingredients = [
            { name: 'Farinha', qty: 2, unit: 'xícara(s)', group_name: '' }
        ];
        const onChange = vi.fn();

        render(<IngredientsEditor ingredients={ingredients} onChange={onChange} />);

        expect(screen.getByDisplayValue('Farinha')).toBeInTheDocument();
        expect(screen.getByText('+ Adicionar Seção (Massa, Recheio...)')).toBeInTheDocument();
    });

    it('renderiza blocos de secoes quando group_name esta presente', () => {
        const ingredients = [
            { name: 'Farinha', qty: 2, unit: 'xícara(s)', group_name: 'Massa' },
            { name: 'Sardinha', qty: 2, unit: 'lata(s)', group_name: 'Recheio' }
        ];
        const onChange = vi.fn();

        render(<IngredientsEditor ingredients={ingredients} onChange={onChange} />);

        expect(screen.getByLabelText('Nome da seção Massa')).toBeInTheDocument();
        expect(screen.getByLabelText('Nome da seção Recheio')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Farinha')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Sardinha')).toBeInTheDocument();
    });

    it('permite adicionar nova secao', () => {
        const ingredients = [
            { name: 'Farinha', qty: 2, unit: 'xícara(s)', group_name: '' }
        ];
        const onChange = vi.fn();

        render(<IngredientsEditor ingredients={ingredients} onChange={onChange} />);

        const addGroupBtn = screen.getByText('+ Adicionar Seção (Massa, Recheio...)');
        fireEvent.click(addGroupBtn);

        expect(onChange).toHaveBeenCalled();
        const calledArg = onChange.mock.calls[0][0];
        expect(calledArg).toHaveLength(2);
        expect(calledArg[1].group_name).toBe('Seção 1');
    });

    it('permite apagar o texto do nome da secao sem sumir com a secao', () => {
        const ingredients = [
            { name: 'Farinha', qty: 2, unit: 'xícara(s)', group_name: 'Massa' }
        ];
        const onChange = vi.fn();

        render(<IngredientsEditor ingredients={ingredients} onChange={onChange} />);

        const sectionInput = screen.getByLabelText('Nome da seção Massa');
        fireEvent.change(sectionInput, { target: { value: '' } });

        expect(onChange).toHaveBeenCalled();
        expect(screen.getByPlaceholderText('Nome da seção (ex: Massa, Recheio)...')).toBeInTheDocument();
    });

    it('permite excluir um ingrediente pelo botao de remover', () => {
        const ingredients = [
            { name: 'Farinha', qty: 2, unit: 'xícara(s)', group_name: '' },
            { name: 'Ovo', qty: 3, unit: 'unidade(s)', group_name: '' }
        ];
        const onChange = vi.fn();

        render(<IngredientsEditor ingredients={ingredients} onChange={onChange} />);

        const deleteButtons = screen.getAllByRole('button', { name: /Remover ingrediente/i });
        expect(deleteButtons).toHaveLength(2);

        fireEvent.click(deleteButtons[0]);

        expect(onChange).toHaveBeenCalled();
        const calledArg = onChange.mock.calls[0][0];
        expect(calledArg).toHaveLength(1);
        expect(calledArg[0].name).toBe('Ovo');
    });

    it('permite mover ingrediente para outra secao via select', () => {
        const ingredients = [
            { name: 'Farinha', qty: 2, unit: 'xícara(s)', group_name: 'Massa' },
            { name: 'Sardinha', qty: 2, unit: 'lata(s)', group_name: 'Recheio' }
        ];
        const onChange = vi.fn();

        render(<IngredientsEditor ingredients={ingredients} onChange={onChange} />);

        const select = screen.getByLabelText('Seção do ingrediente 1');
        fireEvent.change(select, { target: { value: 'Recheio' } });

        expect(onChange).toHaveBeenCalled();
        const calledArg = onChange.mock.calls[0][0];
        expect(calledArg[0].group_name).toBe('Recheio');
    });
});
