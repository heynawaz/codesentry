"use client";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export type ReviewErrorProps = {
  message?: string;
  onRetry?: () => void;
  retryButton?: React.ReactNode;
};

export function ReviewError({
  message = "Review failed or could not be loaded.",
  retryButton,
}: ReviewErrorProps) {
  return (
    <Card className="overflow-hidden border-destructive/30 rounded-2xl bg-destructive/5">
      <div className="border-b border-border/80 px-6 py-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-destructive">
          <AlertCircle className="size-5 shrink-0" />
          Review failed
        </CardTitle>
      </div>
      <CardContent className="flex flex-col gap-4 pt-6">
        <p className="text-sm text-muted-foreground">{message}</p>
        {retryButton && <div>{retryButton}</div>}
      </CardContent>
    </Card>
  );
}
