export default function EmptyState({ icon = '📄', text = 'Nothing here yet.' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="text-4xl opacity-60">{icon}</div>
      <div className="text-sm text-slate-400">{text}</div>
    </div>
  );
}
