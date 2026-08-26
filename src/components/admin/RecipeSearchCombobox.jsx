import { useState, useRef } from 'react';
import adminUi from './AdminUI.module.css';
import autoStyles from './Autocomplete.module.css';
import styles from './RecipeSearchCombobox.module.css';

export function RecipeSearchCombobox({
  recipes,
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
  const blurTimeoutRef = useRef(null);

  const cleanQuery = query.trim().toLowerCase();
  const matches = cleanQuery
    ? recipes.filter((r) => 
        r.title.toLowerCase().includes(cleanQuery) || 
        (r.tags && r.tags.some(t => t.toLowerCase().includes(cleanQuery)))
      ).slice(0, 15)
    : recipes.slice(0, 15);

  const handleSelect = (recipe) => {
    setQuery(`${recipe.emoji || '🍲'} ${recipe.title}`);
    onSelectRecipe(recipe.id);
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
    if (!selectedRecipeId) setIsOpen(true);
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
      onLoadRecipe(selectedRecipeId);
    }
  };

  return (
    <div className={styles.editSection}>
      <span className={styles.editSectionLabel}>✏️ Editar Receita Existente</span>
      <div className={styles.editRow}>
        <div className={styles.comboboxWrapper} id="recipe-combobox-wrapper">
          <input
            type="text"
            id="recipe-search"
            className={`${adminUi.formInput} ${styles.searchInput}`}
            placeholder="Buscar receita pelo nome..."
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
          <input type="hidden" id="recipe-select" value={selectedRecipeId || ''} />
          {isOpen && matches.length > 0 && (
            <div
              id="recipe-dropdown"
              className={`${autoStyles.dropdown} ${autoStyles.visible}`}
              style={{ zIndex: 200, maxHeight: '220px' }}
              role="listbox"
              aria-label="Receitas encontradas"
            >
              {matches.map((r, idx) => (
                <div
                  key={r.id}
                  className={`${autoStyles.dropdownItem} ${idx === highlightedIdx ? autoStyles.highlighted : ''}`}
                  role="option"
                  aria-selected={idx === highlightedIdx ? 'true' : 'false'}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(r);
                  }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className={styles.dropdownEmoji}>{r.emoji || '🍲'}</span>
                    <span>{r.title}</span>
                  </div>
                  {r.tags && r.tags.includes('A Revisar') && (
                    <span style={{ fontSize: '0.75rem', background: '#feebc8', color: '#744210', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                      🔍 A Revisar
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          id="btn-load-recipe"
          className={`${adminUi.btn} ${adminUi.btnSecondary}`}
          aria-label="Carregar receita selecionada para edição"
          disabled={loadingLoad || !selectedRecipeId}
          onClick={() => onLoadRecipe(selectedRecipeId)}
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
