export default function Input({ label, icon: Icon, error, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium text-neutral-700">{label}</label>}
      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Icon className="h-4 w-4 text-neutral-400" />
          </div>
        )}
        <input
          className={`bg-warm-ivory border-soft-stone focus:border-sage-green focus:ring-sage-green/20 w-full rounded-xl border px-4 py-3 text-sm transition-all focus:ring-2 focus:outline-none ${
            Icon ? 'pl-10' : ''
          } ${error ? 'border-muted-red' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-muted-red mt-1 text-xs">{error}</p>}
    </div>
  );
}
