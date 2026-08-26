import { useState, useRef } from 'react';
import { uploadRecipeImage, deleteRecipeImageFromStorage } from '../../api/admin.js';
import { validateImageFile } from '../../logic/image-compression.js';
import adminUi from './AdminUI.module.css';
import styles from './ImageUploadField.module.css';

/**
 * Componente de upload e gerenciamento de imagem de receita no Admin.
 * Suporta drag-and-drop, preview instantâneo, compressão WebP e upload para Supabase Storage.
 */
export function ImageUploadField({
  value = '',
  onChange,
  disabled = false
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine);

  const fileInputRef = useRef(null);

  const handleFileSelection = async (file) => {
    if (!file) return;

    setErrorMsg('');

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
      setErrorMsg('Você está offline. O upload de imagens requer conexão com a internet.');
      return;
    }

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Arquivo de imagem inválido.');
      return;
    }

    setIsUploading(true);
    try {
      const oldImageUrl = value;
      const uploadedUrl = await uploadRecipeImage(file);
      if (onChange) {
        onChange(uploadedUrl);
      }
      if (oldImageUrl && oldImageUrl !== uploadedUrl) {
        deleteRecipeImageFromStorage(oldImageUrl).catch((err) => console.warn('Erro ao limpar imagem antiga:', err));
      }
    } catch (err) {
      console.error('Erro no upload de imagem:', err);
      setErrorMsg(err.message || 'Falha ao processar ou enviar a imagem.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (disabled || isUploading) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isUploading) return;

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelection(file);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileSelection(file);
    }
  };

  const handleRemoveImage = () => {
    setErrorMsg('');
    const oldImageUrl = value;
    if (onChange) {
      onChange('');
    }
    if (oldImageUrl) {
      deleteRecipeImageFromStorage(oldImageUrl).catch((err) => console.warn('Erro ao limpar imagem removida:', err));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFilePicker = () => {
    if (disabled || isUploading) return;
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const hasImage = Boolean(value && value.trim());

  return (
    <div className={styles.wrapper}>
      <label className={adminUi.formLabel} htmlFor="recipe-image-input">
        Foto da Receita
      </label>

      <input
        ref={fileInputRef}
        id="recipe-image-input"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className={styles.hiddenInput}
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        data-testid="file-picker-input"
      />

      {isUploading ? (
        <div className={`${styles.dropzone} ${styles.disabled}`} aria-live="polite">
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner} />
            <span>Otimizando e enviando imagem...</span>
          </div>
        </div>
      ) : hasImage ? (
        <div className={styles.previewCard}>
          <div className={styles.imagePreviewWrapper}>
            <img
              src={value}
              alt="Preview da receita"
              className={styles.imagePreview}
              onError={(e) => {
                e.target.src = '';
                setErrorMsg('Não foi possível carregar o preview da imagem.');
              }}
            />
          </div>
          <div className={styles.previewActions}>
            <span className={styles.imageUrlDisplay} title={value}>
              {value}
            </span>
            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={adminUi.btnSecondary}
                onClick={openFilePicker}
                disabled={disabled}
              >
                Trocar foto
              </button>
              <button
                type="button"
                className={adminUi.btnDanger}
                onClick={handleRemoveImage}
                disabled={disabled}
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`${styles.dropzone} ${isDragOver ? styles.dragOver : ''} ${disabled ? styles.disabled : ''}`}
          onClick={openFilePicker}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openFilePicker()}
          aria-label="Selecionar ou soltar foto da receita"
        >
          <span className={styles.dropzoneIcon} aria-hidden="true">📸</span>
          <span className={styles.dropzoneText}>
            Arraste e solte uma foto aqui ou <strong>clique para escolher</strong>
          </span>
          <span className={styles.dropzoneSubtext}>
            PNG, JPG, WebP até 10MB (otimizada para WebP máx 800px)
          </span>
        </div>
      )}

      {errorMsg && (
        <div className={styles.errorMessage} role="alert">
          ⚠️ {errorMsg}
        </div>
      )}

      {isOffline && !errorMsg && (
        <div className={styles.offlineNotice}>
          ℹ️ Modo offline: reconecte à internet para enviar fotos ao Storage.
        </div>
      )}

      <div>
        <button
          type="button"
          className={styles.manualUrlToggle}
          onClick={() => setShowManualInput(!showManualInput)}
        >
          {showManualInput ? '▲ Ocultar URL manual' : '▼ Inserir caminho ou URL manualmente'}
        </button>

        {showManualInput && (
          <div className={styles.manualUrlInput}>
            <input
              type="text"
              id="recipe-image-manual-url"
              className={adminUi.formInput}
              placeholder="Ex: 10.png ou https://..."
              value={value}
              onChange={(e) => onChange && onChange(e.target.value)}
              disabled={disabled || isUploading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
