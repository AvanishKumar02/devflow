"use client";

import { useState } from "react";
import type { Issue, Project, User, Epic } from "../generated/prisma/index-browser.js";
import { CircleDot, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { IssueDetail } from "@/components/issue-detail";

type IssueWithDetails = Issue & {
  project: Project;
  assignee: User | null;
  epic: Epic | null;
};

interface IssueListProps {
  issues: IssueWithDetails[];
  projectKey: string;
}

export function IssueList({ issues, projectKey: _projectKey }: IssueListProps) {
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  return (
    <>
      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {issues.length === 0 && (
              <div className="p-8 text-center text-muted-foreground italic">
                No issues found in this project. Create one to get started!
              </div>
            )}
            {issues.map((issue) => (
              <div 
                key={issue.id} 
                onClick={() => {
                  setSelectedIssueId(issue.id);
                  setIsDetailOpen(true);
                }}
                className="group flex items-center justify-between p-4 hover:bg-accent/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono text-muted-foreground w-16">
                      {issue.project.key}-{issue.number}
                    </span>
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      issue.status === "DONE" ? "bg-green-500" : 
                      issue.status === "IN_PROGRESS" ? "bg-yellow-500" : "bg-muted-foreground"
                    )} />
                  </div>
                  <span className="font-medium truncate">{issue.title}</span>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span className={cn(
                    "text-[10px] uppercase font-bold px-2 py-0.5 rounded border",
                    issue.priority === "URGENT" ? "border-red-500/50 text-red-500 bg-red-500/10" :
                    issue.priority === "HIGH" ? "border-orange-500/50 text-orange-500" :
                    "border-border text-muted-foreground"
                  )}>
                    {issue.priority}
                  </span>
                  {issue.assignee ? (
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                      {issue.assignee.name?.[0]}
                    </div>
                  ) : (
                    <CircleDot className="h-5 w-5 opacity-20" />
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedIssueId && (
        <IssueDetail 
          issueId={selectedIssueId} 
          isOpen={isDetailOpen} 
          onOpenChange={setIsDetailOpen} 
        />
      )}
    </>
  );
}
