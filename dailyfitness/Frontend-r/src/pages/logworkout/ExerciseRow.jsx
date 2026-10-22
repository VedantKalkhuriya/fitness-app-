export default function ExerciseRow({ exercise, index, onUpdate, onSetChange, onAddSet, onRemoveSet, onRemove, onStartRest, restSeconds }) {
  return (
    <article className="lw-exercise-card">
      <div className="lw-exercise-heading">
        <span className="lw-exercise-index">{String(index + 1).padStart(2, '0')}</span>
        <label className="lw-exercise-name"><span className="lw-visually-hidden">Exercise name</span><input value={exercise.exerciseName} onChange={(event) => onUpdate('exerciseName', event.target.value)} placeholder="Search or name an exercise" list="fitai-exercise-catalog" required maxLength={150}/></label>
        <span className="lw-set-count">{exercise.setRows.filter((set) => set.completed).length}/{exercise.setRows.length} sets</span>
        <button className="lw-remove-exercise" type="button" onClick={onRemove} aria-label={`Remove ${exercise.exerciseName || 'exercise'}`}>×</button>
      </div>
      <div className="lw-set-head"><span>SET</span><span>WEIGHT (KG)</span><span>REPS</span><span>DONE</span><span/></div>
      <div className="lw-set-list">
        {exercise.setRows.map((set, setIndex) => <div className={`lw-set-row ${set.completed ? 'complete' : ''}`} key={set.id}>
          <span className="lw-set-number">{String(setIndex + 1).padStart(2, '0')}</span>
          <label><span className="lw-mobile-label">Weight · kg</span><input aria-label={`Set ${setIndex + 1} weight in kilograms`} type="number" min="0" max="2000" step="0.25" inputMode="decimal" value={set.weightKg} onChange={(event) => onSetChange(set.id, 'weightKg', event.target.value)} placeholder="0"/></label>
          <label><span className="lw-mobile-label">Reps</span><input aria-label={`Set ${setIndex + 1} repetitions`} type="number" min="1" max="1000" inputMode="numeric" value={set.reps} onChange={(event) => onSetChange(set.id, 'reps', event.target.value)} placeholder="10"/></label>
          <label className="lw-complete-control"><span className="lw-mobile-label">Completed</span><input type="checkbox" checked={set.completed} onChange={(event) => onSetChange(set.id, 'completed', event.target.checked)} aria-label={`Mark set ${setIndex + 1} complete`}/><span className="lw-checkmark">✓</span></label>
          <button className="lw-remove-set" type="button" onClick={() => onRemoveSet(set.id)} aria-label={`Remove set ${setIndex + 1}`} disabled={exercise.setRows.length === 1}>×</button>
        </div>)}
      </div>
      <div className="lw-exercise-footer"><button type="button" className="lw-text-action" onClick={onAddSet}>＋ Add set</button>{restSeconds > 0 && <button type="button" className="lw-text-action" onClick={() => onStartRest(restSeconds)}>Start {restSeconds}s rest timer</button>}</div>
    </article>
  );
}
