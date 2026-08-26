import React, { useState, useEffect } from 'react';

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

function ReorderButtons({ index, total, onMoveUp, onMoveDown }) {
  return (
    <div className="ingredient-actions">
      <button
        type="button"
        className="btn-reorder-row"
        title="Mover para cima"
        aria-label="Mover ingrediente para cima"
        disabled={index === 0}
        onClick={onMoveUp}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <button
        type="button"
        className="btn-reorder-row"
        title="Mover para baixo"
        aria-label="Mover ingrediente para baixo"
        disabled={index === total - 1}
        onClick={onMoveDown}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}

function IngredientRow({
  ing,
  index,
  total,
  sections,
  onFieldChange,
  onMoveToSection,
  onRemove,
  onMoveUp,
  onMoveDown
}) {
  return (
    <div className="ingredient-row">
      <input
        type="text"
        className="form-input ingredient-name"
        placeholder="Nome do ingrediente..."
        required
        value={ing.name || ''}
        aria-label={`Nome do ingrediente ${index + 1}`}
        onChange={(e) => onFieldChange(index, 'name', e.target.value)}
      />
      <input
        type="text"
        className="form-input ingredient-qty"
        placeholder="Qtd (ex: 1.5)"
        value={ing.qty !== null && ing.qty !== undefined ? ing.qty : ''}
        aria-label={`Quantidade do ingrediente ${index + 1}`}
        onChange={(e) => onFieldChange(index, 'qty', e.target.value)}
      />
      <select
        className="form-input ingredient-unit"
        value={ing.unit || ''}
        aria-label={`Unidade do ingrediente ${index + 1}`}
        onChange={(e) => onFieldChange(index, 'unit', e.target.value)}
      >
        {UNITS.map((u) => (
          <option key={u} value={u}>
            {u || 'Sem unidade'}
          </option>
        ))}
      </select>

      {sections.length > 0 && (
        <select
          className="form-input ingredient-group-select"
          value={ing.group_name || ''}
          aria-label={`Seção do ingrediente ${index + 1}`}
          onChange={(e) => onMoveToSection(index, e.target.value)}
        >
          <option value="">(Sem seção / Geral)</option>
          {sections.map((sec) => (
            <option key={sec.id} value={sec.name}>
              {sec.name || '(Sem nome)'}
            </option>
          ))}
          <option value="__NEW_SECTION__">+ Nova seção...</option>
        </select>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <ReorderButtons
          index={index}
          total={total}
          onMoveUp={() => onMoveUp(index)}
          onMoveDown={() => onMoveDown(index)}
        />
        <DeleteRowButton
          onClick={() => onRemove(index)}
          ariaLabel={`Remover ingrediente ${index + 1}`}
        />
      </div>
    </div>
  );
}

export function IngredientsEditor({ ingredients = [], onChange, onAdd }) {
  const [sections, setSections] = useState(() => {
    const rawGroups = Array.from(new Set(ingredients.map((i) => (i.group_name || '').trim()))).filter(Boolean);
    return rawGroups.map((name, i) => ({ id: `sec_${Date.now()}_${i}`, name }));
  });

  useEffect(() => {
    const rawGroups = Array.from(new Set(ingredients.map((i) => (i.group_name || '').trim()))).filter(Boolean);
    setSections((prev) => {
      const existingNames = new Set(prev.map((s) => s.name.trim()));
      const newSecs = [...prev];
      rawGroups.forEach((name, i) => {
        if (!existingNames.has(name)) {
          newSecs.push({ id: `sec_${Date.now()}_${i}`, name });
        }
      });
      return newSecs;
    });
  }, [ingredients]);

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
    onChange(updated.length > 0 ? updated : [{ name: '', qty: '', unit: '', group_name: '' }]);
  };

  const handleMoveUp = (index) => {
    if (index <= 0) return;
    const updated = [...ingredients];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    onChange(updated);
  };

  const handleMoveDown = (index) => {
    if (index >= ingredients.length - 1) return;
    const updated = [...ingredients];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    onChange(updated);
  };

  const handleAddGroup = () => {
    const nextGroupNumber = sections.length + 1;
    const newGroupName = `Seção ${nextGroupNumber}`;
    const newSec = { id: `sec_${Date.now()}`, name: newGroupName };
    setSections((prev) => [...prev, newSec]);
    onChange([...ingredients, { name: '', qty: '', unit: '', group_name: newGroupName }]);
  };

  const handleAddIngredientToGroup = (groupName) => {
    onChange([...ingredients, { name: '', qty: '', unit: '', group_name: groupName }]);
  };

  const handleRenameGroup = (secId, newName) => {
    const targetSec = sections.find((s) => s.id === secId);
    const oldName = targetSec ? targetSec.name : '';

    setSections((prev) =>
      prev.map((s) => (s.id === secId ? { ...s, name: newName } : s))
    );

    const updated = ingredients.map((item) => {
      if ((item.group_name || '').trim() === oldName.trim()) {
        return { ...item, group_name: newName };
      }
      return item;
    });
    onChange(updated);
  };

  const handleRemoveGroup = (secId) => {
    const targetSec = sections.find((s) => s.id === secId);
    const secName = targetSec ? targetSec.name : '';

    setSections((prev) => prev.filter((s) => s.id !== secId));
    const updated = ingredients.filter((item) => (item.group_name || '').trim() !== secName.trim());
    onChange(updated.length > 0 ? updated : [{ name: '', qty: '', unit: '', group_name: '' }]);
  };

  const handleMoveToSection = (index, targetValue) => {
    if (targetValue === '__NEW_SECTION__') {
      const nextGroupNumber = sections.length + 1;
      const newGroupName = `Seção ${nextGroupNumber}`;
      const newSec = { id: `sec_${Date.now()}`, name: newGroupName };
      setSections((prev) => [...prev, newSec]);
      handleItemChange(index, 'group_name', newGroupName);
      return;
    }
    handleItemChange(index, 'group_name', targetValue);
  };

  const hasGroups = sections.length > 0;

  if (!hasGroups) {
    return (
      <>
        <h3 className="section-title">Ingredientes</h3>
        <div id="ingredients-list" className="mb-4">
          {ingredients.map((ing, index) => (
            <IngredientRow
              key={index}
              ing={ing}
              index={index}
              total={ingredients.length}
              sections={sections}
              onFieldChange={handleItemChange}
              onMoveToSection={handleMoveToSection}
              onRemove={handleRemove}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          ))}
        </div>
        <div className="admin-ingredients-toolbar">
          <button
            type="button"
            id="btn-add-ingredient"
            className="admin-btn admin-btn-secondary"
            onClick={onAdd || (() => onChange([...ingredients, { name: '', qty: '', unit: '', group_name: '' }]))}
          >
            + Adicionar Ingrediente
          </button>
          <button
            type="button"
            id="btn-add-group"
            className="admin-btn admin-btn-secondary"
            onClick={handleAddGroup}
            title="Dividir ingredientes em seções como Massa, Recheio, etc."
          >
            + Adicionar Seção (Massa, Recheio...)
          </button>
        </div>
      </>
    );
  }

  const ungrouped = ingredients
    .map((item, originalIndex) => ({ item, originalIndex }))
    .filter(({ item }) => {
      const gName = (item.group_name || '').trim();
      return !gName || !sections.some((s) => s.name.trim() === gName);
    });

  return (
    <>
      <h3 className="section-title">Ingredientes (Divididos em Seções)</h3>

      {ungrouped.length > 0 && (
        <div className="admin-group-card mb-4">
          <div className="admin-group-header">
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-muted)' }}>
              Ingredientes Gerais (Sem seção)
            </span>
          </div>
          {ungrouped.map(({ item, originalIndex }) => (
            <IngredientRow
              key={originalIndex}
              ing={item}
              index={originalIndex}
              total={ingredients.length}
              sections={sections}
              onFieldChange={handleItemChange}
              onMoveToSection={handleMoveToSection}
              onRemove={handleRemove}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          ))}
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            style={{ fontSize: '13px', padding: '6px 12px' }}
            onClick={() => handleAddIngredientToGroup('')}
          >
            + Adicionar Ingrediente Geral
          </button>
        </div>
      )}

      {sections.map((sec) => {
        const groupItems = ingredients
          .map((item, originalIndex) => ({ item, originalIndex }))
          .filter(({ item }) => (item.group_name || '').trim() === sec.name.trim());

        return (
          <div key={sec.id} className="admin-group-card mb-4">
            <div className="admin-group-header">
              <input
                type="text"
                className="admin-group-title-input"
                value={sec.name}
                placeholder="Nome da seção (ex: Massa, Recheio)..."
                aria-label={`Nome da seção ${sec.name || 'sem nome'}`}
                onChange={(e) => handleRenameGroup(sec.id, e.target.value)}
              />
              <button
                type="button"
                className="admin-btn-group-remove"
                title={`Excluir seção ${sec.name}`}
                aria-label={`Excluir seção ${sec.name}`}
                onClick={() => handleRemoveGroup(sec.id)}
              >
                Excluir Seção
              </button>
            </div>

            {groupItems.map(({ item, originalIndex }) => (
              <IngredientRow
                key={originalIndex}
                ing={item}
                index={originalIndex}
                total={ingredients.length}
                sections={sections}
                onFieldChange={handleItemChange}
                onMoveToSection={handleMoveToSection}
                onRemove={handleRemove}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
              />
            ))}

            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              style={{ fontSize: '13px', padding: '6px 12px' }}
              onClick={() => handleAddIngredientToGroup(sec.name)}
            >
              + Adicionar Ingrediente em {sec.name || 'esta seção'}
            </button>
          </div>
        );
      })}

      <div className="admin-ingredients-toolbar">
        <button
          type="button"
          id="btn-add-group"
          className="admin-btn admin-btn-secondary"
          onClick={handleAddGroup}
        >
          + Adicionar Nova Seção
        </button>
      </div>
    </>
  );
}
