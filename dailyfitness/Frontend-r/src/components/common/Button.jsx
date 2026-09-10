export default function Button({
  children,
  variant = 'primary',
  full = false,
  small = false,
  className = '',
  ...rest
}) {
  const classes = [
    'inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60',
    variant === 'primary'
      ? 'border-emerald-400 bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 hover:-translate-y-0.5 hover:bg-emerald-300'
      : 'border-slate-700 bg-slate-800/80 text-slate-100 hover:border-emerald-400 hover:text-emerald-300',
    full ? 'w-full' : '',
    small ? 'px-3 py-1.5 text-xs' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
