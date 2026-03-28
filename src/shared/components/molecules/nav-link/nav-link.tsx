import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
};

export function NavLink({ icon: Icon, label, active, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"
          : "text-muted-foreground hover:bg-[hsl(var(--accent))]"
      )}
    >
      <Icon className="size-4" />
      <span>{label}</span>
    </button>
  );
}
