import type { ListingCategory } from "@/types";

interface CategoryGridProps {
  value: ListingCategory | "";
  onChange: (cat: ListingCategory) => void;
}

const CATEGORIES: Array<{ value: ListingCategory; label: string; emoji: string }> = [
  { value: "phones", label: "Phones", emoji: "📱" },
  { value: "wallets", label: "Wallets", emoji: "👛" },
  { value: "bags", label: "Bags", emoji: "🎒" },
  { value: "jewelry", label: "Jewellery", emoji: "💍" },
  { value: "documents", label: "Documents", emoji: "📄" },
  { value: "electronics", label: "Electronics", emoji: "🎧" },
  { value: "pets", label: "Pets", emoji: "🐾" },
  { value: "other", label: "Other", emoji: "📦" },
];

export function CategoryGrid({ value, onChange }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Category">
      {CATEGORIES.map((cat) => {
        const selected = value === cat.value;
        return (
          <button
            key={cat.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(cat.value)}
            className="flex flex-col items-center gap-1 py-3 px-1 rounded-[var(--radius-md)] border transition-all duration-[var(--duration-fast)]"
            style={{
              background: selected ? "var(--color-accent-bg)" : "var(--color-surface)",
              borderColor: selected ? "var(--color-accent)" : "var(--color-border)",
            }}
          >
            <span className="text-2xl">{cat.emoji}</span>
            <span className="text-xs font-medium" style={{ color: selected ? "var(--color-accent)" : "var(--color-text-secondary)" }}>
              {cat.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
