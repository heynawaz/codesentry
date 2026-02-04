import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function MorePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">More</h1>
      <Card>
        <CardHeader>
          <CardTitle>More</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">Content coming soon.</CardContent>
      </Card>
    </div>
  );
}
