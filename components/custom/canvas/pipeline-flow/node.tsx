import { Handle, Position } from "reactflow"
import { GitCommit } from "lucide-react"

export function StepNode({ data }: { data: any }) {
  return (
    <div className="flex min-w-[180px] items-center gap-3 rounded-full border bg-background px-4 py-2 shadow-sm transition-shadow hover:shadow-md">
      <Handle type="target" position={Position.Left} className="!bg-primary" />

      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
        <GitCommit className="h-4 w-4" />
      </div>

      <span className="text-sm font-medium">{data.label}</span>

      <Handle type="source" position={Position.Right} className="!bg-primary" />
    </div>
  )
}
