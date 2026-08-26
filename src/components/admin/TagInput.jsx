import { useState, useRef } from 'react';
import adminUi from './AdminUI.module.css';
import autoStyles from './Autocomplete.module.css';
import styles from './TagInput.module.css';

export function TagInput({ tags, allExistingTags, onChange }) {
  const [inputValue, setInputValue] = useState('');
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const blurTimeoutRef = useRef(null);

  const cleanQuery = inputValue.trim().toLowerCase();
  const suggestions = cleanQuery
    ? allExistingTags
        .filter((tag) => tag.toLowerCase().includes(cleanQuery) && !tags.includes(tag))
        .slice(0, 8)
    : [];

  const handleAddTag = (tagToAdd) => {
    const val = (tagToAdd || inputValue).trim();
    if (val && !tags.includes(val)) {
      onChange([...tags, val]);
    }
    setInputValue('');
    setIsOpen(false);
    setHighlightedIdx(-1);
  };

  const handleRemoveTag = (indexToRemove) => {
    onChange(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTag();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Tab' || (e.key === 'Enter' && highlightedIdx >= 0)) {
      e.preventDefault();
      if (highlightedIdx >= 0 && suggestions[highlightedIdx]) {
        handleAddTag(suggestions[highlightedIdx]);
      } else if (e.key === 'Enter') {
        handleAddTag();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIdx(-1);
    }
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setHighlightedIdx(-1);
    }, 150);
  };

  const handleFocus = () => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    if (suggestions.length > 0) setIsOpen(true);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setHighlightedIdx(-1);
    setIsOpen(val.trim().length > 0);
  };

  return (
    <div className={adminUi.formGroup}>
      <label className={adminUi.formLabel} htmlFor="tag-input">
        Tags da receita (contexto, ocasiões, temas)
      </label>
      <div id="tags-chips-container" className={styles.chipsContainer}>
        {tags.length === 0 ? (
          <span className={styles.emptyText}>
            Nenhuma tag adicionada ainda.
          </span>
        ) : (
          tags.map((tag, index) => (
            <span key={index} className={styles.tagChip}>
              {tag}
              <span
                className={styles.tagChipRemove}
                title="Remover tag"
                onClick={() => handleRemoveTag(index)}
              >
                &times;
              </span>
            </span>
          ))
        )}
      </div>
      <div className={styles.tagInputFlex}>
        <div className={styles.autocompleteWrapper} style={{ flex: 1 }}>
          <input
            type="text"
            id="tag-input"
            className={adminUi.formInput}
            placeholder="Digite uma tag (ex: Natal, Fit, Airfryer) e pressione Enter..."
            autoComplete="off"
            aria-label="Campo de tag"
            aria-autocomplete="list"
            aria-controls="tag-suggestions"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          {isOpen && suggestions.length > 0 && (
            <div
              id="tag-suggestions"
              className={`${autoStyles.dropdown} ${autoStyles.visible}`}
              role="listbox"
              aria-label="Sugestões de tags"
            >
              {suggestions.map((tag, idx) => (
                <div
                  key={tag}
                  className={`${autoStyles.dropdownItem} ${idx === highlightedIdx ? autoStyles.highlighted : ''}`}
                  role="option"
                  aria-selected={idx === highlightedIdx ? 'true' : 'false'}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleAddTag(tag);
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          id="btn-add-tag"
          className={`${adminUi.btn} ${adminUi.btnSecondary}`}
          aria-label="Adicionar tag"
          onClick={() => handleAddTag()}
        >
          + Tag
        </button>
      </div>
    </div>
  );
}
