"use client";

import { syncRepoPrsAction } from "@/app/actions/sync";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";

export function SyncPrsButton({ repositoryId }: { repositoryId: string }) {
  const [loading, setLoading] = useState(false);
  return (
    <form
      action={async () => {
        setLoading(true);
        try {
          await syncRepoPrsAction(repositoryId);
        } finally {
          setLoading(false);
        }
      }}
    >
      <Button type="submit" variant="outline" size="sm" disabled={loading}>
        {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
        Sync PRs
      </Button>
    </form>
  );
}
