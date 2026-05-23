"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IssueStatus } from "../../generated/prisma/index-browser.js";
import type { IssuePriority, Issue, Project, User, Epic } from "../../generated/prisma/index-browser.js";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";
import { MoreHorizontal, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IssueDetail } from "@/components/issue-detail";

type IssueWithDetails = Issue & {
  project: Project;
  assignee: User | null;
  epic: Epic | null;
};

interface KanbanBoardProps {
  workspaceId: string;
  projectId: string;
  issues: IssueWithDetails[];
  statusFilter?: IssueStatus;
  priorityFilter?: IssuePriority;
}

const COLUMNS = [
  { id: IssueStatus.BACKLOG, title: "Backlog" },
  { id: IssueStatus.TODO, title: "To Do" },
  { id: IssueStatus.IN_PROGRESS, title: "In Progress" },
  { id: IssueStatus.DONE, title: "Done" },
  { id: IssueStatus.CANCELED, title: "Canceled" },
];

export function KanbanBoard({ workspaceId, projectId, issues: initialIssues, statusFilter, priorityFilter }: KanbanBoardProps) {
  console.log("KanbanBoard rendering with initialIssues:", initialIssues.length);
  const [issues, setIssues] = useState(initialIssues);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [statusAtStart, setStatusAtStart] = useState<IssueStatus | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const utils = api.useUtils();
  const queryKey = { workspaceId, projectId, status: statusFilter, priority: priorityFilter };

  const updateIssue = api.issue.update.useMutation({
    onMutate: async (newIssue) => {
      await utils.issue.list.cancel(queryKey);
      const previousIssues = utils.issue.list.getData(queryKey);
      
      if (previousIssues) {
         utils.issue.list.setData(queryKey, (old) => {
           return old?.map(i => i.id === newIssue.id ? { ...i, ...newIssue } : i);
         });
      }
      return { previousIssues };
    },
    onError: (err, newIssue, context) => {
      if (context?.previousIssues) {
        utils.issue.list.setData(queryKey, context.previousIssues);
        setIssues(context.previousIssues);
      }
      alert(`Failed to update issue status: ${err.message}`);
    },
    onSettled: () => {
      void utils.issue.list.invalidate(queryKey);
    },
  });

  useEffect(() => {
    setIssues(initialIssues);
  }, [initialIssues]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!isMounted) return null;

  const onDragStart = (event: DragStartEvent) => {
    const activeIssueId = event.active.id as string;
    const activeIssue = issues.find(i => i.id === activeIssueId);
    if (activeIssue) {
      setStatusAtStart(activeIssue.status);
    }
    setActiveId(activeIssueId);
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeIssueId = active.id as string;
    const overId = over.id as string;

    const activeIssue = issues.find(i => i.id === activeIssueId);
    if (!activeIssue) return;

    const isOverColumn = COLUMNS.some(c => c.id === overId);
    if (isOverColumn) {
      const newStatus = overId as IssueStatus;
      if (activeIssue.status !== newStatus) {
        setIssues(prev => prev.map(i => i.id === activeIssueId ? { ...i, status: newStatus } : i));
      }
      return;
    }

    const overIssue = issues.find(i => i.id === overId);
    if (overIssue && activeIssue.status !== overIssue.status) {
      setIssues(prev => prev.map(i => i.id === activeIssueId ? { ...i, status: overIssue.status } : i));
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    const startStatus = statusAtStart;
    setStatusAtStart(null);

    if (!over) return;

    const activeIssueId = active.id as string;
    const overId = over.id as string;

    const activeIssue = issues.find(i => i.id === activeIssueId);
    if (!activeIssue) return;

    let newStatus: IssueStatus;
    if (COLUMNS.some(c => c.id === overId)) {
      newStatus = overId as IssueStatus;
    } else {
      const overIssue = issues.find(i => i.id === overId);
      newStatus = overIssue?.status ?? activeIssue.status;
    }

    if (startStatus !== newStatus) {
      updateIssue.mutate({ id: activeIssueId, status: newStatus });
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-6 h-[calc(100vh-250px)] overflow-x-auto pb-4">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              issues={issues.filter(i => i.status === column.id)}
              onCardClick={(id) => {
                setSelectedIssueId(id);
                setIsDetailOpen(true);
              }}
            />
          ))}
        </div>
        <DragOverlay>
          {activeId ? (
            <KanbanCard issue={issues.find(i => i.id === activeId)!} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

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

function KanbanColumn({ id, title, issues, onCardClick }: { id: string; title: string; issues: IssueWithDetails[]; onCardClick: (id: string) => void }) {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div 
      ref={setNodeRef}
      className="flex flex-col w-80 bg-muted/30 rounded-lg border border-border shrink-0"
    >
      <div className="p-4 flex items-center justify-between border-b border-border bg-card/50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{title}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {issues.length}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        <SortableContext items={issues.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {issues.map((issue) => (
            <KanbanCard key={issue.id} issue={issue} onClick={() => onCardClick(issue.id)} />
          ))}
        </SortableContext>
        {issues.length === 0 && (
          <div className="h-24 border-2 border-dashed border-border rounded-md flex items-center justify-center text-xs text-muted-foreground">
             Drop issues here
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanCard({ issue, isOverlay, onClick }: { issue: IssueWithDetails; isOverlay?: boolean; onClick?: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-24 bg-accent/20 border-2 border-dashed border-primary/30 rounded-md"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={cn(
        "bg-card border border-border rounded-md shadow-sm p-4 hover:border-primary/50 transition-colors group relative cursor-pointer",
        isOverlay && "rotate-2 shadow-xl ring-2 ring-primary border-primary"
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <span className="text-[10px] font-mono text-muted-foreground uppercase">
            {issue.project.key}-{issue.number}
          </span>
          <div 
            {...attributes} 
            {...listeners} 
            className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity p-1 -m-1"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
        <h4 className="text-sm font-medium leading-tight">{issue.title}</h4>
        <div className="flex flex-wrap gap-2 mt-1">
          {issue.epic && (
             <span className="text-[10px] font-semibold text-primary/80 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
              {issue.epic.name}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
             <span className={cn(
               "text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border",
               issue.priority === "URGENT" ? "border-red-500/50 text-red-500 bg-red-500/10" :
               issue.priority === "HIGH" ? "border-orange-500/50 text-orange-500" :
               "border-border text-muted-foreground"
             )}>
              {issue.priority}
            </span>
          </div>
          {issue.assignee && (
            <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
              {issue.assignee.name?.[0]}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
