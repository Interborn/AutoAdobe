"use client";

import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BatchStatusProps {
  batchId: string | null;
  batchName: string;
  itemCount: number;
  onEditBatch: () => void;
}

export function BatchStatus({ batchId, batchName, itemCount, onEditBatch }: BatchStatusProps) {
  if (!batchId) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <Badge variant="outline" className="font-mono">
              {batchId}
            </Badge>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {batchName || "Unnamed Batch"}
            </span>
            <span className="text-sm text-muted-foreground">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onEditBatch}
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Batch
        </Button>
      </div>
    </Card>
  );
} 