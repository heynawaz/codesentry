"use client";

import { getReposForConnect } from "@/app/actions/github";
import { connectReposAction } from "@/app/actions/repositories";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
        <Button variant={variant} className="rounded-lg">
          Connect GitHub Repository
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] sm:max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle>Connect repositories</DialogTitle>
          <DialogDescription>Select repositories to connect for AI code reviews.</DialogDescription>
        </DialogHeader>
        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : loadError ? (
            <Alert variant={loadError === "not_linked" ? "destructive" : "default"} className="rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{loadError === "not_linked" ? "GitHub account not linked" : "Could not load repositories"}</AlertTitle>
              <AlertDescription>{loadError === "not_linked" ? "Sign out and sign in again with GitHub to link your account." : `Failed to load repositories.${fetchMessage ? ` ${fetchMessage}` : ""}`}</AlertDescription>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => onOpen()} className="rounded-lg">
                  Retry
                </Button>
                {loadError === "not_linked" && (
                  <Button variant="default" size="sm" asChild className="rounded-lg">
                    <Link href={`/api/auth/signout?callbackUrl=${encodeURIComponent("/sign-in")}`} className="cursor-pointer">
                      Sign out and try again
                    </Link>
                  </Button>
                )}
              </div>
            </Alert>
          ) : repos.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No repositories found in your GitHub account.</p>
          ) : (
            <ScrollArea className="h-[400px] rounded-lg border">
              <ul className="p-2 space-y-0.5">
                {repos.map((repo) => (
                  <li key={repo.id} className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-muted/50">
                    <Checkbox id={`repo-${repo.id}`} checked={selected.has(repo.id)} onCheckedChange={() => toggle(repo.id)} />
                    <label htmlFor={`repo-${repo.id}`} className="cursor-pointer text-sm flex-1 min-w-0 truncate">
                      {repo.full_name}
                      {repo.private && <span className="ml-1 text-muted-foreground">(private)</span>}
                    </label>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>
        <DialogFooter className="gap-2">
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
