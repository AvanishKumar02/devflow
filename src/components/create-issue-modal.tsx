"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { IssueStatus, IssuePriority } from "../generated/prisma/index-browser.js";
import { Plus, AlertCircle } from "lucide-react";
import { api } from "@/trpc/react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

const issueSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  projectId: z.string().min(1, "Project is required"),
  status: z.nativeEnum(IssueStatus),
  priority: z.nativeEnum(IssuePriority),
  epicId: z.string().optional(),
  assigneeId: z.string().optional(),
});

type IssueFormValues = {
  title: string;
  description?: string;
  projectId: string;
  status: IssueStatus;
  priority: IssuePriority;
  epicId?: string;
  assigneeId?: string;
};

interface CreateIssueModalProps {
  workspaceId: string;
  projectId?: string;
}

export function CreateIssueModal({ workspaceId, projectId: initialProjectId }: CreateIssueModalProps) {
  const [open, setOpen] = useState(false);
  const utils = api.useUtils();
  
  const form = useForm<IssueFormValues>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      title: "",
      description: "",
      projectId: initialProjectId ?? "",
      status: IssueStatus.TODO,
      priority: IssuePriority.NONE,
      epicId: undefined,
    },
  });

  const selectedProjectId = form.watch("projectId");

  // Reset epic when project changes to prevent invalid epic/project combinations
  useEffect(() => {
    form.setValue("epicId", undefined);
  }, [selectedProjectId, form]);

  const { data: projects } = api.project.getAllByWorkspace.useQuery({ workspaceId });
  const { data: epics } = api.epic.listByProject.useQuery(
    { projectId: selectedProjectId },
    { enabled: !!selectedProjectId }
  );
  const { data: members } = api.workspace.getMembers.useQuery({ workspaceId });

  const createIssue = api.issue.create.useMutation({
    onSuccess: () => {
      void utils.issue.list.invalidate();
      setOpen(false);
      form.reset();
    },
  });

  const onSubmit = (values: IssueFormValues) => {
    createIssue.mutate({
      ...values,
      workspaceId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) {
        form.reset();
        createIssue.reset();
      }
    }}>
      <DialogTrigger
        render={
          <Button 
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-medium"
          >
            <Plus className="h-4 w-4" />
            New Issue
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[525px] bg-card border-border shadow-2xl">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create Issue</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a new task to your project.
            </DialogDescription>
          </DialogHeader>
          
          {createIssue.error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {createIssue.error.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold">Title</Label>
              <Input
                id="title"
                placeholder="Fix navigation bug..."
                {...form.register("title")}
                className="bg-background border-border focus:ring-primary h-10"
              />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the problem or goal..."
                {...form.register("description")}
                className="bg-background border-border min-h-[120px] focus:ring-primary resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Project</Label>
                <Select 
                  value={selectedProjectId} 
                  onValueChange={(v) => form.setValue("projectId", v ?? "")}
                >
                  <SelectTrigger className="bg-background border-border h-10">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {projects?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.projectId && (
                  <p className="text-xs text-destructive">{form.formState.errors.projectId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Epic</Label>
                <Select 
                  value={form.watch("epicId") ?? "none"}
                  onValueChange={(v) => form.setValue("epicId", v === "none" ? undefined : (v ?? undefined))}
                >
                  <SelectTrigger className="bg-background border-border h-10">
                    <SelectValue placeholder="No Epic" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">No Epic</SelectItem>
                    {epics?.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label className="text-sm font-semibold">Priority</Label>
                <Select 
                  defaultValue={IssuePriority.NONE} 
                  onValueChange={(v) => form.setValue("priority", v as IssuePriority)}
                >
                  <SelectTrigger className="bg-background border-border h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {Object.values(IssuePriority).map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Assignee</Label>
                <Select 
                  value={form.watch("assigneeId") ?? "none"}
                  onValueChange={(v) => form.setValue("assigneeId", v === "none" ? undefined : (v ?? undefined))}
                >
                  <SelectTrigger className="bg-background border-border h-10">
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
            </div>
          </div>
          <DialogFooter className="border-t border-border pt-6">
            <Button 
              type="submit" 
              disabled={createIssue.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-10 font-semibold"
            >
              {createIssue.isPending ? "Creating..." : "Create Issue"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
