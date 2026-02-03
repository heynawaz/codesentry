import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookMarked } from "lucide-react";

export default function ReviewsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Reviews</h1>
      <Card>
        <CardHeader>
          <BookMarked className="size-10 text-muted-foreground" />
          <CardTitle>AI code reviews</CardTitle>
          <CardDescription>Run and view AI-generated reviews for your pull requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Select a repository and pull request to start a review.</p>
        </CardContent>
      </Card>
    </div>
  );
}
