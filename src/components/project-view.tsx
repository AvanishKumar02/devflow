"use client";

import { useState } from "react";
import type { IssueStatus, IssuePriority, Issue, Project, User, Epic } from "../generated/prisma/index-browser.js";
import { api } from "@/trpc/react";

type IssueWithDetails = Issue & {
  project: Project;
  assignee: User | null;
  epic: Epic | null;
};
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KanbanBoard } from "@/components/kanban-board";
import { IssueList } from "@/components/issue-list";
import { IssueFilters } from "@/components/issue-filters";

interface ProjectViewProps {
  workspaceId: string;
  projectId: string;
  projectKey: string;
  initialIssues: IssueWithDetails[];
}

export function ProjectView({ workspaceId, projectId, projectKey, initialIssues }: ProjectViewProps) {
  const [status, setStatus] = useState<IssueStatus | undefined>();
  const [priority, setPriority] = useState<IssuePriority | undefined>();

  const { data: issues } = api.issue.list.useQuery(
    { workspaceId, projectId, status, priority },
    { initialData: (status === undefined && priority === undefined) ? initialIssues : undefined }
  );

  return (
    <div className="space-y-6 flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-4 py-2 border-y border-border shrink-0">
        <IssueFilters 
          status={status}
          priority={priority}
          onStatusChange={setStatus}
          onPriorityChange={setPriority}
          onClear={() => {
            setStatus(undefined);
            setPriority(undefined);
          }}
        />
      </div>

      <Tabs defaultValue="board" className="w-full flex-1 flex flex-col overflow-hidden">
        <TabsList className="bg-muted border border-border shrink-0 self-start">
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>
        
        <TabsContent value="board" className="mt-4 flex-1 overflow-hidden focus-visible:ring-0">
           <KanbanBoard 
            workspaceId={workspaceId} 
            projectId={projectId} 
            issues={issues ?? []} 
            statusFilter={status}
            priorityFilter={priority}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-4 flex-1 overflow-y-auto focus-visible:ring-0">
          <IssueList issues={issues ?? []} projectKey={projectKey} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
