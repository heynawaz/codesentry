import Link from "next/link";
import { disconnectRepoAction } from "@/app/actions/repositories";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type RepoWithCount = {
  id: string;
  fullName: string;
  lastScannedAt: Date | null;
  _count: { pullRequests: number };
};

export function RepoList({ repos }: { repos: RepoWithCount[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Repository</TableHead>
            <TableHead className="text-right">PRs</TableHead>
            <TableHead className="text-right">Last scanned</TableHead>
            <TableHead className="w-[100px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {repos.map((repo) => (
            <TableRow key={repo.id}>
              <TableCell>
                <Link href={`/dashboard/repositories/${repo.id}`} className="font-medium hover:underline">
                  {repo.fullName}
                </Link>
              </TableCell>
              <TableCell className="text-right">
                <Badge variant="secondary">{repo._count.pullRequests}</Badge>
              </TableCell>
              <TableCell className="text-right text-muted-foreground text-sm">{repo.lastScannedAt ? new Date(repo.lastScannedAt).toLocaleDateString() : "—"}</TableCell>
              <TableCell>
                <form action={disconnectRepoAction}>
                  <input type="hidden" name="repositoryId" value={repo.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    Disconnect
                  </Button>
                </form>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
