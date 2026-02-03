import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

export default function UsagePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Usage</h1>
      <Card>
        <CardHeader>
          <Star className="size-10 text-muted-foreground" />
          <CardTitle>Review usage</CardTitle>
          <CardDescription>Track how many AI reviews you&apos;ve used this period.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
