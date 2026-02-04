import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/server/better-auth/server";
import { api, HydrateClient } from "@/trpc/server";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await getSession();

  if (session) {
    const workspaces = await api.workspace.getAll();
    if (workspaces.length > 0) {
      redirect(`/${workspaces[0]!.slug}`);
    } else {
      redirect("/workspaces/new");
    }
  }

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground selection:bg-primary/30">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 text-center">
          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem] text-foreground">
              Dev<span className="text-primary">Flow</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The agile Kanban & issue tracker designed for software teams. 
              Built for speed, precision, and collaboration.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            {!session ? (
              <>
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-10 py-6 text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                >
                  <Link href="/signup">Get Started Free</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full border-border bg-background hover:bg-accent px-10 py-6 text-lg font-semibold transition-all"
                >
                  <Link href="/signin">Sign In</Link>
                </Button>
              </>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 w-full max-w-5xl mt-12 border-t border-border pt-12">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-bold text-foreground">Issue Tracking</h3>
              <p className="text-sm text-muted-foreground">Manage tasks with a high-performance interface designed for speed.</p>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-bold text-foreground">Agile Kanban</h3>
              <p className="text-sm text-muted-foreground">Drag-and-drop workflow with optimistic updates for instant feedback.</p>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-bold text-foreground">Team Collaboration</h3>
              <p className="text-sm text-muted-foreground">Workspaces, projects, and cycles to keep your team in sync.</p>
            </div>
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
