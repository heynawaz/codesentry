"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Github } from "lucide-react";

const buttonClassName = "h-11 w-full gap-2.5 rounded-lg px-5 bg-[#24292f] font-medium text-white shadow-sm transition-colors hover:bg-[#2d333b] focus-visible:ring-[#24292f] dark:bg-[#f0f6fc] dark:text-[#0d1117] dark:hover:bg-[#c9d1d9] dark:focus-visible:ring-[#f0f6fc] disabled:pointer-events-none disabled:opacity-70";

export function SignInButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className={buttonClassName} disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="size-5 shrink-0 animate-spin" aria-hidden />
          Signing in…
        </>
      ) : (
        <>
          <Github className="size-5 shrink-0" aria-hidden />
          Continue with GitHub
        </>
      )}
    </Button>
  );
}
