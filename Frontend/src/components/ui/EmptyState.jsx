export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-soft-stone/30 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-neutral-300" strokeWidth={1.5} />
        </div>
      )}
      {title && (
        <p className="text-neutral-500 font-medium mb-1">{title}</p>
      )}
      {description && (
        <p className="text-neutral-400 text-sm max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
