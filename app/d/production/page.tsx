"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Calendar,
  Layers,
  Package,
  SlidersHorizontal,
  TrendingUp,
  FilterX,
  Loader2,
  Scale,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"

import {
  fetchProductionSummaryReport,
  fetchSummaryAvailableLines,
} from "@/forms/queries/production.query"

export default function ProductionSummaryPage() {
  // Primary Search Filter States
  const [areaId, setAreaId] = React.useState<string>("all")
  const [dateFrom, setDateFrom] = React.useState<string>("")
  const [dateTo, setDateTo] = React.useState<string>("")
  const [skuCode, setSkuCode] = React.useState<string>("")

  const debouncedSku = React.useDeferredValue(skuCode)

  // Secondary dynamic dependent filter line state
  const [selectedLineId, setSelectedLineId] = React.useState<string>("all")

  // Server-Side Pagination States
  const [pageIndex, setPageIndex] = React.useState<number>(0)
  const [pageSize, setPageSize] = React.useState<number>(10)

  // Reset pagination index back to 0 whenever any main filter parameters change
  React.useEffect(() => {
    setPageIndex(0)
  }, [areaId, dateFrom, dateTo, debouncedSku, selectedLineId])

  // 1. Fetch Department Area Dropdown options
  const { data: areasData } = useQuery({
    queryKey: ["production_areas_dropdown_list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("production_areas")
        .select("id, area_name")
        .order("area_name")
      return data || []
    },
  })

  // 2. Fetch Available Lines dynamically matching parent filters
  const { data: availableLines = [] } = useQuery({
    queryKey: [
      "production_summary_lines",
      areaId,
      dateFrom,
      dateTo,
      debouncedSku,
    ],
    queryFn: () =>
      fetchSummaryAvailableLines({
        productionAreaId: areaId,
        dateFrom,
        dateTo,
        skuCode: debouncedSku,
      }),
  })

  // Safeguard: Reset selected line if primary filter changes remove it
  React.useEffect(() => {
    if (
      selectedLineId !== "all" &&
      !availableLines.some((l: { id: string }) => l.id === selectedLineId)
    ) {
      setSelectedLineId("all")
    }
  }, [availableLines, selectedLineId])

  // 3. Fetch Primary Server-Paginated Report Dataset
  const { data: reportResult, isLoading } = useQuery({
    queryKey: [
      "production_summary_dataset",
      pageIndex,
      pageSize,
      areaId,
      selectedLineId,
      dateFrom,
      dateTo,
      debouncedSku,
    ],
    queryFn: () =>
      fetchProductionSummaryReport({
        pageIndex,
        pageSize,
        productionAreaId: areaId,
        productionLineId: selectedLineId,
        dateFrom,
        dateTo,
        skuCode: debouncedSku,
      }),
  })

  const records = reportResult?.data || []
  const totalRows = reportResult?.rowCount || 0
  const pageCount = Math.ceil(totalRows / pageSize) || 1

  // Aggregate quantity on current page view
  const pageVolume = React.useMemo(() => {
    return records.reduce(
      (acc: number, curr: { qty: any }) => acc + (Number(curr.qty) || 0),
      0
    )
  }, [records])

  const handleClearFilters = () => {
    setAreaId("all")
    setDateFrom("")
    setDateTo("")
    setSkuCode("")
    setSelectedLineId("all")
    setPageIndex(0)
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Production Summary
          </h1>
          <p className="text-sm text-muted-foreground">
            Server-side paginated queries built for high-scale enterprise
            datasets.
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            className="gap-1.5 text-xs"
          >
            <FilterX className="h-3.5 w-3.5" /> Reset Filters
          </Button>
        </div>
      </div>

      {/* Engine Controls */}
      <Card shadow-sm="true">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Engine Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Department Area
              </label>
              <Select value={areaId} onValueChange={setAreaId}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="All Areas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Department Areas</SelectItem>
                  {areasData?.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.area_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                From Date
              </label>
              <div className="relative">
                <Calendar className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground/60" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Date To */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                To Date
              </label>
              <div className="relative">
                <Calendar className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground/60" />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* SKU Search */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                SKU Code Lookup
              </label>
              <div className="relative">
                <Package className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground/60" />
                <Input
                  placeholder="Type SKU code..."
                  value={skuCode}
                  onChange={(e) => setSkuCode(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Dependent Production Lines Dropdown */}
          {availableLines.length > 0 && (
            <div className="-mx-6 -mb-6 flex flex-col gap-3 rounded-b-xl border-t bg-muted/30 p-6 pt-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Layers className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">
                  Filter by Dependent Line:
                </span>
              </div>

              <div className="w-full sm:w-64">
                <Select
                  value={selectedLineId}
                  onValueChange={setSelectedLineId}
                >
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder="All Active Lines" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All Lines ({availableLines.length})
                    </SelectItem>
                    {availableLines.map((line) => {
                      if (line.id === undefined || line.id === null) return null

                      return (
                        <SelectItem
                          key={String(line.id)}
                          value={String(line.id)}
                        >
                          {line.name || "Unnamed Line"}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card shadow-sm="true">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-3 text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Page Output Volume
              </p>
              <h4 className="text-2xl font-bold">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  pageVolume.toLocaleString()
                )}
              </h4>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table with Server-Side Pagination */}
      <Card shadow-sm="true" className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-muted/30 pb-3">
          <div>
            <CardTitle className="text-sm font-semibold">
              Production Entries Breakdown
            </CardTitle>
            <CardDescription>
              Showing {totalRows > 0 ? pageIndex * pageSize + 1 : 0} to{" "}
              {Math.min((pageIndex + 1) * pageSize, totalRows)} of{" "}
              {totalRows.toLocaleString()} total entries
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Line</TableHead>
                <TableHead>SKU Code</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>UOM</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead className="text-right">Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="p-8 text-center text-muted-foreground"
                  >
                    <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" />
                    Querying page {pageIndex + 1} from Supabase...
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="p-8 text-center text-muted-foreground italic"
                  >
                    No production entries found.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((row: any) => (
                  <TableRow
                    key={row.id}
                    className="transition-colors hover:bg-muted/40"
                  >
                    <TableCell className="font-medium whitespace-nowrap">
                      {row.production_date}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {row.production_areas?.area_name || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="secondary" className="font-semibold">
                        {row.production_lines?.line_name || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-primary">
                      {row.skus?.sku_code || "—"}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate">
                      {row.skus?.item_name || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Scale className="h-3 w-3 text-muted-foreground/70" />
                        {row.skus?.sku_uoms?.uom || "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium whitespace-nowrap">
                      {row.is_day ? "☀️ Day" : "🌙 Night"}
                    </TableCell>
                    <TableCell className="text-right font-semibold whitespace-nowrap">
                      {Number(row.qty || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Shadcn Pagination Toolbar */}
        <CardFooter className="flex flex-col items-center justify-between gap-4 border-t bg-muted/20 p-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Rows per page
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                setPageSize(Number(val))
                setPageIndex(0)
              }}
            >
              <SelectTrigger className="h-8 w-[70px] bg-background">
                <SelectValue placeholder={String(pageSize)} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-xs font-medium text-muted-foreground">
              Page <strong className="text-foreground">{pageIndex + 1}</strong>{" "}
              of <strong className="text-foreground">{pageCount}</strong>
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPageIndex(0)}
                disabled={pageIndex === 0 || isLoading}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPageIndex((old) => Math.max(old - 1, 0))}
                disabled={pageIndex === 0 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setPageIndex((old) => Math.min(old + 1, pageCount - 1))
                }
                disabled={pageIndex >= pageCount - 1 || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPageIndex(pageCount - 1)}
                disabled={pageIndex >= pageCount - 1 || isLoading}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
