export default function PageHeader({ title, description, action, icon: Icon, className = '' }) {
  return (
    <header
      className={`flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center ${className}`}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="text-forest-green">
            <Icon className="h-6 w-6" />
          </div>
        )}
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
            {title}
          </h1>
          {description && <p className="mt-1 text-neutral-500">{description}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}
