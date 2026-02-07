"use client";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Sparkles } from "lucide-react";

export function ReviewLoading() {
  return (
    <Card className="overflow-hidden border-border/80 rounded-2xl">
      <div className="border-b border-border/80 bg-muted/30 px-6 py-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Sparkles className="size-5 text-primary" />
          AI Review
        </CardTitle>
      </div>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
        <Spinner className="size-9 text-primary" />
        <span className="text-sm text-muted-foreground">Analyzing pull request…</span>
      </CardContent>
    </Card>
  );
}
