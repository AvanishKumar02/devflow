"use client";

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

const workspaceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase, numbers, and hyphens only"),
});

type WorkspaceFormValues = z.infer<typeof workspaceSchema>;

export default function NewWorkspacePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const createWorkspace = api.workspace.create.useMutation({
    onSuccess: (data) => {
      router.push(`/${data.slug}`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const onSubmit = (values: WorkspaceFormValues) => {
    setError(null);
    createWorkspace.mutate(values);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);
    // Auto-generate slug if it hasn't been manually touched or is empty
    const currentSlug = form.getValues("slug");
    if (!currentSlug || currentSlug === name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")) {
       form.setValue("slug", name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-foreground">Create Workspace</CardTitle>
          <CardDescription className="text-muted-foreground">
            Workspaces are where your team manages projects and issues.
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">Workspace Name</Label>
              <Input
                id="name"
                placeholder="Acme Corp"
                {...form.register("name")}
                onChange={handleNameChange}
                className="bg-background border-border focus:ring-primary"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-foreground">Workspace Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">devflow.com/</span>
                <Input
                  id="slug"
                  placeholder="acme-corp"
                  {...form.register("slug")}
                  className="bg-background border-border focus:ring-primary"
                />
              </div>
              {form.formState.errors.slug && (
                <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
              )}
              <p className="text-xs text-muted-foreground italic">
                This is your workspace&apos;s unique URL.
              </p>
            </div>
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={createWorkspace.isPending}
            >
              {createWorkspace.isPending ? "Creating..." : "Create Workspace"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
