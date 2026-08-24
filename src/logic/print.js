// Print helpers: mark which container should be revealed by the
// @media print rules in estilos.css, then trigger the browser's native
// print dialog. The `afterprint` cleanup is registered separately
// (see App.jsx) since it's a page-lifetime concern, not per-call.

export function printRecipe() {
    document.documentElement.dataset.printing = 'recipe';
    window.print();
}

export function printShoppingList() {
    document.documentElement.dataset.printing = 'shopping';
    window.print();
}

export function printPlanner() {
    document.documentElement.dataset.printing = 'planner';
    window.print();
}
