import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "../lib/utils";

const FeaturedBadge = React.forwardRef(({ className, size = "sm", ...props }, ref) => {
  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5 gap-0.5",
    md: "text-xs px-2 py-1 gap-1",
    lg: "text-sm px-3 py-1.5 gap-1.5",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full font-semibold border",
        "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500",
        "text-white border-indigo-400 shadow-sm",
        sizeClasses[size] || sizeClasses.sm,
        className
      )}
      {...props}
    >
      <Star className={cn(
        size === "sm" ? "h-2.5 w-2.5" : size === "lg" ? "h-4 w-4" : "h-3 w-3",
        "fill-white/90"
      )} />
      Mis en avant
    </div>
  );
});
FeaturedBadge.displayName = "FeaturedBadge";

export { FeaturedBadge };