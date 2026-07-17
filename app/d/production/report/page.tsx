"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

import {
  fetchFilteredProductions,
  type ProductionFilters,
} from "@/forms/queries/production.query"
// Import your existing query functions to populate the dropdowns
import { searchProductionAreas } from "@/forms/queries/production_area.query"
import { searchProductionLines } from "@/forms/queries/production_line.query"

export default function ProductionListPage() {
  // Filter States
  const [filters, setFilters] = React.useState<ProductionFilters>({
    dateFrom: "",
    dateTo: "",
    production_area: "all",
    production_line: "all",
    shift: "all",
    operation_type: "all",
  })

  // Fetch dropdown options
  const { data: areas = [] } = useQuery({
    queryKey: ["areas"],
    queryFn: () => searchProductionAreas(""),
  })

  const { data: lines = [] } = useQuery({
    queryKey: ["lines"],
    queryFn: () => searchProductionLines(""),
  })

  // Fetch filtered data
  const { data: productions, isLoading } = useQuery({
    queryKey: ["filtered_productions", filters],
    queryFn: () => fetchFilteredProductions(filters),
  })

  // Helper to update individual filters
  const handleFilterChange = (key: keyof ProductionFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Production Logs</h1>
      </div>

      {/* FILTER BAR */}
      <div className="grid grid-cols-1 gap-4 rounded-lg border bg-muted/20 p-4 md:grid-cols-3 lg:grid-cols-6">
        {/* Date From */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Date From
          </label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
          />
        </div>

        {/* Date To */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Date To
          </label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange("dateTo", e.target.value)}
          />
        </div>

        {/* Production Area */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Area
          </label>
          <Select
            value={String(filters.production_area)}
            onValueChange={(val) => handleFilterChange("production_area", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              {areas.map((area: any) => (
                <SelectItem key={area.id} value={String(area.id)}>
                  {area.area_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Production Line */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Line
          </label>
          <Select
            value={String(filters.production_line)}
            onValueChange={(val) => handleFilterChange("production_line", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Lines" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lines</SelectItem>
              {lines.map((line: any) => (
                <SelectItem key={line.id} value={String(line.id)}>
                  {line.line_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Shift */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Shift
          </label>
          <Select
            value={filters.shift}
            onValueChange={(val) => handleFilterChange("shift", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Shifts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shifts</SelectItem>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="night">Night</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Operation Type */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Operation
          </label>
          <Select
            value={filters.operation_type}
            onValueChange={(val) => handleFilterChange("operation_type", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Operations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Operations</SelectItem>
              <SelectItem value="startup">Startup</SelectItem>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="last_prod">Last Prod</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Shift</TableHead>
              <TableHead>Operation</TableHead>
              {/* This column will display the merged production items */}
              <TableHead className="min-w-[300px]">
                Items Produced (SKU : Qty)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : !productions || productions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  No production records found for these filters.
                </TableCell>
              </TableRow>
            ) : (
              productions.map((row: any) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {format(new Date(row.production_date), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="capitalize">{row.shift}</TableCell>
                  <TableCell className="capitalize">
                    {row.operation_type.replace("_", " ")}
                  </TableCell>
                  <TableCell>
                    {/* MERGED ITEMS DISPLAY */}
                    <div className="flex flex-wrap gap-2">
                      {row.production_items &&
                      row.production_items.length > 0 ? (
                        row.production_items.map((item: any, idx: number) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="whitespace-nowrap"
                          >
                            <span className="mr-1 font-semibold">
                              {item.sku}
                            </span>
                            <span className="border-l border-border pl-1 text-muted-foreground">
                              {item.quantity} {item.uom || ""}
                            </span>
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          No items
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
