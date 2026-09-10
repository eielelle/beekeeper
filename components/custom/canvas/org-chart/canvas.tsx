"use client"

import { useCallback, useEffect, useMemo } from "react"
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  Panel,
} from "reactflow"
import "reactflow/dist/style.css"
import dagre from "dagre"
import OrgChartNode from "./node"

const nodeTypes = {
  custom: OrgChartNode,
}

const getLayoutedElements = (nodes: any[], edges: any[], direction = "TB") => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 100 })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 250, height: 120 })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    node.targetPosition = direction === "TB" ? "top" : "left"
    node.sourcePosition = direction === "TB" ? "bottom" : "right"
    node.position = {
      x: nodeWithPosition.x - 250 / 2,
      y: nodeWithPosition.y - 120 / 2,
    }
    return node
  })

  return { nodes, edges }
}

export default function OrgChartCanvas({ employees }: { employees: any[] }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    // 1. Map employees to React Flow nodes
    const initialNodes = employees.map((emp) => ({
      id: emp.id.toString(),
      type: "custom",
      data: {
        name: `${emp.first_name} ${emp.last_name}`,
        employee_no: emp.employee_no,
        email: emp.work_email,
        position: emp.position_title || "Unknown Position", // Assuming a joined field
      },
      position: { x: 0, y: 0 },
    }))

    // 2. Map reports_to_id relationships to React Flow edges
    const initialEdges = employees
      .filter((emp) => emp.reports_to_id)
      .map((emp) => ({
        id: `e${emp.reports_to_id}-${emp.id}`,
        source: emp.reports_to_id.toString(), // Manager
        target: emp.id.toString(), // Subordinate
        type: "smoothstep",
        animated: true,
      }))

    // 3. Apply auto-layout calculation
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    )

    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  }, [employees, setNodes, setEdges])

  return (
    <div className="h-[800px] w-full overflow-hidden rounded-xl border bg-zinc-50 dark:bg-zinc-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
      >
        <Background color="#ccc" gap={16} />
        <Controls />
        <MiniMap
          zoomable
          pannable
          className="rounded-lg border bg-background"
        />
        <Panel
          position="top-right"
          className="rounded-lg border bg-background p-2 text-sm shadow-sm"
        >
          Drag canvas to pan, scroll to zoom
        </Panel>
      </ReactFlow>
    </div>
  )
}
