"use client";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export type ReviewEmptyProps = {
  onRunReview?: () => void;
  runReviewButton?: React.ReactNode;
};

export function ReviewEmpty({ runReviewButton }: ReviewEmptyProps) {
  return (
    <Card className="overflow-hidden border-border/80 rounded-2xl">
      <div className="border-b border-border/80 bg-muted/30 px-6 py-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="size-5 text-primary" />
          AI Review
        </CardTitle>
      </div>
      <CardContent className="flex flex-col gap-4 pt-6">
        <p className="text-sm leading-relaxed text-muted-foreground">
          No review yet. Run AI Review to analyze the changes in this PR—code quality,
          security, and secrets.
        </p>
        {runReviewButton && <div>{runReviewButton}</div>}
      </CardContent>
    </Card>
  );
}
