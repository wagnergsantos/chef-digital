import { useState, useRef } from 'react';
import { parseRecipeAiFunction } from '../../api/admin.js';

export function AIImportBox({ onImportSuccess }) {
  const [rawText, setRawText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null); // { file, previewUrl, base64, mimeType }
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        // remove header ex: "data:image/png;base64,"
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleImageFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setErrorMsg('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP, etc).');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      const previewUrl = URL.createObjectURL(file);
      setSelectedImage({
        file,
        previewUrl,
        base64,
        mimeType: file.type
      });
      setErrorMsg('');
    } catch (err) {
      console.error('Erro ao ler imagem:', err);
      setErrorMsg('Falha ao processar arquivo de imagem.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let item of items) {
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await handleImageFile(file);
        }
        break;
      }
    }
  };

  const removeImage = () => {
    if (selectedImage?.previewUrl) {
      URL.revokeObjectURL(selectedImage.previewUrl);
    }
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAIImport = async () => {
    const text = rawText.trim();
    setErrorMsg('');

    if (!text && !selectedImage) {
      setErrorMsg('Por favor, insira o texto/link ou selecione/cole uma imagem da receita.');
      return;
    }

    setLoading(true);

    try {
      if (text.startsWith('{') && text.endsWith('}')) {
        try {
          const parsed = JSON.parse(text);
          onImportSuccess(parsed);
          setRawText('');
          removeImage();
          return;
        } catch (jsonParseErr) {
          throw new Error('O texto colado parece um JSON, mas contém erros de formatação. Verifique a estrutura.');
        }
      }

      const payload = {
        text: text || undefined,
        image: selectedImage
          ? {
              data: selectedImage.base64,
              mimeType: selectedImage.mimeType
            }
          : undefined
      };

      const data = await parseRecipeAiFunction(payload);

      if (!data || !data.ok) {
        if (data?.error === 'quota_exceeded') {
          throw new Error(data.message || 'Limite diário de IA exaurido.');
        }
        throw new Error(data?.error || 'Não foi possível extrair os dados da receita.');
      }

      onImportSuccess(data.recipe);
      setRawText('');
      removeImage();
    } catch (err) {
      console.error('Erro na importação IA:', err);
      setErrorMsg('Erro na importação: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-group admin-gemini-box">
      <label className="form-label admin-gemini-label" htmlFor="gemini-json-input">
        🪄 Importação Inteligente com IA (Texto, Link ou Imagem)
      </label>

      <textarea
        id="gemini-json-input"
        className="form-input admin-gemini-textarea"
        placeholder="Cole aqui o texto/link da receita ou COLE UMA IMAGEM diretamente com Ctrl+V / Cmd+V..."
        rows={3}
        aria-label="Texto, URL ou imagem da receita para importação inteligente"
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        onPaste={handlePaste}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          id="ai-image-upload-input"
        />
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={() => fileInputRef.current?.click()}
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
        >
          📷 {selectedImage ? 'Trocar Imagem' : 'Anexar Foto da Receita'}
        </button>

        {selectedImage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f0f4f8', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem' }}>
            <img src={selectedImage.previewUrl} alt="Preview da receita" style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '3px' }} />
            <span>Imagem carregada</span>
            <button
              type="button"
              onClick={removeImage}
              style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontWeight: 'bold', marginLeft: '0.2rem' }}
              title="Remover Imagem"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        id="btn-import-gemini"
        className="admin-btn admin-btn-secondary admin-gemini-btn mt-2"
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

