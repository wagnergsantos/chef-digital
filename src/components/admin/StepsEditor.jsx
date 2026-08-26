import adminUi from './AdminUI.module.css';
import styles from './StepsEditor.module.css';

function DeleteRowButton({ onClick, ariaLabel }) {
  return (
    <button
      type="button"
      className={adminUi.btnDeleteRow}
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

export function StepsEditor({ steps, onChange, onAdd }) {
  const handleItemChange = (index, value) => {
    const updated = steps.map((item, i) => {
      if (i === index) {
        return { ...item, step_text: value };
      }
      return item;
    });
    onChange(updated);
  };

  const handleRemove = (index) => {
    const updated = steps.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <>
      <h3 className={adminUi.sectionTitle}>Modo de Preparo</h3>
      <div id="steps-list" className="mb-4">
        {steps.map((step, index) => (
          <div key={index} className={styles.stepRow}>
            <textarea
              className={`${adminUi.formInput} ${styles.stepText}`}
              placeholder={`Passo ${index + 1}...`}
              required
              rows={2}
              value={step.step_text || ''}
              aria-label={`Texto do passo ${index + 1}`}
              onChange={(e) => handleItemChange(index, e.target.value)}
            />
            <DeleteRowButton
              onClick={() => handleRemove(index)}
              ariaLabel={`Remover passo ${index + 1}`}
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        id="btn-add-step"
        className={`${adminUi.btn} ${adminUi.btnSecondary}`}
        onClick={onAdd}
      >
        + Adicionar Passo
      </button>
    </>
  );
}
