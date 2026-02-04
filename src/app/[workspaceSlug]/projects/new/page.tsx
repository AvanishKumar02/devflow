"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  key: z.string().min(2, "Key must be at least 2 characters").max(10, "Key must be at most 10 characters").toUpperCase(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function NewProjectPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = use(params);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const { data: workspace } = api.workspace.getBySlug.useQuery({ slug: workspaceSlug });

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      key: "",
    },
  });

  const createProject = api.project.create.useMutation({
    onSuccess: () => {
      router.push(`/${workspaceSlug}`);
      router.refresh();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const onSubmit = (values: ProjectFormValues) => {
    if (!workspace) return;
    setError(null);
    createProject.mutate({
      ...values,
      workspaceId: workspace.id,
    });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);
    // Auto-generate key from name (first few consonants or just first few letters)
    const currentKey = form.getValues("key");
    if (!currentKey || currentKey === name.replace(/[^a-zA-Z]/g, "").substring(0, 3).toUpperCase()) {
       form.setValue("key", name.replace(/[^a-zA-Z]/g, "").substring(0, 3).toUpperCase());
    }
  };

  if (!workspace) return <div>Loading...</div>;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Project</h1>
        <p className="text-muted-foreground">Add a new project to {workspace.name}.</p>
      </div>

      <Card className="max-w-xl border-border bg-card">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Define the name and unique key for your project.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="Mobile App"
                {...form.register("name")}
                onChange={handleNameChange}
                className="bg-background border-border"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="key">Project Key</Label>
              <Input
                id="key"
                placeholder="APP"
                {...form.register("key")}
                className="bg-background border-border uppercase"
              />
              {form.formState.errors.key && (
                <p className="text-sm text-destructive">{form.formState.errors.key.message}</p>
              )}
              <p className="text-xs text-muted-foreground italic">
                The key is used as a prefix for all issues in this project (e.g., APP-1).
              </p>
            </div>
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
              className="border-border hover:bg-accent"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createProject.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {createProject.isPending ? "Creating..." : "Create Project"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
