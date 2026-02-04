import { redirect } from "next/navigation";
import { getSession } from "@/server/better-auth/server";
import { api } from "@/trpc/server";
import { WorkspaceSidebar } from "@/components/workspace-sidebar";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  try {
    const workspace = await api.workspace.getBySlug({ slug: workspaceSlug });

    return (
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <WorkspaceSidebar workspace={workspace} />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    );
  } catch {
    // If workspace not found or no access, redirect to home
    redirect("/");
  }
}
