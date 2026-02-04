"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Settings, 
  Plus, 
  CircleDot,
  ChevronDown,
  LogOut,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/trpc/react";
import { authClient } from "@/server/better-auth/client";
import { useRouter } from "next/navigation";

interface SidebarProps {
  workspace: {
    name: string;
    slug: string;
    id: string;
  };
}

export function WorkspaceSidebar({ workspace }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { data: workspaces } = api.workspace.getAll.useQuery();
  const { data: projects } = api.project.getAllByWorkspace.useQuery({ workspaceId: workspace.id });

  const navItems = [
    { label: "Dashboard", href: `/${workspace.slug}`, icon: LayoutDashboard },
    { label: "My Issues", href: `/${workspace.slug}/my-issues`, icon: CircleDot },
    { label: "Settings", href: `/${workspace.slug}/settings`, icon: Settings },
  ];

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/");
            router.refresh();
          },
          onError: () => {
            setIsSigningOut(false);
            alert("Failed to sign out. Please try again.");
          }
        },
      });
    } catch {
      setIsSigningOut(false);
      alert("An error occurred during sign out.");
    }
  };

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card text-foreground">
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button 
                type="button"
                className={cn(
                  buttonVariants({ variant: "ghost" }), 
                  "w-full justify-between px-2 hover:bg-accent/50 group cursor-pointer"
                )}
              >
                <div className="flex items-center gap-2 overflow-hidden text-left">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground uppercase">
                    {workspace.name[0]}
                  </div>
                  <span className="truncate font-semibold">{workspace.name}</span>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            }
          />
          <DropdownMenuContent align="start" className="w-56 bg-card border-border">
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            {workspaces?.map((ws) => (
              <DropdownMenuItem 
                key={ws.id} 
                nativeButton={false}
                render={
                  <Link href={`/${ws.slug}`} className="flex items-center gap-2 cursor-pointer w-full">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/20 text-[8px] font-bold text-primary uppercase">
                      {ws.name[0]}
                    </div>
                    {ws.name}
                  </Link>
                }
              />
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              nativeButton={false}
              render={
                <Link href="/workspaces/new" className="flex items-center gap-2 cursor-pointer w-full">
                  <Plus className="h-4 w-4" />
                  Create Workspace
                </Link>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === item.href 
                ? "bg-accent text-foreground shadow-sm" 
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}

        <div className="pt-4">
          <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Projects
            <Link href={`/${workspace.slug}/projects/new`} className="hover:text-foreground transition-colors">
              <Plus className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-1 space-y-1">
            {projects?.map((project) => (
              <Link
                key={project.id}
                href={`/${workspace.slug}/projects/${project.key}`}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith(`/${workspace.slug}/projects/${project.key}`)
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <span className="text-[10px] font-bold bg-muted px-1 rounded text-muted-foreground">
                  {project.key}
                </span>
                <span className="truncate">{project.name}</span>
              </Link>
            ))}
            {projects?.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground italic">No projects yet</p>
            )}
          </div>
        </div>
      </nav>

      <div className="border-t border-border p-4">
         <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          {isSigningOut ? "Signing Out..." : "Sign Out"}
        </Button>
      </div>
    </div>
  );
}
