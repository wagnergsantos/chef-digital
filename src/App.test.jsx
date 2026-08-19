import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App.jsx';

describe('App component', () => {
    it('renderiza o componente App e o header', () => {
        render(<App />);
        expect(screen.getByText('Chef Digital')).toBeInTheDocument();
    });
});
