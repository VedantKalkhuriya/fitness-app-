export default function ExerciseRow({ exercise, onChange, onRemove }) {
  function update(field) {
    return (e) => onChange({ ...exercise, [field]: e.target.value });
  }

  return (
    <div className="grid grid-cols-[minmax(0,2fr)_80px_80px_80px_minmax(0,1.2fr)_36px] gap-2 rounded-xl border border-slate-700 bg-slate-800/70 p-2">
      <input
        type="text"
        placeholder="Exercise name"
        value={exercise.exerciseName}
        onChange={update('exerciseName')}
        className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
      />
      <input
        type="number"
        placeholder="4"
        value={exercise.sets}
        onChange={update('sets')}
        className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
      />
      <input
        type="number"
        placeholder="10"
        value={exercise.reps}
        onChange={update('reps')}
        className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
      />
      <input
        type="number"
        placeholder="0"
        value={exercise.weightKg}
        onChange={update('weightKg')}
        className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
      />
      <input
        type="text"
        placeholder="Notes"
        value={exercise.notes}
        onChange={update('notes')}
        className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
      />
      <button
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-base font-semibold text-rose-300 transition hover:bg-rose-500/20"
        type="button"
        onClick={onRemove}
      >
        ×
      </button>
    </div>
  );
}
