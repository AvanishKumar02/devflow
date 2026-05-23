"use client";

import { IssueStatus, IssuePriority } from "../generated/prisma/index-browser.js";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface IssueFiltersProps {
  status?: IssueStatus;
  priority?: IssuePriority;
  onStatusChange: (status?: IssueStatus) => void;
  onPriorityChange: (priority?: IssuePriority) => void;
  onClear: () => void;
}

export function IssueFilters({ 
  status, 
  priority, 
  onStatusChange, 
  onPriorityChange,
  onClear 
}: IssueFiltersProps) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="w-40">
        <Select 
          value={status ?? "all"} 
          onValueChange={(v) => onStatusChange(v === "all" ? undefined : v as IssueStatus)}
        >
          <SelectTrigger className="bg-card border-border h-9 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.values(IssueStatus).map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-40">
        <Select 
          value={priority ?? "all"} 
          onValueChange={(v) => onPriorityChange(v === "all" ? undefined : v as IssuePriority)}
        >
          <SelectTrigger className="bg-card border-border h-9 text-xs">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Priorities</SelectItem>
            {Object.values(IssuePriority).map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(status ?? priority) && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClear}
          className="h-9 px-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      )}
    </div>
  );
}
