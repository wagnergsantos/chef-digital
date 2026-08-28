export function checkRecipeAudit(recipe) {
  if (!recipe) return { issues: [], isIncomplete: false };

  const hasNoImage = !recipe.image || typeof recipe.image !== 'string' || !recipe.image.trim();
  const hasNoCategory = !recipe.categoria_id && !recipe.category_id;
  const hasNoTimeOrServings = (!recipe.prep_time && !recipe.cook_time) || !recipe.servings;
  const hasNoTags = !recipe.tags || !Array.isArray(recipe.tags) || recipe.tags.length === 0;
  const needsReview = Boolean(
    recipe.tags &&
    Array.isArray(recipe.tags) &&
    recipe.tags.some((t) => typeof t === 'string' && t.trim().toLowerCase() === 'a revisar')
  );

  const issues = [];
  if (hasNoImage) issues.push({ id: 'no-image', label: 'Sem foto', icon: '📷' });
  if (hasNoCategory) issues.push({ id: 'no-category', label: 'Sem categoria', icon: '📁' });
  if (hasNoTimeOrServings) issues.push({ id: 'no-time-servings', label: 'Sem tempo/rend.', icon: '⏱️' });
  if (hasNoTags) issues.push({ id: 'no-tags', label: 'Sem tags', icon: '🏷️' });
  if (needsReview) issues.push({ id: 'needs-review', label: 'A revisar', icon: '🔍' });

  const isIncomplete = issues.length > 0;

  return {
    hasNoImage,
    hasNoCategory,
    hasNoTimeOrServings,
    hasNoTags,
    needsReview,
    isIncomplete,
    issues
  };
}

export function filterRecipesByAudit(recipes = [], auditFilter = 'all') {
  if (!recipes || !Array.isArray(recipes)) return [];
  if (!auditFilter || auditFilter === 'all') return recipes;

  return recipes.filter((r) => {
    const audit = checkRecipeAudit(r);
    switch (auditFilter) {
      case 'no-image':
        return audit.hasNoImage;
      case 'no-category':
        return audit.hasNoCategory;
      case 'no-time-servings':
        return audit.hasNoTimeOrServings;
      case 'no-tags':
        return audit.hasNoTags;
      case 'needs-review':
        return audit.needsReview;
      case 'incomplete':
        return audit.isIncomplete;
      default:
        return true;
    }
  });
}

export function calculateAuditCounts(recipes = []) {
  const counts = {
    all: recipes.length,
    'no-image': 0,
    'no-category': 0,
    'no-time-servings': 0,
    'no-tags': 0,
    'needs-review': 0,
    incomplete: 0
  };

  if (!Array.isArray(recipes)) return counts;

  for (const r of recipes) {
    const audit = checkRecipeAudit(r);
    if (audit.hasNoImage) counts['no-image']++;
    if (audit.hasNoCategory) counts['no-category']++;
    if (audit.hasNoTimeOrServings) counts['no-time-servings']++;
    if (audit.hasNoTags) counts['no-tags']++;
    if (audit.needsReview) counts['needs-review']++;
    if (audit.isIncomplete) counts.incomplete++;
  }

  return counts;
}
