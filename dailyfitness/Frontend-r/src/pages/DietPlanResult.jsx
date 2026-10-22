import { useMemo, useState } from 'react';
import { buildShoppingList, calculatePlanNutrition, recalculatePlanAfterMealEdit } from '../utils/dietPlanUtils';
import Button from '../components/common/Button';

const MEAL_IMAGES = {
  breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=900&q=82',
  brunch: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=900&q=82',
  lunch: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=82',
  dinner: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=82',
  snack: 'https://images.unsplash.com/photo-1505576399274-565b52d4ac71?auto=format&fit=crop&w=900&q=82',
};
const number = (value) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0;
const macroRows = [
  ['calories', 'Energy', 'kcal'],
  ['proteinGrams', 'Protein', 'g'],
  ['carbohydrateGrams', 'Carbs', 'g'],
  ['fatGrams', 'Fat', 'g'],
];
function imageFor(meal) {
  const type = String(meal?.mealType || '').toLowerCase();
  return MEAL_IMAGES[type] || MEAL_IMAGES.snack;
}
function IngredientQuantity({ ingredient }) {
  return number(ingredient.quantity)
    ? `${ingredient.quantity}${ingredient.unit ? ` ${ingredient.unit}` : ''}`
    : 'Amount not specified';
}

export default function DietPlanResult({ plan, onChange, editable = false, onSubstitute, substitutingMeal }) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});
  const weekPlan = Array.isArray(plan?.weekPlan) ? plan.weekPlan : [];
  const dayIndex = Math.min(selectedDay, Math.max(0, weekPlan.length - 1));
  const day = weekPlan[dayIndex];
  const nutrition = useMemo(() => calculatePlanNutrition(plan), [plan]);
  const shoppingList = useMemo(() => buildShoppingList(plan), [plan]);
  if (!plan || !weekPlan.length) return <div className="dp-empty-result">This plan has no structured day data. Generate a new plan to get meal details and nutrition estimates.</div>;

  function updateMeal(dayPosition, mealPosition, field, value) {
    const days = plan.weekPlan.map((item, index) => index !== dayPosition ? item : ({
      ...item,
      meals: item.meals.map((meal, position) => position === mealPosition ? { ...meal, [field]: value } : meal),
    }));
    onChange(recalculatePlanAfterMealEdit({ ...plan, weekPlan: days }));
  }
  function updateIngredient(dayPosition, mealPosition, ingredientPosition, field, value) {
    const days = plan.weekPlan.map((item, index) => index !== dayPosition ? item : ({
      ...item,
      meals: item.meals.map((meal, position) => position !== mealPosition ? meal : ({
        ...meal,
        ingredients: (meal.ingredients || []).map((ingredient, row) => row === ingredientPosition ? { ...ingredient, [field]: value } : ingredient),
      })),
    }));
    onChange(recalculatePlanAfterMealEdit({ ...plan, weekPlan: days }));
  }
  function addIngredient(dayPosition, mealPosition) {
    const days = plan.weekPlan.map((item, index) => index !== dayPosition ? item : ({
      ...item,
      meals: item.meals.map((meal, position) => position !== mealPosition ? meal : ({ ...meal, ingredients: [...(meal.ingredients || []), { name: 'New ingredient', quantity: null, unit: '' }] })),
    }));
    onChange(recalculatePlanAfterMealEdit({ ...plan, weekPlan: days }));
  }
  function removeIngredient(dayPosition, mealPosition, ingredientPosition) {
    const days = plan.weekPlan.map((item, index) => index !== dayPosition ? item : ({
      ...item,
      meals: item.meals.map((meal, position) => position !== mealPosition ? meal : ({ ...meal, ingredients: (meal.ingredients || []).filter((_, row) => row !== ingredientPosition) })),
    }));
    onChange(recalculatePlanAfterMealEdit({ ...plan, weekPlan: days }));
  }

  return <div className="dp-result">
    <div className="dp-plan-overview"><div className="dp-plan-copy"><span className="dp-eyebrow">YOUR SAVED MEAL PLAN</span>{editable ? <input aria-label="Plan summary" className="dp-summary-input" value={plan.summary || ''} onChange={(event) => onChange({ ...plan, summary: event.target.value })}/> : <p>{plan.summary || 'A flexible meal plan built around your preferences.'}</p>}<div className="dp-disclaimer">Nutrition values are estimates. Actual values depend on ingredient quantities, brands, and preparation.</div></div><div className="dp-nutrition-summary"><div className="dp-nutrition-head"><span>DAILY ESTIMATES</span><small>Average from this plan</small></div><div className="dp-macro-grid">{macroRows.map(([key, label, unit]) => <div key={key}><span>{label}</span><strong>{number(nutrition[key]) ? `${Math.round(nutrition[key]).toLocaleString()}${unit === 'g' ? 'g' : ''}` : '—'}</strong>{key !== 'calories' && <small>{number(nutrition[key]) ? 'estimated' : 'not provided'}</small>}</div>)}</div></div></div>

    <div className="dp-day-nav" role="tablist" aria-label="Select plan day">{weekPlan.map((item, index) => <button type="button" role="tab" aria-selected={dayIndex === index} className={dayIndex === index ? 'active' : ''} key={`${item.day}-${index}`} onClick={() => setSelectedDay(index)}><span>{item.day || `Day ${index + 1}`}</span><small>{number(item.calories) ? `${item.calories} kcal` : `${(item.meals || []).length} meals`}</small></button>)}</div>

    {day && <div className="dp-day-heading"><div><span className="dp-eyebrow">DAILY MENU</span><h3>{day.day || `Day ${dayIndex + 1}`}</h3></div><div className="dp-day-totals">{[['calories','kcal'],['proteinGrams','g protein'],['carbohydrateGrams','g carbs'],['fatGrams','g fat']].map(([key,label]) => { const value = number(day[key]) ? day[key] : key === 'calories' && (day.meals || []).length && day.meals.every((meal) => number(meal.calories)) ? day.meals.reduce((sum, meal) => sum + Number(meal.calories), 0) : null; return <span key={key}>{number(value) ? `${Math.round(value)} ${label}` : `${label}: —`}</span>; })}</div></div>}

    {day && <div className="dp-meal-grid">{(day.meals || []).map((meal, mealIndex) => <article className="dp-meal-card" key={`${meal.mealType}-${mealIndex}`}><div className="dp-meal-photo"><img src={imageFor(meal)} alt={`Representative ${meal.mealType || 'meal'} inspiration`} loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/meal-fallback.svg'; }}/><span>Representative image · {meal.mealType || 'meal'}</span><button type="button" disabled={Boolean(substitutingMeal)} onClick={() => onSubstitute?.(dayIndex, mealIndex, '')}>↻ Replace meal</button></div><div className="dp-meal-content"><div className="dp-meal-topline"><span className="dp-meal-type">{meal.mealType || 'Meal'}</span>{number(meal.calories) && <small>{meal.calories} kcal est.</small>}</div>{editable ? <input className="dp-meal-name-input" aria-label={`${meal.mealType} name`} value={meal.name || ''} onChange={(event) => updateMeal(dayIndex, mealIndex, 'name', event.target.value)}/> : <h4>{meal.name || 'Meal name not provided'}</h4>}
      <div className="dp-meal-macros">{[['proteinGrams','P'],['carbohydrateGrams','C'],['fatGrams','F']].filter(([key]) => number(meal[key])).map(([key, label]) => <span key={key}>{label} {meal[key]}g</span>)}</div>
      <div className="dp-ingredients-head"><strong>Ingredients</strong>{editable && <button type="button" onClick={() => addIngredient(dayIndex, mealIndex)}>＋ Add</button>}</div>
      {meal.ingredients?.length ? <ul className="dp-ingredients">{meal.ingredients.map((ingredient, ingredientIndex) => <li key={`${ingredient.name}-${ingredientIndex}`}><span className="dp-ingredient-dot"/>{editable ? <div className="dp-ingredient-edit"><input aria-label="Ingredient name" value={ingredient.name || ''} onChange={(event) => updateIngredient(dayIndex, mealIndex, ingredientIndex, 'name', event.target.value)}/><input aria-label="Ingredient quantity" type="number" min="0" step="any" value={ingredient.quantity ?? ''} onChange={(event) => updateIngredient(dayIndex, mealIndex, ingredientIndex, 'quantity', event.target.value === '' ? null : Number(event.target.value))}/><input aria-label="Ingredient unit" value={ingredient.unit || ''} onChange={(event) => updateIngredient(dayIndex, mealIndex, ingredientIndex, 'unit', event.target.value)}/><button type="button" aria-label="Remove ingredient" onClick={() => removeIngredient(dayIndex, mealIndex, ingredientIndex)}>×</button></div> : <><span>{ingredient.name}</span><small><IngredientQuantity ingredient={ingredient}/></small><button type="button" className="dp-substitute-ingredient" disabled={Boolean(substitutingMeal)} onClick={() => onSubstitute?.(dayIndex, mealIndex, ingredient.name)}>Replace</button></>}</li>)}</ul> : <p className="dp-missing">Ingredient quantities were not provided.</p>}
      {editable ? <textarea className="dp-instructions-edit" aria-label="Preparation instructions" value={meal.instructions || ''} placeholder="Add preparation instructions" onChange={(event) => updateMeal(dayIndex, mealIndex, 'instructions', event.target.value)}/> : meal.instructions && <div className="dp-instructions"><strong>Preparation</strong><p>{meal.instructions}</p></div>}
    </div></article>)}</div>}

    <div className="dp-result-bottom"><button type="button" className="dp-shopping-toggle" onClick={() => setShoppingOpen((open) => !open)} aria-expanded={shoppingOpen}><span>▤</span><span><strong>Shopping list</strong><small>{shoppingList.length} ingredients from this plan</small></span><i>{shoppingOpen ? '−' : '+'}</i></button>{shoppingOpen && <div className="dp-shopping-list">{shoppingList.length ? shoppingList.map((item, index) => { const key = `${item.name}-${item.unit}-${index}`; return <label key={key} className={checkedItems[key] ? 'checked' : ''}><input type="checkbox" checked={Boolean(checkedItems[key])} onChange={(event) => setCheckedItems((current) => ({ ...current, [key]: event.target.checked }))}/><span>{item.name}</span><small>{item.quantity === null ? 'Amount not specified' : `${item.quantity}${item.unit ? ` ${item.unit}` : ''}`}</small></label>; }) : <p>No ingredients were included in the saved plan.</p>}</div>}</div>
    <div className="dp-plan-footer"><span>AI-generated menu · Review ingredient quantities and labels for your needs.</span>{plan.hydrationTip && <span>Hydration note: {plan.hydrationTip}</span>}</div>
  </div>;
}
