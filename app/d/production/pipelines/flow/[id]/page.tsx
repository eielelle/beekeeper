"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
} from "reactflow"
import "reactflow/dist/style.css"

import { getProductionPipeline } from "@/forms/queries/production-pipeline.query"
import { StepNode } from "@/components/custom/canvas/pipeline-flow/node"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader2 } from "lucide-react"

const nodeTypes = {
  supabaseStep: StepNode,
}

export default function PipelineFlowPage() {
  const params = useParams()
  const pipelineId = params?.id as string

  const { data: pipeline, isLoading } = useQuery({
    queryKey: ["production-pipelines", pipelineId],
    queryFn: () => getProductionPipeline(pipelineId),
    enabled: !!pipelineId && pipelineId !== "undefined",
  })

  // State hooks allow nodes to be draggable and retain their new positions
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  React.useEffect(() => {
    if (!pipeline?.steps) return

    const sortedSteps = [...pipeline.steps].sort(
      (a, b) => (a.step_order || 0) - (b.step_order || 0)
    )

    const newNodes = sortedSteps.map((step, index) => ({
      id: String(step.id),
      type: "supabaseStep",
      position: { x: index * 250, y: 150 },
      data: { label: step.step_name },
    }))

    const newEdges = []

    for (let i = 1; i < sortedSteps.length; i++) {
      const prevStep = sortedSteps[i - 1]
      const currStep = sortedSteps[i]

      newEdges.push({
        id: `e-${prevStep.id}-${currStep.id}`,
        source: String(prevStep.id),
        target: String(currStep.id),
        type: "smoothstep",
        animated: true, // This makes it flow with dots
        style: {
          strokeWidth: 2,
          stroke: "#eab308", // Use a solid Hex color (e.g., Tailwind's yellow-500)
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#eab308", // Make the arrowhead match the line
        },
      })
    }

    setNodes(newNodes)
    setEdges(newEdges)
  }, [pipeline, setNodes, setEdges])

  if (!pipelineId || pipelineId === "undefined" || isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!pipeline) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Pipeline not found.
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-100px)] flex-col space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Flow of {pipeline.name}</CardTitle>
          <CardDescription>
            {pipeline.description || "No description provided."}
          </CardDescription>
        </CardHeader>
      </Card>
      <Card className="flex-1 overflow-hidden border-2 p-0">
        <div className="h-full w-full bg-[#f8f9fa] dark:bg-background">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            proOptions={{ hideAttribution: true }}
            minZoom={0.2}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={1}
              color="hsl(var(--muted-foreground) / 0.25)"
            />
            <Controls
              className="border bg-background shadow-sm"
              showInteractive={false}
            />
            <MiniMap
              className="rounded-md border border-border bg-background shadow-sm"
              maskColor="hsl(var(--muted) / 0.6)"
              nodeColor="hsl(var(--border))"
              position="bottom-right"
            />
          </ReactFlow>
        </div>
      </Card>
    </div>
  )
}
