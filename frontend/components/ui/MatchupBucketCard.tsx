import { PokemonTypeBadge } from "@/components/ui/PokemonTypeBadge";

interface MatchupBucketCardProps {
  title: string;
  multiplier: string;
  items: string[];
  tone: "danger" | "success" | "neutral";
  compactSummary?: string;
  emptyLabel?: string;
}

export default function MatchupBucketCard({
  title,
  multiplier,
  items,
  tone,
  compactSummary,
  emptyLabel = "None",
}: MatchupBucketCardProps) {
  return (
    <section className="weakness-bucket panel-soft">
      <div className="weakness-bucket-header">
        <div className="min-w-0">
          <p className="weakness-bucket-label">{title}</p>
          <h3 className="weakness-bucket-value">{multiplier}</h3>
        </div>
        <span className={`weakness-bucket-count weakness-bucket-count--${tone}`}>{items.length}</span>
      </div>
      {compactSummary ? (
        <p className="weakness-bucket-summary">{compactSummary}</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.length > 0 ? (
            items.map((type) => <PokemonTypeBadge key={`${title}-${type}`} pokemonType={type} size="md" />)
          ) : (
            <span className="weakness-empty-chip">{emptyLabel}</span>
          )}
        </div>
      )}
    </section>
  );
}
