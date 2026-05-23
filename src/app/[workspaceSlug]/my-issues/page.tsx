import { type Metadata } from "next";
import { api } from "@/trpc/server";
import { getSession } from "@/server/better-auth/server";
import { IssueList } from "@/components/issue-list";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "My Issues",
};

export default async function MyIssuesPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const session = await getSession();

  if (!session) redirect("/");

  const workspace = await api.workspace.getBySlug({ slug: workspaceSlug });
  
  const issues = await api.issue.list({ 
    workspaceId: workspace.id,
    assigneeId: session.user.id
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Issues</h1>
        <p className="text-muted-foreground">All issues assigned to you in {workspace.name}.</p>
      </div>

      <div className="mt-8">
        <IssueList issues={issues} projectKey="" />
      </div>
    </div>
  );
}
