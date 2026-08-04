import { describe, it, expect } from 'vitest';
import { parseStepTimer } from '../logic/recipes.js';

describe('Logic: parseStepTimer', () => {

    it('should return null when text does not contain time references', () => {
        expect(parseStepTimer('Misture bem os ingredientes numa tigela.')).toBeNull();
    });

    it('should parse single digit minutes', () => {
        expect(parseStepTimer('Cozinhe por 5 min')).toEqual({ totalSeconds: 300, displayMinutes: 5 });
        expect(parseStepTimer('Ferva por 3 minuto')).toEqual({ totalSeconds: 180, displayMinutes: 3 });
        expect(parseStepTimer('Deixe descansar por 10 minutos')).toEqual({ totalSeconds: 600, displayMinutes: 10 });
    });

    it('should parse hours correctly', () => {
        expect(parseStepTimer('Asse por 1 h')).toEqual({ totalSeconds: 3600, displayMinutes: 60 });
        expect(parseStepTimer('Cozinhe por 2 hora')).toEqual({ totalSeconds: 7200, displayMinutes: 120 });
        expect(parseStepTimer('Marinar por 3 horas')).toEqual({ totalSeconds: 10800, displayMinutes: 180 });
    });

    it('should parse first time reference if multiple exist', () => {
        expect(parseStepTimer('Ferva por 10 min e depois deixe esfriar por 20 minutos')).toEqual({ totalSeconds: 600, displayMinutes: 10 });
    });
});
