import { useState, useRef, useMemo, useEffect } from 'react';
import adminUi from './AdminUI.module.css';
import autoStyles from './Autocomplete.module.css';
import styles from './RecipeSearchCombobox.module.css';
import {
  checkRecipeAudit,
  filterRecipesByAudit,
  calculateAuditCounts
} from '../../logic/recipe-audit.js';

export function RecipeSearchCombobox({
  recipes = [],
  selectedRecipeId,
  onSelectRecipe,
  onLoadRecipe,
  onDeleteRecipe,
  loadingLoad,
  loadingDelete
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const [auditFilter, setAuditFilter] = useState('all');
  const blurTimeoutRef = useRef(null);

  // Sync query when selectedRecipeId is reset from parent
  useEffect(() => {
    if (!selectedRecipeId && query !== '') {
      setQuery('');
    }
  }, [selectedRecipeId]);

  const auditCounts = useMemo(() => calculateAuditCounts(recipes), [recipes]);

  const auditFilteredRecipes = useMemo(
    () => filterRecipesByAudit(recipes, auditFilter),
    [recipes, auditFilter]
  );

  const cleanQuery = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!cleanQuery) return auditFilteredRecipes.slice(0, 30);
    return auditFilteredRecipes
      .filter(
        (r) =>
          (r.title && r.title.toLowerCase().includes(cleanQuery)) ||
          (r.tags && r.tags.some((t) => typeof t === 'string' && t.toLowerCase().includes(cleanQuery)))
      )
      .slice(0, 30);
  }, [auditFilteredRecipes, cleanQuery]);

  const handleSelect = (recipe) => {
    setQuery(`${recipe.emoji || '🍲'} ${recipe.title}`);
    onSelectRecipe(recipe.id);
    setIsOpen(false);
    setHighlightedIdx(-1);
  };

  const handleClear = () => {
    setQuery('');
    onSelectRecipe(null);
    setHighlightedIdx(-1);
    setIsOpen(true);
  };

  const handleLoad = (id = selectedRecipeId) => {
    if (!id) return;
    onLoadRecipe(id);
    setQuery('');
    setIsOpen(false);
    setHighlightedIdx(-1);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onSelectRecipe(null);
    setHighlightedIdx(-1);
    setIsOpen(true);
  };

  const handleFocus = () => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    setIsOpen(true);
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setHighlightedIdx(-1);
    }, 150);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || matches.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx((prev) => Math.min(prev + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && highlightedIdx >= 0) {
      e.preventDefault();
      handleSelect(matches[highlightedIdx]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIdx(-1);
    }
  };

  const handleDoubleClick = () => {
    if (selectedRecipeId) {
      handleLoad(selectedRecipeId);
    }
  };

  const chips = [
    { id: 'all', label: 'Todas', icon: '📋', count: auditCounts.all },
    { id: 'incomplete', label: 'Incompletas', icon: '⚠️', count: auditCounts.incomplete },
    { id: 'no-image', label: 'Sem foto', icon: '📷', count: auditCounts['no-image'] },
    { id: 'no-category', label: 'Sem categoria', icon: '📁', count: auditCounts['no-category'] },
    { id: 'no-time-servings', label: 'Sem tempo/rend.', icon: '⏱️', count: auditCounts['no-time-servings'] },
    { id: 'no-tags', label: 'Sem tags', icon: '🏷️', count: auditCounts['no-tags'] },
    { id: 'needs-review', label: 'A Revisar', icon: '🔍', count: auditCounts['needs-review'] }
  ];

  return (
    <div className={styles.editSection}>
      <div className={styles.editHeader}>
        <span className={styles.editSectionLabel}>✏️ Editar / Auditar Receitas</span>
      </div>

      {/* Audit filter chips */}
      <div className={styles.auditChipsContainer} role="group" aria-label="Filtros de auditoria">
        {chips.map((chip) => (
          <button
            type="button"
            key={chip.id}
            className={`${styles.auditChip} ${auditFilter === chip.id ? styles.auditChipActive : ''}`}
            onClick={() => {
              setAuditFilter(chip.id);
              setIsOpen(true);
            }}
            aria-pressed={auditFilter === chip.id}
          >
            <span>{chip.icon}</span>
            <span>{chip.label}</span>
            <span className={styles.auditBadgeCount}>{chip.count}</span>
          </button>
        ))}
      </div>

      <div className={styles.editRow}>
        <div className={styles.comboboxWrapper} id="recipe-combobox-wrapper">
          <input
            type="text"
            id="recipe-search"
            className={`${adminUi.formInput} ${styles.searchInput}`}
            placeholder={
              auditFilter === 'all'
                ? 'Buscar receita pelo nome ou tag...'
                : `Buscando em "${chips.find((c) => c.id === auditFilter)?.label}"...`
            }
            autoComplete="off"
            aria-label="Buscar receita para editar"
            aria-autocomplete="list"
            aria-controls="recipe-dropdown"
            aria-expanded={isOpen && matches.length > 0 ? 'true' : 'false'}
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onDoubleClick={handleDoubleClick}
          />
          {query && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={handleClear}
              aria-label="Limpar busca"
              title="Limpar busca"
            >
              ✕
            </button>
          )}
          <input type="hidden" id="recipe-select" value={selectedRecipeId || ''} />
          {isOpen && matches.length > 0 && (
            <div
              id="recipe-dropdown"
              className={`${autoStyles.dropdown} ${autoStyles.visible}`}
              style={{ zIndex: 200, maxHeight: '260px' }}
              role="listbox"
              aria-label="Receitas encontradas"
            >
              {matches.map((r, idx) => {
                const audit = checkRecipeAudit(r);
                return (
                  <div
                    key={r.id}
                    className={`${autoStyles.dropdownItem} ${idx === highlightedIdx ? autoStyles.highlighted : ''}`}
                    role="option"
                    aria-selected={idx === highlightedIdx ? 'true' : 'false'}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(r);
                    }}
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      handleLoad(r.id);
                    }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                      <span className={styles.dropdownEmoji}>{r.emoji || '🍲'}</span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.title}
                      </span>
                    </div>

                    <div className={styles.itemBadges}>
                      {audit.hasNoImage && (
                        <span className={`${styles.itemBadge} ${styles.badgeDanger}`} title="Receita sem imagem">
                          📷 Sem foto
                        </span>
                      )}
                      {audit.hasNoCategory && (
                        <span className={`${styles.itemBadge} ${styles.badgeWarning}`} title="Receita sem categoria definida">
                          📁 Sem cat.
                        </span>
                      )}
                      {audit.hasNoTimeOrServings && (
                        <span className={`${styles.itemBadge} ${styles.badgeInfo}`} title="Sem tempo ou rendimento">
                          ⏱️ Incompleto
                        </span>
                      )}
                      {audit.hasNoTags && (
                        <span className={`${styles.itemBadge} ${styles.badgeWarning}`} title="Sem tags">
                          🏷️ Sem tags
                        </span>
                      )}
                      {audit.needsReview && (
                        <span className={`${styles.itemBadge} ${styles.badgeReview}`} title="Marcada para revisão">
                          🔍 A Revisar
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <button
          type="button"
          id="btn-load-recipe"
          className={`${adminUi.btn} ${adminUi.btnSecondary}`}
          aria-label="Carregar receita selecionada para edição"
          disabled={loadingLoad || !selectedRecipeId}
          onClick={() => handleLoad(selectedRecipeId)}
        >
          {loadingLoad ? 'Carregando...' : 'Carregar'}
        </button>
        <button
          type="button"
          id="btn-delete-recipe"
          className={`${adminUi.btn} ${adminUi.btnDanger}`}
          aria-label="Excluir receita selecionada"
          disabled={loadingDelete || !selectedRecipeId}
          onClick={() => onDeleteRecipe(selectedRecipeId, query)}
        >
          {loadingDelete ? 'Excluindo...' : 'Excluir'}
        </button>
      </div>
    </div>
  );
}
