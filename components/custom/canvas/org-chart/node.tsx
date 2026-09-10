"use client"

import { Handle, Position } from "reactflow"
import { User, Briefcase, Mail } from "lucide-react"

export default function OrgChartNode({ data }: { data: any }) {
  return (
    <div className="w-[250px] overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
      {/* Target handle for incoming connections (who they report to) */}
      <Handle
        type="target"
        position={Position.Top}
        className="h-2 w-2 bg-muted-foreground"
      />

      <div className="flex items-center gap-3 border-b bg-muted/30 p-3">
        <div className="rounded-full bg-primary/10 p-2">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm leading-none font-semibold">{data.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {data.employee_no}
          </p>
        </div>
      </div>

      <div className="space-y-2 p-3 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Briefcase className="h-3 w-3" />
          <span>{data.position || "Employee"}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-3 w-3" />
          <span className="truncate">{data.email || "No email"}</span>
        </div>
      </div>

      {/* Source handle for outgoing connections (who reports to them) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="h-2 w-2 bg-muted-foreground"
      />
    </div>
  )
}
