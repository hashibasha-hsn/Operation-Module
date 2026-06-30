import { cn } from "@/lib/utils";
import { PLATFORM_INITIAL } from "@/lib/branding";

type PlatformMarkProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-10 w-10 rounded-lg text-lg",
  md: "h-12 w-12 rounded-xl text-xl",
  lg: "h-16 w-16 rounded-2xl text-2xl",
};

export default function PlatformMark({ size = "md", className }: PlatformMarkProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center border border-sky-400/25 bg-gradient-to-br from-sky-500/20 to-cyan-500/10 font-bold text-sky-700 shadow-sm shadow-sky-500/10",
        sizeClasses[size],
        className,
      )}
    >
      {PLATFORM_INITIAL}
    </div>
  );
}
