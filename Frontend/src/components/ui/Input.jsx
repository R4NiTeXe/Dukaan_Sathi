export default function Input({
  label,
  icon: Icon,
  error,
  className = "",
  ...props
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-neutral-700">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-4 w-4 text-neutral-400" />
          </div>
        )}
        <input
          className={`w-full px-4 py-3 bg-warm-ivory border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green focus:ring-2 focus:ring-sage-green/20 transition-all ${
            Icon ? "pl-10" : ""
          } ${error ? "border-muted-red" : ""} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-muted-red mt-1">{error}</p>
      )}
    </div>
  );
}
