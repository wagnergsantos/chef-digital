import { useState } from 'react';
import { parseRecipeAiFunction } from '../../api/admin.js';

export function AIImportBox({ onImportSuccess }) {
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAIImport = async () => {
    const text = rawText.trim();
    setErrorMsg('');

    if (!text) {
      setErrorMsg('Por favor, insira o texto ou receita a ser processada.');
      return;
    }

    setLoading(true);

    try {
      if (text.startsWith('{') && text.endsWith('}')) {
        try {
          const parsed = JSON.parse(text);
          onImportSuccess(parsed);
          setRawText('');
          return;
        } catch (jsonParseErr) {
          throw new Error('O texto colado parece um JSON, mas contém erros de formatação. Verifique a estrutura.');
        }
      }

      const data = await parseRecipeAiFunction(text);

      if (!data || !data.ok) {
        if (data?.error === 'quota_exceeded') {
          throw new Error(data.message || 'Limite diário de IA exaurido.');
        }
        throw new Error(data?.error || 'Não foi possível extrair os dados da receita.');
      }

      onImportSuccess(data.recipe);
      setRawText('');
    } catch (err) {
      console.error('Erro na importação IA:', err);
      setErrorMsg('Erro ao importação: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-group admin-gemini-box">
      <label className="form-label admin-gemini-label" htmlFor="gemini-json-input">
        🪄 Importação Inteligente com IA
      </label>
      <textarea
        id="gemini-json-input"
        className="form-input admin-gemini-textarea"
        placeholder="Cole aqui qualquer texto ou link (URL) de receita..."
        rows={3}
        aria-label="Texto ou URL da receita para importação inteligente"
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
      />
      <button
        type="button"
        id="btn-import-gemini"
        className="admin-btn admin-btn-secondary admin-gemini-btn"
        aria-label="Importar e preencher receita com IA"
        disabled={loading}
        onClick={handleAIImport}
      >
        {loading ? '⏳ Processando com IA...' : '🪄 Processar e Preencher com IA'}
      </button>
      {errorMsg && (
        <div id="import-status" className="admin-error-box mt-2" style={{ display: 'block' }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
}
