import { type Metadata } from "next";
import { api, HydrateClient } from "@/trpc/server";
import { CreateIssueModal } from "@/components/create-issue-modal";
import { ProjectView } from "@/components/project-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectKey: string }>;
}): Promise<Metadata> {
  const { workspaceSlug, projectKey } = await params;
  try {
    const workspace = await api.workspace.getBySlug({ slug: workspaceSlug });
    const project = workspace.projects.find(p => p.key === projectKey);
    return {
      title: project ? project.name : "Project",
    };
  } catch {
    return {
      title: "Project",
    };
  }
}


export default async function ProjectPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectKey: string }>;
}) {
  const { workspaceSlug, projectKey } = await params;
  
  const workspace = await api.workspace.getBySlug({ slug: workspaceSlug });
  const project = workspace.projects.find(p => p.key === projectKey);

  if (!project) return <div>Project not found</div>;

  const issues = await api.issue.list({ 
    workspaceId: workspace.id, 
    projectId: project.id,
    status: undefined,
    priority: undefined,
  });

  return (
    <HydrateClient>
      <div className="space-y-6 h-full flex flex-col overflow-hidden">
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-sm font-bold border border-border shadow-sm">
              {project.key}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
              <p className="text-muted-foreground text-sm">Manage issues and track progress for {project.key}.</p>
            </div>
          </div>
          <CreateIssueModal workspaceId={workspace.id} projectId={project.id} />
        </div>

        <ProjectView 
          workspaceId={workspace.id}
          projectId={project.id}
          projectKey={project.key}
          initialIssues={issues}
        />
      </div>
    </HydrateClient>
  );
}
