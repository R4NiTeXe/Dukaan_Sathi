export default function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
      {Icon && (
        <div className="bg-soft-stone/30 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <Icon className="h-8 w-8 text-neutral-300" strokeWidth={1.5} />
        </div>
      )}
      {title && <p className="mb-1 font-medium text-neutral-500">{title}</p>}
      {description && <p className="max-w-xs text-sm text-neutral-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
