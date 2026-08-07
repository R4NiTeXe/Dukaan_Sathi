'use client';

// Reusable avatar: shows the user's profile picture when available, otherwise
// falls back to initials derived from the display name.
const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-sm md:h-10 md:w-10',
  lg: 'h-16 w-16 text-xl',
  xl: 'h-24 w-24 text-3xl',
};

const getInitials = (name = '') => {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return words.map((word) => word.charAt(0).toUpperCase()).join('') || 'DS';
};

export default function Avatar({ src, name, size = 'md', className = '' }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={`${name || 'User'}'s profile picture`}
        className={`${sizes[size]} shrink-0 rounded-full object-cover ${className}`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      aria-label={`${name || 'User'}'s profile picture`}
      className={`bg-forest-green text-warm-ivory flex shrink-0 items-center justify-center rounded-full font-bold ${sizes[size]} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
