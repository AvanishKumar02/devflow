"use client";

import { useState, use } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import { WorkspaceRole } from "../../../../generated/prisma/index-browser.js";

export default function SettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = use(params);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>(WorkspaceRole.MEMBER);
  const [success, setSuccess] = useState<string | null>(null);
  const utils = api.useUtils();

  const { data: workspace, isLoading: isLoadingWorkspace } = api.workspace.getBySlug.useQuery({ 
    slug: workspaceSlug 
  });

  const { data: members, isLoading: isLoadingMembers } = api.workspace.getMembers.useQuery(
    { workspaceId: workspace?.id ?? "" },
    { enabled: !!workspace?.id }
  );

  const addMember = api.workspace.addMemberByEmail.useMutation({
    onSuccess: () => {
      setSuccess(`Successfully added ${email} to the workspace.`);
      setEmail("");
      void utils.workspace.getMembers.invalidate({ workspaceId: workspace?.id });
      setTimeout(() => setSuccess(null), 5000);
    },
    onError: (err) => {
      console.error("Failed to add member:", err);
    }
  });

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;
    addMember.mutate({
      workspaceId: workspace.id,
      email,
      role,
    });
  };

  if (isLoadingWorkspace || isLoadingMembers) {
    return <div className="p-8 text-center text-muted-foreground italic">Loading settings...</div>;
  }

  if (!workspace) return <div>Workspace not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workspace Settings</h1>
        <p className="text-muted-foreground">Manage your workspace members and configurations.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-8">
          {/* Members List */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Members</CardTitle>
              <CardDescription>People who have access to this workspace and its projects.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {members?.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {member.user.name?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{member.user.name}</p>
                        <p className="text-xs text-muted-foreground">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-border bg-muted/50 text-muted-foreground flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {member.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Add Member Form */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Add Member
              </CardTitle>
              <CardDescription>Invite someone to collaborate.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    placeholder="teammate@example.com" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={(v) => setRole(v!)}>
                    <SelectTrigger id="role" className="bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value={WorkspaceRole.ADMIN}>Admin</SelectItem>
                      <SelectItem value={WorkspaceRole.MEMBER}>Member</SelectItem>
                      <SelectItem value={WorkspaceRole.VIEWER}>Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {addMember.error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {addMember.error.message}
                    </AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="py-2 border-green-500/50 bg-green-500/10 text-green-600">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-xs">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={addMember.isPending}
                >
                  {addMember.isPending ? "Adding..." : "Add to Workspace"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
