import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

interface TableFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  resultCount?: number;
}

export const TableFilters = ({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  filterValues = {},
  onFilterChange,
  resultCount,
}: TableFiltersProps) => {
  const hasActiveFilters = search || Object.values(filterValues).some(v => v && v !== "all");

  const clearAll = () => {
    onSearchChange("");
    filters.forEach(f => onFilterChange?.(f.key, "all"));
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      {filters.map((filter) => (
        <Select
          key={filter.key}
          value={filterValues[filter.key] || "all"}
          onValueChange={(v) => onFilterChange?.(filter.key, v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {filter.label}</SelectItem>
            {filter.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs text-muted-foreground">
          <X className="mr-1 h-3 w-3" />Clear
        </Button>
      )}
      {resultCount !== undefined && (
        <span className="text-xs text-muted-foreground ml-auto">{resultCount} result{resultCount !== 1 ? "s" : ""}</span>
      )}
    </div>
  );
};
