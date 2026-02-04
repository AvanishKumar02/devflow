"use client";

import { useState } from "react";
import { format } from "date-fns";
import { api } from "@/trpc/react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Clock, User, ArrowRight } from "lucide-react";

interface TimelineItem {
  id: string;
  createdAt: Date | string;
  user?: { name: string | null; email: string } | null;
  content?: string;
  action?: string;
  oldValue?: string | null;
  newValue?: string | null;
}

interface IssueDetailProps {
  issueId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IssueDetail({ issueId, isOpen, onOpenChange }: IssueDetailProps) {
  const [commentContent, setCommentContent] = useState("");
  const utils = api.useUtils();

  const { data: issue, isLoading } = api.issue.getById.useQuery(
    { id: issueId },
    { enabled: isOpen }
  );

  const { data: members } = api.workspace.getMembers.useQuery(
    { workspaceId: issue?.workspaceId ?? "" },
    { enabled: !!issue?.workspaceId }
  );

  const updateIssue = api.issue.update.useMutation({
    onSuccess: () => {
      void utils.issue.getById.invalidate({ id: issueId });
      void utils.issue.list.invalidate();
    },
  });

  const createComment = api.comment.create.useMutation({
    onSuccess: () => {
      setCommentContent("");
      void utils.issue.getById.invalidate({ id: issueId });
    },
  });

  if (isLoading) return null;
  if (!issue) return null;

  const handleSendComment = () => {
    if (!commentContent.trim()) return;
    createComment.mutate({ issueId, content: commentContent });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full flex flex-col p-0 bg-card border-l border-border">
        <div className="p-6 flex-1 flex flex-col gap-6 overflow-hidden">
          <SheetHeader>
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase mb-2">
              <span>{issue.project.key}-{issue.number}</span>
              <Separator orientation="vertical" className="h-3" />
              <span>{issue.status}</span>
            </div>
            <SheetTitle className="text-2xl font-bold">{issue.title}</SheetTitle>
            <SheetDescription className="text-muted-foreground mt-2">
              {issue.description ?? "No description provided."}
            </SheetDescription>
          </SheetHeader>

          <Separator className="bg-border" />

          <div className="flex-1 overflow-hidden flex flex-col gap-6">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-8">
                {/* Details Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <User className="h-3 w-3" /> Assignee
                    </span>
                    <Select 
                      value={issue.assigneeId ?? "none"}
                      onValueChange={(v) => updateIssue.mutate({ id: issueId, assigneeId: (v === "none" || !v) ? undefined : v })}
                    >
                      <SelectTrigger className="h-8 border-none bg-transparent hover:bg-accent/50 px-2 -ml-2 text-sm focus:ring-0">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="none">Unassigned</SelectItem>
                        {members?.map((m) => (
                          <SelectItem key={m.userId} value={m.userId}>{m.user.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <Clock className="h-3 w-3" /> Created
                    </span>
                    <p className="text-sm">{format(new Date(issue.createdAt), "PPP")}</p>
                  </div>
                </div>

                {/* Timeline Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5" /> Activity & Comments
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Activity Logs & Comments merged in chronological order */}
                    {([...(issue.comments ?? []), ...(issue.activityLogs ?? [])] as TimelineItem[])
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((item) => (
                        <div key={item.id} className="relative pl-6 pb-6 border-l border-border last:pb-0">
                          <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-border" />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                               <span className="text-xs font-semibold">
                                {item.user ? item.user.name : "System"}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {format(new Date(item.createdAt), "MMM d, h:mm a")}
                              </span>
                            </div>
                            {item.content ? (
                              <p className="text-sm bg-muted/30 p-3 rounded-md border border-border">
                                {item.content}
                              </p>
                            ) : (
                              <div className="text-xs text-muted-foreground flex items-center gap-2 py-1">
                                {item.action === "STATUS_CHANGE" ? (
                                  <>
                                    Changed status from <span className="font-semibold text-foreground">{item.oldValue}</span> 
                                    <ArrowRight className="h-3 w-3" /> 
                                    <span className="font-semibold text-foreground">{item.newValue}</span>
                                  </>
                                ) : (
                                  <span>{item.action}: {item.newValue}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer/Comment Input */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex flex-col gap-2">
            <Textarea
              placeholder="Write a comment..."
              className="min-h-[80px] bg-background border-border focus:ring-primary text-sm"
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleSendComment} 
                disabled={!commentContent.trim() || createComment.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Comment
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Add date-fns if not installed
// pnpm add date-fns
