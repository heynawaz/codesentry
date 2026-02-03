"use client";

import { getReposForConnect } from "@/app/actions/github";
import { connectReposAction } from "@/app/actions/repositories";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";

type Repo = { id: number; full_name: string; name: string; private: boolean };

export function ConnectReposButton({ variant = "outline" }: { variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary" }) {
  const [open, setOpen] = useState(false);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<"not_linked" | "fetch_failed" | null>(null);
  const [fetchMessage, setFetchMessage] = useState<string>("");

  const onOpen = useCallback(async () => {
    setOpen(true);
    setLoading(true);
    setSelected(new Set());
    setLoadError(null);
    setFetchMessage("");
    try {
      const result = await getReposForConnect();
      if (result.ok) {
        setRepos(result.repos);
      } else {
        setLoadError(result.error);
        setFetchMessage(result.error === "fetch_failed" ? result.message : "");
        setRepos([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);
    try {
      const result = await connectReposAction(Array.from(selected));
      if (result.ok) {
        setOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpen() : setOpen(v))}>
      <DialogTrigger asChild>
        <Button variant={variant}>Connect GitHub Repository</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Connect repositories</DialogTitle>
          <DialogDescription>Select repositories to connect for AI code reviews.</DialogDescription>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto rounded-md border p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center gap-4 py-8 text-center text-sm text-muted-foreground">
              <AlertCircle className="size-8" />
              {loadError === "not_linked" ? (
                <>
                  <p>Your GitHub account is not linked. Sign out and sign in again with GitHub to link it.</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => onOpen()}>
                      Retry
                    </Button>
                    <Button variant="default" size="sm" asChild>
                      <Link href={`/api/auth/signout?callbackUrl=${encodeURIComponent("/sign-in")}`}>Sign out and try again</Link>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p>Failed to load repositories.{fetchMessage ? ` ${fetchMessage}` : ""}</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => onOpen()}>
                    Retry
                  </Button>
                </>
              )}
            </div>
          ) : repos.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No repositories found.</div>
          ) : (
            <ul className="space-y-1">
              {repos.map((repo) => (
                <li key={repo.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50">
                  <Checkbox id={`repo-${repo.id}`} checked={selected.has(repo.id)} onCheckedChange={() => toggle(repo.id)} />
                  <label htmlFor={`repo-${repo.id}`} className="cursor-pointer text-sm">
                    {repo.full_name}
                    {repo.private && <span className="ml-1 text-muted-foreground">(private)</span>}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={selected.size === 0 || submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Connecting…
              </>
            ) : (
              `Connect ${selected.size} repo${selected.size === 1 ? "" : "s"}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
