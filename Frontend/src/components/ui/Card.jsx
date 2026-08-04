export default function Card({ children, className = "", gradient = false, ...props }) {
  const base = gradient
    ? "bg-gradient-to-br from-forest-green to-sage-green rounded-2xl p-5 md:p-6 shadow-card border border-soft-stone"
    : "bg-off-white rounded-2xl p-5 md:p-6 shadow-card border border-soft-stone";

  return (
    <div className={`${base} ${className}`} {...props}>
      {children}
    </div>
  );
}
