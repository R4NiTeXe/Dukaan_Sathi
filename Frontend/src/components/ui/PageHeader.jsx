export default function PageHeader({ title, description, action, icon: Icon, className = "" }) {
  return (
    <header className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="text-forest-green">
            <Icon className="w-6 h-6" />
          </div>
        )}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 font-heading">
            {title}
          </h1>
          {description && (
            <p className="text-neutral-500 mt-1">{description}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}
