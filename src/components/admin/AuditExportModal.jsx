import { useState, useMemo } from 'react';
import adminUi from './AdminUI.module.css';
import styles from './AuditExportModal.module.css';
import {
  filterRecipesByAudit,
  calculateAuditCounts
} from '../../logic/recipe-audit.js';
import {
  buildAuditExportPayload,
  parseAndValidateAiPatch
} from '../../logic/recipe-export.js';
import {
  fetchFullRecipesByIds,
  applyRecipeAuditPatches
} from '../../api/admin.js';

export function AuditExportModal({
  categories = [],
  recipesList = [],
  allExistingTags = [],
  onClose,
  onRefreshData
}) {
  const [activeTab, setActiveTab] = useState('export'); // 'export' | 'import'
  const [filterType, setFilterType] = useState('no-time-servings');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportedJsonText, setExportedJsonText] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');

  // Import State
  const [aiInputText, setAiInputText] = useState('');
  const [validationError, setValidationError] = useState('');
  const [parsedPatches, setParsedPatches] = useState([]);
  const [isApplying, setIsApplying] = useState(false);
  const [applyProgress, setApplyProgress] = useState(null); // { current, total, title }
  const [applySuccessMsg, setApplySuccessMsg] = useState('');

  const auditCounts = useMemo(() => calculateAuditCounts(recipesList), [recipesList]);

  const targetCount = useMemo(() => {
    return filterRecipesByAudit(recipesList, filterType).length;
  }, [recipesList, filterType]);

  const handleGenerateExport = async () => {
    setExportLoading(true);
    setCopyFeedback('');
    try {
      const filtered = filterRecipesByAudit(recipesList, filterType);
      if (filtered.length === 0) {
        setExportedJsonText('Nenhuma receita encontrada para o filtro selecionado.');
        return;
      }

      const ids = filtered.map((r) => r.id);
      const fullRecipes = await fetchFullRecipesByIds(ids);

      const payload = buildAuditExportPayload({
        recipes: fullRecipes,
        allExistingTags,
        categories,
        filterType
      });

      const formatted = JSON.stringify(payload, null, 2);
      setExportedJsonText(formatted);
    } catch (err) {
      console.error('Erro ao gerar exportação para IA:', err);
      alert('Erro ao carregar detalhes das receitas: ' + err.message);
    } finally {
      setExportLoading(false);
    }
  };

  const handleCopyClipboard = async () => {
    if (!exportedJsonText) return;
    try {
      await navigator.clipboard.writeText(exportedJsonText);
      setCopyFeedback('✅ Copiado para a área de transferência!');
      setTimeout(() => setCopyFeedback(''), 3000);
    } catch (err) {
      console.error('Falha ao copiar:', err);
      alert('Não foi possível copiar automaticamente.');
    }
  };

  const handleDownloadFile = () => {
    if (!exportedJsonText) return;
    try {
      const blob = new Blob([exportedJsonText], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receitas_incompletas_${filterType}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao baixar arquivo:', err);
    }
  };

  const handleValidateAiResponse = () => {
    setValidationError('');
    setApplySuccessMsg('');
    const result = parseAndValidateAiPatch(aiInputText, recipesList);
    if (!result.valid) {
      setValidationError(result.error);
      setParsedPatches([]);
    } else {
      setParsedPatches(result.patches);
    }
  };

  const handleApplyPatches = async () => {
    if (parsedPatches.length === 0) return;
    setIsApplying(true);
    setApplySuccessMsg('');
    setValidationError('');

    try {
      const results = await applyRecipeAuditPatches(parsedPatches, (prog) => {
        setApplyProgress(prog);
      });

      if (results.errors.length > 0) {
        setValidationError(
          `Concluído com avisos: ${results.success} salvas, ${results.failed} falharam.`
        );
      } else {
        setApplySuccessMsg(`🎉 ${results.success} receitas atualizadas com sucesso!`);
      }

      if (onRefreshData) {
        await onRefreshData();
      }
    } catch (err) {
      console.error('Erro ao aplicar correções:', err);
      setValidationError('Erro ao salvar correções: ' + err.message);
    } finally {
      setIsApplying(false);
      setApplyProgress(null);
    }
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Auditoria e Exportação para IA">
      <div className={styles.modalContent}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            🪄 Assistente IA: Completar Receitas Incompletas
          </h3>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fechar modal"
            disabled={isApplying || exportLoading}
          >
            ✕
          </button>
        </div>

        <div className={styles.tabBar}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'export' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('export')}
          >
            📤 1. Exportar para IA
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'import' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('import')}
          >
            📥 2. Aplicar Resposta da IA
          </button>
        </div>

        <div className={styles.bodyContainer}>
          {activeTab === 'export' ? (
            <>
              <div className={styles.infoBanner}>
                <strong>Como funciona:</strong> O exportador agrupa as receitas incompletas trazendo título,
                ingredientes e modo de preparo para a LLM poder deduzir tempo e porções com precisão.
                As <strong>{allExistingTags.length} tags existentes</strong> são colocadas no início do arquivo
                para que a IA priorize reutilizá-las.
              </div>

              <div className={styles.filterRow}>
                <label htmlFor="export-filter-select">
                  <strong>Filtrar pendência:</strong>
                </label>
                <select
                  id="export-filter-select"
                  className={styles.selectInput}
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setExportedJsonText('');
                    setCopyFeedback('');
                  }}
                >
                  <option value="no-time-servings">⏱️ Falta tempo ou rendimento ({auditCounts['no-time-servings']})</option>
                  <option value="incomplete">⚠️ Todas incompletas ({auditCounts.incomplete})</option>
                  <option value="no-tags">🏷️ Sem tags ({auditCounts['no-tags']})</option>
                  <option value="no-category">📁 Sem categoria ({auditCounts['no-category']})</option>
                  <option value="no-image">📷 Sem foto ({auditCounts['no-image']})</option>
                  <option value="all">📋 Todas as receitas ({auditCounts.all})</option>
                </select>

                <button
                  type="button"
                  className={`${adminUi.btn} ${adminUi.btnPrimary}`}
                  onClick={handleGenerateExport}
                  disabled={exportLoading || targetCount === 0}
                >
                  {exportLoading ? 'Carregando detalhes...' : `Gerar Dados (${targetCount} receitas)`}
                </button>
              </div>

              {exportedJsonText && (
                <>
                  <div className={styles.actionsRow}>
                    <button
                      type="button"
                      className={`${adminUi.btn} ${adminUi.btnPrimary}`}
                      onClick={handleCopyClipboard}
                    >
                      📋 Copiar Prompt para IA
                    </button>
                    <button
                      type="button"
                      className={`${adminUi.btn} ${adminUi.btnSecondary}`}
                      onClick={handleDownloadFile}
                    >
                      💾 Baixar Arquivo JSON
                    </button>
                    {copyFeedback && <span className={styles.copyFeedbackMsg}>{copyFeedback}</span>}
                  </div>

                  <textarea
                    className={styles.textareaPrompt}
                    readOnly
                    value={exportedJsonText}
                    aria-label="JSON gerado para exportação"
                  />
                </>
              )}
            </>
          ) : (
            <>
              <div className={styles.infoBanner}>
                Cole abaixo o JSON retornado pela LLM (puro ou dentro de bloco de código). Ele deve conter o array com os <code>id</code>s correspondentes e os campos completados (<code>prep_time</code>, <code>cook_time</code>, <code>servings</code>, <code>tags</code>).
              </div>

              <textarea
                className={styles.textareaPrompt}
                placeholder={'Cole aqui o retorno da LLM...\nEx:\n[\n  { "id": 12, "prep_time": 20, "cook_time": 40, "servings": 6, "tags": ["Almoço", "Fácil"] }\n]'}
                value={aiInputText}
                onChange={(e) => setAiInputText(e.target.value)}
                disabled={isApplying}
                aria-label="Entrada de JSON da IA"
              />

              <div className={styles.actionsRow}>
                <button
                  type="button"
                  className={`${adminUi.btn} ${adminUi.btnSecondary}`}
                  onClick={handleValidateAiResponse}
                  disabled={!aiInputText.trim() || isApplying}
                >
                  🔍 Validar Resposta
                </button>
              </div>

              {validationError && (
                <div className={styles.errorMsg}>
                  ❌ {validationError}
                </div>
              )}

              {applySuccessMsg && (
                <div className={styles.successMsg}>
                  {applySuccessMsg}
                </div>
              )}

              {parsedPatches.length > 0 && (
                <>
                  <div className={styles.previewCountTitle}>
                    Pré-visualização: {parsedPatches.length} receitas a atualizar
                  </div>

                  <div className={styles.tableWrapper}>
                    <table className={styles.previewTable}>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Título</th>
                          <th>Prep (min)</th>
                          <th>Cozimento (min)</th>
                          <th>Rendimento</th>
                          <th>Tags</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedPatches.map((p) => (
                          <tr key={p.id}>
                            <td>#{p.id}</td>
                            <td>{p.title}</td>
                            <td>{p.prep_time ?? '—'}</td>
                            <td>{p.cook_time ?? '—'}</td>
                            <td>{p.servings ?? '—'}</td>
                            <td>
                              {p.tags.map((t) => (
                                <span key={t} className={styles.tagBadge}>
                                  {t}
                                </span>
                              ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {isApplying && applyProgress && (
                    <div>
                      <div className={styles.progressBarContainer}>
                        <div
                          className={styles.progressBarFill}
                          style={{
                            width: `${(applyProgress.current / applyProgress.total) * 100}%`
                          }}
                        />
                      </div>
                      <div className={styles.statusText}>
                        Salvando {applyProgress.current} de {applyProgress.total}: {applyProgress.title}...
                      </div>
                    </div>
                  )}

                  <div className={styles.actionsRow}>
                    <button
                      type="button"
                      className={`${adminUi.btn} ${adminUi.btnPrimary}`}
                      onClick={handleApplyPatches}
                      disabled={isApplying}
                    >
                      {isApplying ? 'Salvando correções...' : `✅ Aplicar ${parsedPatches.length} Correções no Banco`}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
