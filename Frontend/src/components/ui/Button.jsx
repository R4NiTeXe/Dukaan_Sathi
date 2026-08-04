import { Loader2 } from "lucide-react";

const variants = {
  primary:
    "bg-forest-green text-warm-ivory shadow-button hover:bg-forest-green/90",
  secondary:
    "bg-off-white border border-soft-stone text-neutral-700 hover:bg-soft-stone/50",
  ghost:
    "text-neutral-500 hover:text-neutral-900 hover:bg-soft-stone/50",
  danger:
    "bg-muted-red/10 text-muted-red border border-muted-red/20 hover:bg-muted-red/20",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-sm",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
