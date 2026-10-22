const MACROS = ['calories', 'proteinGrams', 'carbohydrateGrams', 'fatGrams'];

function numeric(value) {
  return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0;
}

function averageAvailable(values) {
  if (!values.length || values.some((value) => !numeric(value))) return null;
  return Math.round(values.reduce((sum, value) => sum + Number(value), 0) / values.length);
}

export function calculatePlanNutrition(plan) {
  const days = Array.isArray(plan?.weekPlan) ? plan.weekPlan : [];
  const dailyValues = (key) => days.map((day) => {
    if (numeric(day?.[key])) return day[key];
    const meals = Array.isArray(day?.meals) ? day.meals : [];
    return meals.length && meals.every((meal) => numeric(meal?.[key]))
      ? meals.reduce((sum, meal) => sum + Number(meal[key]), 0)
      : null;
  });
  const names = { calories: 'totalDailyCalories', proteinGrams: 'proteinGrams', carbohydrateGrams: 'carbohydrateGrams', fatGrams: 'fatGrams' };
  return Object.fromEntries(MACROS.map((key) => {
    const existing = plan?.[names[key]];
    return [key, numeric(existing) ? Number(existing) : averageAvailable(days.length === 7 ? dailyValues(key) : [])];
  }));
}

export function recalculatePlanAfterMealEdit(plan) {
  const weekPlan = (plan?.weekPlan || []).map((day) => {
    const meals = day.meals || [];
    const updated = { ...day };
    for (const key of MACROS) {
      updated[key] = meals.length && meals.every((meal) => numeric(meal?.[key]))
        ? meals.reduce((sum, meal) => sum + Number(meal[key]), 0)
        : null;
    }
    return updated;
  });
  const next = { ...plan, weekPlan };
  const names = { calories: 'totalDailyCalories', proteinGrams: 'proteinGrams', carbohydrateGrams: 'carbohydrateGrams', fatGrams: 'fatGrams' };
  for (const key of MACROS) next[names[key]] = averageAvailable(weekPlan.length === 7 ? weekPlan.map((day) => day[key]) : []);
  return next;
}

const UNIT_ALIASES = {
  g: 'g', gram: 'g', grams: 'g', kg: 'kg', kilogram: 'kg', kilograms: 'kg',
  ml: 'ml', milliliter: 'ml', milliliters: 'ml', l: 'l', liter: 'l', liters: 'l',
  tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp', tbsp: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
  cup: 'cup', cups: 'cup', piece: 'piece', pieces: 'piece', clove: 'clove', cloves: 'clove',
};

export function buildShoppingList(plan) {
  const consolidated = new Map();
  const separate = [];
  (plan?.weekPlan || []).forEach((day) => (day.meals || []).forEach((meal) => (meal.ingredients || []).forEach((ingredient) => {
    const name = String(ingredient?.name || '').trim();
    if (!name) return;
    const quantityKnown = numeric(ingredient.quantity);
    const rawUnit = String(ingredient.unit || '').trim().toLowerCase();
    const unit = UNIT_ALIASES[rawUnit] || rawUnit;
    if (!quantityKnown || !unit) {
      separate.push({ name, quantity: quantityKnown ? Number(ingredient.quantity) : null, unit, count: 1 });
      return;
    }
    const key = `${name.toLocaleLowerCase()}::${unit}`;
    const existing = consolidated.get(key);
    if (existing) existing.quantity += Number(ingredient.quantity);
    else consolidated.set(key, { name, quantity: Number(ingredient.quantity), unit, count: 1 });
  })));
  return [...consolidated.values(), ...separate].sort((a, b) => a.name.localeCompare(b.name));
}

