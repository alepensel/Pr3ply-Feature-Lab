import { cn } from "@/lib/utils";
import logoBlack from "@/assets/pr3ply-logo-black.png.asset.json";
import logoWhite from "@/assets/pr3ply-logo-white.png.asset.json";

const BrandMark = ({
  className,
  variant = "black",
}: {
  className?: string;
  variant?: "black" | "white";
}) => {
  const src = variant === "white" ? logoWhite.url : logoBlack.url;
  return (
    <img
      src={src}
      alt="Pr3ply"
      className={cn("h-8 w-auto select-none", className)}
      draggable={false}
    />
  );
};

export default BrandMark;