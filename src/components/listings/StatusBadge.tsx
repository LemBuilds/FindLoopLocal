import { Badge } from "@/components/ui/Badge";
import type { ListingType, ListingStatus } from "@/types";

interface StatusBadgeProps {
  type: ListingType;
  status: ListingStatus;
}

export function StatusBadge({ type, status }: StatusBadgeProps) {
  if (status === "recovered") return <Badge label="Recovered" variant="found" />;
  if (status === "closed") return <Badge label="Closed" variant="muted" />;
  return type === "found"
    ? <Badge label="Found" variant="found" />
    : <Badge label="Lost" variant="lost" />;
}
