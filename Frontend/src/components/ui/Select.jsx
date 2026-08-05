export default function Select({ label, options = [], className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium text-neutral-700">{label}</label>}
      <select
        className={`bg-warm-ivory border-soft-stone focus:border-sage-green focus:ring-sage-green/20 w-full rounded-xl border px-4 py-3 text-sm text-neutral-700 transition-all focus:ring-2 focus:outline-none ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
