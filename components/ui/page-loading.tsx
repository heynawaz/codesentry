import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type PageLoadingProps = {
  message?: string;
  className?: string;
  useSkeleton?: boolean;
};

export function PageLoading({ message = "Loading…", className, useSkeleton = false }: PageLoadingProps) {
  if (useSkeleton) {
    return (
      <div className={cn("flex flex-col gap-4 p-6", className)}>
        <div className="bg-accent animate-pulse h-8 w-48 rounded-md" />
        <div className="bg-accent animate-pulse h-4 w-full max-w-md rounded-md" />
        <div className="mt-6 flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-accent animate-pulse h-12 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className={cn("flex min-h-[200px] flex-col items-center justify-center gap-3 text-muted-foreground", className)}>
      <Spinner className="size-8" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
