import { useState, useEffect } from 'react';
import { getSession, onAuthStateChange, signOut } from './auth/session.js';
import { LoginForm } from './components/admin/LoginForm.jsx';
import { CategoryPicker } from './components/admin/CategoryPicker.jsx';
import { IngredientsEditor } from './components/admin/IngredientsEditor.jsx';
import { StepsEditor } from './components/admin/StepsEditor.jsx';
import { TagInput } from './components/admin/TagInput.jsx';
import { RecipeSearchCombobox } from './components/admin/RecipeSearchCombobox.jsx';
import { AIImportBox } from './components/admin/AIImportBox.jsx';
import {
  fetchCategories,
  fetchRecipesList,
  fetchRecipeDetails,
  fetchExistingTags,
  deleteRecipeRpc,
  saveRecipeRpc
} from './api/admin.js';
import { enfileirarSincronizacao } from './cache/db.js';
import { validateRecipePayloadData, buildRecipePayload } from './logic/admin-parser.js';

const INITIAL_FORM = {
  title: '',
  emoji: '🍲',
  image: '',
  servings: '',
  prep_time: '',
  cook_time: '',
  author: '',
  source_url: '',
  tips: '',
  category_id: ''
};

export function AdminApp() {
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Aux state
  const [categories, setCategories] = useState([]);
  const [recipesList, setRecipesList] = useState([]);
  const [allExistingTags, setAllExistingTags] = useState([]);

  // Edit Mode state
  const [selectedComboboxId, setSelectedComboboxId] = useState(null);
  const [editingRecipeId, setEditingRecipeId] = useState(null);
  const [editingRecipeTitle, setEditingRecipeTitle] = useState('');
  const [loadingLoad, setLoadingLoad] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // Form state
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [ingredients, setIngredients] = useState([{ name: '', qty: '', unit: '' }]);
  const [steps, setSteps] = useState([{ step_text: '' }]);
  const [recipeTags, setRecipeTags] = useState([]);

  // UI state
  const [saveErrorMsg, setSaveErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSession().then((sess) => {
      setSession(sess);
      setLoadingAuth(false);
    });

    const unsubscribe = onAuthStateChange((sess) => {
      setSession(sess);
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    try {
      const [cats, recs, tags] = await Promise.all([
        fetchCategories(),
        fetchRecipesList(),
        fetchExistingTags()
      ]);
      setCategories(cats);
      setRecipesList(recs);
      setAllExistingTags(tags);
    } catch (err) {
      console.error('Erro ao carregar dados iniciais do admin:', err);
    }
  };

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setIngredients([{ name: '', qty: '', unit: '' }]);
    setSteps([{ step_text: '' }]);
    setRecipeTags([]);
    setEditingRecipeId(null);
    setEditingRecipeTitle('');
    setSelectedComboboxId(null);
    setSaveErrorMsg('');
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLoadRecipe = async (id) => {
    if (!id) return;
    setLoadingLoad(true);
    try {
      const details = await fetchRecipeDetails(id);
      const r = details.recipe;

      setFormData({
        title: r.title || '',
        emoji: r.emoji || '🍲',
        image: r.image || '',
        servings: r.servings !== null && r.servings !== undefined ? String(r.servings) : '',
        prep_time: r.prep_time !== null && r.prep_time !== undefined ? String(r.prep_time) : '',
        cook_time: r.cook_time !== null && r.cook_time !== undefined ? String(r.cook_time) : '',
        author: r.author || '',
        source_url: r.source_url || '',
        tips: r.tips || '',
        category_id: r.categoria_id ? String(r.categoria_id) : ''
      });

      setIngredients(
        details.ingredients.length > 0
          ? details.ingredients.map((i) => ({ name: i.name, qty: i.qty, unit: i.unit }))
          : [{ name: '', qty: '', unit: '' }]
      );

      setSteps(
        details.steps.length > 0
          ? details.steps.map((s) => ({ step_text: s.step_text }))
          : [{ step_text: '' }]
      );

      setRecipeTags(details.tags);

      setEditingRecipeId(id);
      setEditingRecipeTitle(r.title);
      document.getElementById('recipe-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      console.error('Erro ao carregar receita para edição:', err);
      alert('Erro ao carregar receita: ' + err.message);
    } finally {
      setLoadingLoad(false);
    }
  };

  const handleDeleteRecipe = async (id, titleText) => {
    if (!id) {
      alert('Selecione uma receita para excluir.');
      return;
    }
    const cleanTitle = (titleText || `ID ${id}`).replace(/^\S+\s/, '');
    const confirmed = confirm(`Tem certeza que deseja excluir "${cleanTitle}"?\n\nEssa ação é irreversível.`);
    if (!confirmed) return;

    setLoadingDelete(true);
    try {
      await deleteRecipeRpc(id);
      if (editingRecipeId === id) {
        resetForm();
      }
      setRecipesList((prev) => prev.filter((r) => r.id !== id));
      setSelectedComboboxId(null);
      alert('Receita excluída com sucesso.');
    } catch (err) {
      console.error('Erro ao excluir receita:', err);
      alert('Erro ao excluir: ' + err.message);
    } finally {
      setLoadingDelete(false);
    }
  };

  const handleAIImportSuccess = (imported) => {
    let matchedCategoryId = null;
    if (imported.category && categories.length > 0) {
      const catKey = String(imported.category).toLowerCase().trim();
      // 1. Chave exata
      const matchExact = categories.find((c) => c.key && c.key.toLowerCase().trim() === catKey);
      if (matchExact) {
        matchedCategoryId = String(matchExact.id);
      } else {
        // 2. Rótulo ou inclusão
        const matchPartial = categories.find(
          (c) => c.label.toLowerCase().includes(catKey) || catKey.includes((c.key || '').toLowerCase())
        );
        if (matchPartial) {
          matchedCategoryId = String(matchPartial.id);
        } else if (categories.length > 0) {
          // 3. Fallback primeira categoria
          matchedCategoryId = String(categories[0].id);
        }
      }
    }

    setFormData((prev) => ({
      ...prev,
      title: imported.title || prev.title,
      emoji: imported.emoji || prev.emoji,
      image: imported.image || prev.image,
      tips: imported.tips || prev.tips,
      servings: imported.servings !== undefined && imported.servings !== null ? String(imported.servings) : prev.servings,
      prep_time: imported.prep_time !== undefined && imported.prep_time !== null ? String(imported.prep_time) : prev.prep_time,
      cook_time: imported.cook_time !== undefined && imported.cook_time !== null ? String(imported.cook_time) : prev.cook_time,
      source_url: imported.source_url || prev.source_url,
      author: imported.author || prev.author,
      ...(matchedCategoryId ? { category_id: matchedCategoryId } : {})
    }));

    if (Array.isArray(imported.tags) && imported.tags.length > 0) {
      setRecipeTags([...imported.tags]);
    }

    if (Array.isArray(imported.ingredients) && imported.ingredients.length > 0) {
      setIngredients(
        imported.ingredients.map((ing) => ({
          name: ing.name || '',
          qty: ing.qty !== undefined && ing.qty !== null ? ing.qty : '',
          unit: ing.unit || ''
        }))
      );
    }

    if (Array.isArray(imported.steps) && imported.steps.length > 0) {
      setSteps(
        imported.steps.map((s) => ({
          step_text: typeof s === 'string' ? s : s.step_text || ''
        }))
      );
    }
  };

  const handleSaveRecipe = async (e) => {
    e.preventDefault();
    setSaveErrorMsg('');

    const currentData = {
      ...formData,
      selectedCategoryId: formData.category_id ? parseInt(formData.category_id, 10) : null
    };

    const validation = validateRecipePayloadData(currentData, ingredients, steps);
    if (!validation.isValid) {
      setSaveErrorMsg(validation.error);
      return;
    }

    setSaving(true);

    try {
      const selectedCategory = categories.find((c) => String(c.id) === String(formData.category_id));
      const payload = buildRecipePayload({
        id: editingRecipeId,
        ...currentData,
        selectedCategoryKey: selectedCategory?.key || '',
        tags: recipeTags,
        validIngredients: validation.validIngredients,
        validSteps: validation.validSteps
      });

      if (!navigator.onLine) {
        await enfileirarSincronizacao(payload);
        alert('Você está offline! A receita foi salva na fila e será sincronizada quando houver conexão.');
        resetForm();
      } else {
        await saveRecipeRpc(payload);
        const isEdit = !!editingRecipeId;
        alert(isEdit ? 'Receita atualizada com sucesso!' : 'Receita salva com sucesso!');
        await loadData();
        resetForm();
      }
    } catch (err) {
      console.error('Erro ao salvar receita:', err);
      setSaveErrorMsg('Erro ao salvar receita: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingAuth) {
    return null;
  }

  if (!session) {
    return <LoginForm />;
  }

  return (
    <form id="admin-panel" className="max-w-2xl mx-auto admin-card mb-20" onSubmit={handleSaveRecipe}>
      <div className="admin-header-flex mb-6">
        <h2 className="section-title" style={{ margin: 0, border: 'none', padding: 0 }}>
          Painel de Receitas
        </h2>
        <button
          type="button"
          id="btn-logout"
          className="admin-btn admin-btn-secondary"
          onClick={() => signOut()}
        >
          Sair
        </button>
      </div>

      <RecipeSearchCombobox
        recipes={recipesList}
        selectedRecipeId={selectedComboboxId}
        onSelectRecipe={setSelectedComboboxId}
        onLoadRecipe={handleLoadRecipe}
        onDeleteRecipe={handleDeleteRecipe}
        loadingLoad={loadingLoad}
        loadingDelete={loadingDelete}
      />

      {editingRecipeId && (
        <div
          id="edit-mode-banner"
          className="admin-edit-banner"
          style={{ display: 'flex' }}
          role="status"
          aria-live="polite"
        >
          <span className="admin-edit-banner-text">
            ✏️ <span id="edit-mode-title">Editando: "{editingRecipeTitle}"</span>
          </span>
          <button
            type="button"
            id="btn-new-recipe"
            className="admin-btn-new-recipe"
            aria-label="Cancelar edição e criar nova receita"
            onClick={resetForm}
          >
            + Nova Receita
          </button>
        </div>
      )}

      <AIImportBox onImportSuccess={handleAIImportSuccess} />

      <div className="form-group">
        <label className="form-label" htmlFor="recipe-title">
          Título da Receita
        </label>
        <input
          type="text"
          id="recipe-title"
          className="form-input"
          placeholder="Ex: Risoto de Alho Poró"
          required
          value={formData.title}
          onChange={(e) => handleFieldChange('title', e.target.value)}
        />
      </div>

      <div className="admin-form-grid-2">
        <div className="form-group">
          <label className="form-label" htmlFor="recipe-emoji">
            Emoji
          </label>
          <input
            type="text"
            id="recipe-emoji"
            className="form-input"
            placeholder="🍲"
            value={formData.emoji}
            onChange={(e) => handleFieldChange('emoji', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="recipe-image">
            Arquivo de Imagem (opcional)
          </label>
          <input
            type="text"
            id="recipe-image"
            className="form-input"
            placeholder="Ex: 10.png"
            value={formData.image}
            onChange={(e) => handleFieldChange('image', e.target.value)}
          />
        </div>
      </div>

      <div className="admin-form-grid-2">
        <div className="form-group">
          <label className="form-label" htmlFor="recipe-servings">
            Rendimento (porções)
          </label>
          <input
            type="number"
            id="recipe-servings"
            className="form-input"
            placeholder="Ex: 4"
            min="1"
            value={formData.servings}
            onChange={(e) => handleFieldChange('servings', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="recipe-prep-time">
            Tempo de Preparo (min)
          </label>
          <input
            type="number"
            id="recipe-prep-time"
            className="form-input"
            placeholder="Ex: 15"
            min="0"
            value={formData.prep_time}
            onChange={(e) => handleFieldChange('prep_time', e.target.value)}
          />
        </div>
      </div>

      <div className="admin-form-grid-2">
        <div className="form-group">
          <label className="form-label" htmlFor="recipe-cook-time">
            Tempo de Cozimento (min)
          </label>
          <input
            type="number"
            id="recipe-cook-time"
            className="form-input"
            placeholder="Ex: 45"
            min="0"
            value={formData.cook_time}
            onChange={(e) => handleFieldChange('cook_time', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="recipe-author">
            Autor / Fonte
          </label>
          <input
            type="text"
            id="recipe-author"
            className="form-input"
            placeholder="Ex: Rita Lobo / Panelinha"
            value={formData.author}
            onChange={(e) => handleFieldChange('author', e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="recipe-source-url">
          URL da Fonte Original (opcional)
        </label>
        <input
          type="url"
          id="recipe-source-url"
          className="form-input"
          placeholder="https://..."
          value={formData.source_url}
          onChange={(e) => handleFieldChange('source_url', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="recipe-tips">
          Dica rápida (opcional)
        </label>
        <input
          type="text"
          id="recipe-tips"
          className="form-input"
          placeholder="Ex: Sirva bem quente com parmesão"
          value={formData.tips}
          onChange={(e) => handleFieldChange('tips', e.target.value)}
        />
      </div>

      <CategoryPicker
        categories={categories}
        selectedCategoryId={formData.category_id}
        onChange={(catId) => handleFieldChange('category_id', catId)}
      />

      <TagInput
        tags={recipeTags}
        allExistingTags={allExistingTags}
        onChange={setRecipeTags}
      />

      <IngredientsEditor
        ingredients={ingredients}
        onChange={setIngredients}
        onAdd={() => setIngredients((prev) => [...prev, { name: '', qty: '', unit: '' }])}
      />

      <StepsEditor
        steps={steps}
        onChange={setSteps}
        onAdd={() => setSteps((prev) => [...prev, { step_text: '' }])}
      />

      <div className="form-group" style={{ marginTop: '32px' }}>
        {saveErrorMsg && (
          <div id="recipe-error" className="admin-error-box" style={{ display: 'block' }}>
            {saveErrorMsg}
          </div>
        )}
        <button
          type="submit"
          id="btn-save"
          className={`admin-btn admin-btn-primary admin-btn-full ${
            editingRecipeId ? 'admin-btn-success-edit' : 'admin-btn-success'
          }`}
          aria-label={editingRecipeId ? 'Salvar alterações da receita' : 'Salvar receita'}
          disabled={saving}
        >
          {saving
            ? 'Salvando...'
            : editingRecipeId
            ? 'Salvar Alterações'
            : 'Publicar Receita'}
        </button>
      </div>
    </form>
  );
}
