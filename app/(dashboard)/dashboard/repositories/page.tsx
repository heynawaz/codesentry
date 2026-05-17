import { auth } from "@/auth";
import { getConnectedRepositories, hasLinkedGitHubAccount } from "@/lib/repositories";
import { ConnectReposButton } from "@/components/dashboard/connect-repos-button";
import { RepoList } from "@/components/dashboard/repo-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, FolderGit2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function RepositoriesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const [repos, hasLinked] = await Promise.all([getConnectedRepositories(session.user.id), hasLinkedGitHubAccount(session.user.id)]);
  const isEmpty = repos.length === 0;

  return (
    <div className="space-y-6">
      {!hasLinked && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>GitHub account not linked</AlertTitle>
          <AlertDescription>
            Your session was created before linking was fixed. You must sign out and sign in again with GitHub to connect repositories.{" "}
            <Link href={`/api/auth/signout?callbackUrl=${encodeURIComponent("/sign-in")}`} className="cursor-pointer underline font-medium">
              Sign out and sign in again
            </Link>
          </AlertDescription>
        </Alert>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Connected Repositories</h1>
        <ConnectReposButton />
      </div>

      {isEmpty ? (
        <Card className="rounded-xl border border-dashed">
          <CardHeader>
            <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
              <FolderGit2 className="size-6 text-muted-foreground" />
            </div>
            <CardTitle>No repositories connected</CardTitle>
            <CardDescription>Connect a GitHub repository to start receiving AI-powered pull request reviews.</CardDescription>
          </CardHeader>
          <CardContent>
            <ConnectReposButton variant="default" />
          </CardContent>
        </Card>
      ) : (
        <RepoList repos={repos} />
      )}
    </div>
  );
}
