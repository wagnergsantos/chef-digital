export function CategoryPicker({ categories, selectedCategoryId, onChange }) {
  return (
    <div className="form-group mb-6">
      <label className="form-label mb-2">Categoria *</label>
      <div id="categories-container" className="categories-grid">
        {categories.map((cat) => (
          <label key={cat.id} className="category-checkbox-label">
            <input
              type="radio"
              name="recipe-category"
              value={cat.id}
              data-key={cat.key}
              className="category-checkbox"
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
