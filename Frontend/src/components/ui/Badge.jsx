const variants = {
  success: 'bg-emerald/10 text-emerald',
  warning: 'bg-yellow-500/10 text-yellow-700',
  danger: 'bg-muted-red/10 text-muted-red',
  info: 'bg-muted-indigo/10 text-muted-indigo',
  neutral: 'bg-soft-stone/50 text-neutral-600',
};

export default function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
