import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';

const ICONS = { DIET: '🥗', WORKOUT: '💪', FEEDBACK: '🤖' };

export default function AiHistoryCard({ entries = [] }) {
  return (
    <Card title="AI RESPONSE HISTORY">
      {entries.length === 0 ? (
        <EmptyState icon="🤖" text="No AI responses yet." />
      ) : (
        entries.slice(0, 6).map((r, i) => (
          <div key={i} className="flex items-center justify-between gap-3 border-b border-slate-700 py-4 last:border-b-0 first:pt-0">
            <div>
              <div className="text-sm font-semibold text-slate-100">
                {ICONS[r.type] || '📄'} {r.type} Plan
              </div>
              <div className="mt-1 text-xs text-slate-400">{r.createdAt?.split('T')[0] || 'Recently'}</div>
            </div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
              {r.type}
            </span>
          </div>
        ))
      )}
    </Card>
  );
}
