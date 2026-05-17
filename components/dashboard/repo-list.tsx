import Link from "next/link";
import { disconnectRepoAction } from "@/app/actions/repositories";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FolderGit2, ChevronRight } from "lucide-react";

type RepoWithCount = {
  id: string;
  fullName: string;
  lastScannedAt: Date | string | null;
  _count: { pullRequests: number };
};

/** Format date the same on server and client to avoid hydration mismatch. */
function formatDate(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}/${day}/${y}`;
}

export function RepoList({ repos }: { repos: RepoWithCount[] }) {
  return (
    <Card className="rounded-xl border border-border/80 bg-card shadow-sm overflow-hidden py-0">
      <CardContent className="p-0">
        <div className="max-h-[calc(100vh-9rem)] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/80 hover:bg-muted/80">
                <TableHead className="sticky top-0 z-10 h-12 px-6 font-medium text-muted-foreground text-xs uppercase tracking-wider bg-muted border-b border-border">Repository</TableHead>
                <TableHead className="sticky top-0 z-10 w-20 px-4 text-center font-medium text-muted-foreground text-xs uppercase tracking-wider bg-muted border-b border-border">PRs</TableHead>
                <TableHead className="sticky top-0 z-10 w-36 px-4 text-center font-medium text-muted-foreground text-xs uppercase tracking-wider bg-muted border-b border-border">Last scanned</TableHead>
                <TableHead className="sticky top-0 z-10 w-32 px-4 text-center font-medium text-muted-foreground text-xs uppercase tracking-wider bg-muted border-b border-border">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repos.map((repo) => (
                <TableRow key={repo.id} className="group border-b border-border transition-colors hover:bg-muted/30">
                  <TableCell className="px-6 py-4 align-middle">
                    <Link href={`/dashboard/repositories/${repo.id}`} className="flex cursor-pointer items-center gap-3 font-medium text-foreground hover:text-primary transition-colors min-w-0">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/80">
                        <FolderGit2 className="size-4 text-muted-foreground" />
                      </span>
                      <span className="truncate min-w-0">{repo.fullName}</span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 -ml-1 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-center align-middle">
                    <Link href={`/dashboard/repositories/${repo.id}`} className="inline-block cursor-pointer">
                      <Badge variant="secondary" className="font-medium tabular-nums hover:bg-muted">
                        {repo._count.pullRequests}
                      </Badge>
                    </Link>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-center text-sm tabular-nums align-middle">{repo.lastScannedAt ? <span className="text-muted-foreground">{formatDate(repo.lastScannedAt)}</span> : <span className="text-muted-foreground/70 italic">Never</span>}</TableCell>
                  <TableCell className="px-4 py-4 text-center align-middle">
                    <form action={disconnectRepoAction} className="inline-flex justify-center">
                      <input type="hidden" name="repositoryId" value={repo.id} />
                      <Button type="submit" variant="ghost" size="sm" className="shrink-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                        Disconnect
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
