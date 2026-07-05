import { cn } from "@/lib/utils";

const BrandMark = ({ className }: { className?: string }) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-extrabold tracking-normal text-foreground",
        className
      )}
      aria-label="Pr3ply"
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        P3
      </span>
      <span>Pr3ply</span>
    </span>
  );
};

export default BrandMark;