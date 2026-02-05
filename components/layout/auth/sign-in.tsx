import { auth, signIn } from "@/auth";
import { SignInButton } from "@/components/layout/auth/sign-in-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ArrowRight, FileCode2, MessageSquare, Shield, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

export default async function SignIn() {
  const session = await auth();

  if (session?.user) redirect("/");

  return (
    <>
      {/* Left: Hero / value panel — hidden on small screens */}
      <aside className="relative hidden min-w-0 flex-col justify-between overflow-hidden border-r border-border/40 bg-muted/30 px-10 pb-10 pt-10 lg:flex lg:px-14 lg:pb-14 lg:pt-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
          aria-hidden
        />
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm" aria-hidden>
              <Shield className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold tracking-tight">CodeSentry</span>
          </div>
          <div className="mt-12 flex flex-1 flex-col justify-center lg:mt-16">
            <div className="max-w-md space-y-6">
              <h1 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">AI-powered pull request reviews</h1>
              <p className="text-base leading-relaxed text-muted-foreground">Get deep analysis, actionable feedback, and smart suggestions on every PR—powered by OpenAI and built for GitHub.</p>
              <ul className="flex flex-col gap-4 pt-1">
                {[
                  {
                    icon: FileCode2,
                    text: "Full diff analysis and code quality insights",
                  },
                  {
                    icon: MessageSquare,
                    text: "Structured feedback and review comments",
                  },
                  {
                    icon: Sparkles,
                    text: "Suggestions and best-practice recommendations",
                  },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-sm leading-relaxed text-muted-foreground">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/80 text-foreground shadow-sm">
                      <Icon className="h-4 w-4" />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="relative mt-8 flex shrink-0 items-center gap-2 text-sm text-muted-foreground lg:mt-10">
          <span>Secure OAuth with GitHub</span>
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        </div>
      </aside>

      {/* Right: Sign-in panel */}
      <main className="relative flex flex-col items-center justify-center bg-background p-6 sm:p-8 lg:border-l lg:border-border/40 lg:p-12">
        <div className="absolute right-4 top-4 lg:right-6 lg:top-6">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-[400px]">
          <div className="space-y-6">
            <div className="space-y-1.5">
              <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
              <p className="text-sm text-muted-foreground">Sign in with GitHub to start reviewing pull requests</p>
            </div>

            <div className="rounded-xl">
              <form
                action={async () => {
                  "use server";
                  await signIn("github");
                }}
              >
                <SignInButton />
              </form>
            </div>

            <p className="text-center text-xs leading-relaxed text-muted-foreground">By continuing, you allow CodeSentry to access your GitHub repositories for PR analysis.</p>
          </div>
        </div>
      </main>
    </>
  );
}
