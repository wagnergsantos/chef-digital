const UNITS = [
  '',
  'g',
  'kg',
  'ml',
  'l',
  'xícara(s)',
  'colher(es) de sopa',
  'colher(es) de chá',
  'unidade(s)',
  'pitada(s)',
  'a gosto',
  'dente(s)',
  'lata(s)',
  'pacote(s)'
];

function DeleteRowButton({ onClick, ariaLabel }) {
  return (
    <button
      type="button"
      className="btn-delete-row"
      title="Remover item"
      aria-label={ariaLabel || 'Remover item'}
      onClick={onClick}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
    </button>
  );
}

export function IngredientsEditor({ ingredients, onChange, onAdd }) {
  const handleItemChange = (index, field, value) => {
    const updated = ingredients.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    onChange(updated);
  };

  const handleRemove = (index) => {
    const updated = ingredients.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <>
      <h3 className="section-title">Ingredientes</h3>
      <div id="ingredients-list" className="mb-4">
        {ingredients.map((ing, index) => (
          <div key={index} className="ingredient-row">
            <input
              type="text"
              className="form-input ingredient-name"
              placeholder="Nome do ingrediente..."
              required
              value={ing.name || ''}
              aria-label={`Nome do ingrediente ${index + 1}`}
              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
            />
            <input
              type="text"
              className="form-input ingredient-qty"
              placeholder="Qtd (ex: 1.5)"
              value={ing.qty !== null && ing.qty !== undefined ? ing.qty : ''}
              aria-label={`Quantidade do ingrediente ${index + 1}`}
              onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
            />
            <select
              className="form-input ingredient-unit"
              value={ing.unit || ''}
              aria-label={`Unidade do ingrediente ${index + 1}`}
              onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u || 'Sem unidade'}
                </option>
              ))}
            </select>
            <DeleteRowButton
              onClick={() => handleRemove(index)}
              ariaLabel={`Remover ingrediente ${index + 1}`}
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        id="btn-add-ingredient"
        className="admin-btn admin-btn-secondary"
        onClick={onAdd}
      >
        + Adicionar Ingrediente
      </button>
    </>
  );
}
