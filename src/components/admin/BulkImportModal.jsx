import { useState, useRef } from 'react';
import { parseRecipeAiFunction, saveRecipeRpc } from '../../api/admin.js';
import { buildRecipePayload } from '../../logic/admin-parser.js';

export function BulkImportModal({ categories, onClose, onRefreshData }) {
  const [itemsStatus, setItemsStatus] = useState([]); // [{ file, status: 'pending'|'parsing'|'success'|'error', recipe: null, error: null }]
  const [processing, setProcessing] = useState(false);
  const [autoSaveDb, setAutoSaveDb] = useState(true);
  const [customPrompt, setCustomPrompt] = useState('');
  const fileInputRef = useRef(null);

  const handleFilesSelect = (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;

    const newItems = files.map((file) => ({
      file,
      status: 'pending',
      recipe: null,
      error: null
    }));
    setItemsStatus((prev) => [...prev, ...newItems]);
  };

  const removeFile = (index) => {
    setItemsStatus((prev) => prev.filter((_, i) => i !== index));
  };

  const compressAndToBase64 = (file, { maxPx = 1024, quality = 0.82 } = {}) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let { width, height } = img;
        if (width > maxPx || height > maxPx) {
          if (width > height) {
            height = Math.round((height * maxPx) / width);
            width = maxPx;
          } else {
            width = Math.round((width * maxPx) / height);
            height = maxPx;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
      };
      img.onerror = reject;
      img.src = objectUrl;
    });
  };

  const processBulk = async () => {
    if (itemsStatus.length === 0) return;
    setProcessing(true);

    for (let i = 0; i < itemsStatus.length; i++) {
      const item = itemsStatus[i];
      if (item.status === 'success') continue; // pula os já concluídos

      setItemsStatus((prev) =>
        prev.map((it, idx) => (idx === i ? { ...it, status: 'parsing', error: null } : it))
      );

      try {
        const { base64, mimeType } = await compressAndToBase64(item.file);
        const data = await parseRecipeAiFunction({
          image: {
            data: base64,
            mimeType
          },
          customPrompt: customPrompt || undefined
        });

        if (!data || !data.ok) {
          throw new Error(data?.message || data?.error || 'Falha ao processar com IA.');
        }

        const recipe = data.recipe;

        // Se autoSaveDb estiver ativo, salvar via RPC
        if (autoSaveDb && recipe) {
          let categoryId = null;
          if (categories && categories.length > 0) {
            if (recipe.category) {
              const catKey = String(recipe.category).toLowerCase().trim();
              const match = categories.find(
                (c) => (c.key && c.key.toLowerCase().trim() === catKey) || (c.label && c.label.toLowerCase().includes(catKey)) || catKey.includes((c.key || '').toLowerCase())
              );
              if (match) categoryId = match.id;
            }
            // Se não encontrou correspondência exata, usa a categoria "outros" ou a primeira disponível
            if (!categoryId) {
              const outrosCat = categories.find((c) => c.key === 'outros');
              categoryId = outrosCat ? outrosCat.id : categories[0].id;
            }
          }

          const payload = buildRecipePayload({
            id: null,
            title: recipe.title || item.file.name,
            emoji: recipe.emoji || '🍲',
            image: recipe.image || '',
            servings: recipe.servings,
            prep_time: recipe.prep_time,
            cook_time: recipe.cook_time,
            author: recipe.author || '',
            source_url: recipe.source_url || '',
            tips: recipe.tips || '',
            selectedCategoryId: categoryId,
            selectedCategoryKey: recipe.category || '',
            tags: Array.from(new Set(['A Revisar', ...(Array.isArray(recipe.tags) ? recipe.tags : [])])),
            validIngredients: (recipe.ingredients || []).map((ing) => ({
              name: ing.name || '',
              qty: ing.qty !== undefined && ing.qty !== null ? ing.qty : null,
              unit: ing.unit || ''
            })),
            validSteps: (recipe.steps || []).map((s) => ({
              step_text: typeof s === 'string' ? s : s.step_text || ''
            }))
          });

          await saveRecipeRpc(payload);
        }

        setItemsStatus((prev) =>
          prev.map((it, idx) => (idx === i ? { ...it, status: 'success', recipe } : it))
        );
      } catch (err) {
        console.error(`Erro ao processar ${item.file.name}:`, err);
        setItemsStatus((prev) =>
          prev.map((it, idx) => (idx === i ? { ...it, status: 'error', error: err.message } : it))
        );
      }

      // Pequeno delay entre requisições
      if (i < itemsStatus.length - 1) {
        await new Promise((r) => setTimeout(r, 1200));
      }
    }

    setProcessing(false);
    if (onRefreshData) onRefreshData();
  };

  const downloadJsonsZipOrFiles = () => {
    itemsStatus.forEach((item) => {
      if (item.status === 'success' && item.recipe) {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(item.recipe, null, 2));
        const downloadAnchor = document.createElement('a');
        const fileName = `${item.file.name.replace(/\.[^/.]+$/, '')}.json`;
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', fileName);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      }
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem'
      }}
    >
      <div
        className="admin-card"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          padding: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>📦 Importação de Receitas em Lote (Bulk)</h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
            disabled={processing}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '0.9rem', color: '#666', marginTop: 0 }}>
          Selecione múltiplas fotos de receitas do seu dispositivo. A IA irá processar cada imagem individualmente.
        </p>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.3rem', color: '#4a5568' }}>
            💡 Orientações / Tags Adicionais para este Lote (Opcional)
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Ex: 'Todas são receitas de muffin, adicionar a tag Saudável e Airfryer'"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            disabled={processing}
            style={{ width: '100%', padding: '0.5rem', fontSize: '0.875rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFilesSelect}
          />
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
          >
            📷 Selecionar Várias Imagens
          </button>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoSaveDb}
              onChange={(e) => setAutoSaveDb(e.target.checked)}
              disabled={processing}
            />
            Salvar direto no Supabase ao concluir
          </label>
        </div>

        {itemsStatus.length > 0 && (
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '0.5rem',
              marginBottom: '1rem',
              maxHeight: '300px'
            }}
          >
            {itemsStatus.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  borderBottom: idx < itemsStatus.length - 1 ? '1px solid #edf2f7' : 'none',
                  fontSize: '0.875rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                  <span style={{ fontWeight: 'bold' }}>#{idx + 1}</span>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                    {item.file.name}
                  </span>
                  {item.recipe?.title && (
                    <span style={{ color: '#2b6cb0', fontStyle: 'italic' }}>→ {item.recipe.title}</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {item.status === 'pending' && <span style={{ color: '#718096' }}>⏳ Na fila</span>}
                  {item.status === 'parsing' && <span style={{ color: '#d69e2e', fontWeight: 'bold' }}>⚙️ Processando IA...</span>}
                  {item.status === 'success' && <span style={{ color: '#38a169', fontWeight: 'bold' }}>✅ Concluído</span>}
                  {item.status === 'error' && (
                    <span style={{ color: '#e53e3e', fontSize: '0.8rem' }} title={item.error}>
                      ❌ Erro
                    </span>
                  )}

                  {!processing && item.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          {itemsStatus.some((i) => i.status === 'success') && (
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={downloadJsonsZipOrFiles}
              disabled={processing}
            >
              📥 Baixar JSONs
            </button>
          )}

          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={processBulk}
            disabled={processing || itemsStatus.length === 0}
          >
            {processing ? '⚙️ Processando Lote...' : '🚀 Iniciar Processamento em Lote'}
          </button>
        </div>
      </div>
    </div>
  );
}
