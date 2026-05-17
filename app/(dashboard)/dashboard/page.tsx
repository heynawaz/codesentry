import { auth } from "@/auth";
import { getConnectedRepositories, hasLinkedGitHubAccount } from "@/lib/repositories";
import { ConnectReposButton } from "@/components/dashboard/connect-repos-button";
import { RepoList } from "@/components/dashboard/repo-list";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, FolderGit2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const [repos, hasLinked] = await Promise.all([getConnectedRepositories(session.user.id), hasLinkedGitHubAccount(session.user.id)]);
  const isEmpty = repos.length === 0;

  return (
    <div className="space-y-8">
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
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Connected Repositories</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage GitHub repos for AI-powered pull request reviews</p>
        </div>
        <ConnectReposButton />
      </div>

      {isEmpty ? (
        <Card className="rounded-xl border border-dashed overflow-hidden">
          <CardContent className="p-0">
            <Empty className="border-0 rounded-xl min-h-[280px]">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderGit2 />
                </EmptyMedia>
                <EmptyTitle>No repositories connected</EmptyTitle>
                <EmptyDescription>Connect a GitHub repository to start receiving AI-powered pull request reviews.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <ConnectReposButton variant="default" className="rounded-lg" />
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <RepoList repos={repos} />
      )}
    </div>
  );
}
