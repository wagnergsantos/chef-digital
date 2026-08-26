import adminUi from './AdminUI.module.css';
import styles from './CategoryPicker.module.css';

export function CategoryPicker({ categories, selectedCategoryId, onChange }) {
  return (
    <div className={`${adminUi.formGroup} mb-6`}>
      <label className={`${adminUi.formLabel} mb-2`}>Categoria *</label>
      <div id="categories-container" className={styles.categoriesGrid}>
        {categories.map((cat) => (
          <label key={cat.id} className={styles.categoryItem}>
            <input
              type="radio"
              name="recipe-category"
              value={cat.id}
              data-key={cat.key}
              checked={selectedCategoryId === String(cat.id)}
              onChange={(e) => onChange(e.target.value)}
            />
            {' ' + cat.label}
          </label>
        ))}
      </div>
    </div>
  );
}
