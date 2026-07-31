"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ColumnDef, SortingState, PaginationState } from "@tanstack/react-table"
import { ClipboardCheck, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DataTable } from "@/components/custom/data-table/table"
import { toast } from "sonner"

import {
  fetchPendingBadOrderApprovals,
  updateBadOrder,
} from "@/forms/queries/bad_order.query"

// 🚀 Replace this with your actual Approval Engine import
// import { processApprovalAction } from "@/actions/approval.action"
const processApprovalAction = async (
  requestId: string,
  action: "approved" | "rejected",
  remarks: string
) => {
  // MOCK: Replace with your actual server action that updates `approval_requests`
  console.log("Processing Approval...", { requestId, action, remarks })
  return true
}

export default function BadOrderApprovalsPage() {
  const queryClient = useQueryClient()

  // Table State
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])

  // Review Modal State
  const [selectedOrder, setSelectedOrder] = React.useState<any | null>(null)
  const [remarks, setRemarks] = React.useState("")
  const [returnCounts, setReturnCounts] = React.useState<
    Record<string, number>
  >({})
  const [totalPrice, setTotalPrice] = React.useState<number | "">("")

  const { data, isLoading } = useQuery({
    queryKey: [
      "bad-order-approvals",
      pagination.pageIndex,
      pagination.pageSize,
      globalFilter,
    ],
    queryFn: () =>
      fetchPendingBadOrderApprovals({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        globalFilter,
        sorting: [],
      }),
  })

  // Open modal and pre-fill state
  const handleOpenReview = (order: any) => {
    setSelectedOrder(order)
    setRemarks("")
    setTotalPrice(order.total_price || "")

    const initialCounts: Record<string, number> = {}
    order.bad_orders_items?.forEach((item: any) => {
      initialCounts[item.id] = item.return_count ?? 0
    })
    setReturnCounts(initialCounts)
  }

  // The Master Approval Mutation
  const approveMutation = useMutation({
    mutationFn: async ({ action }: { action: "approved" | "rejected" }) => {
      if (!selectedOrder) throw new Error("No order selected")

      // STEP 1: If approving and it's specific steps, save the data first
      if (action === "approved") {
        const isWHStep =
          selectedOrder.type === "return_to_wh" &&
          selectedOrder.current_step === 1
        const isAccStep =
          selectedOrder.type === "return_to_wh" &&
          selectedOrder.current_step === 2

        if (isWHStep) {
          // Prepare items with new return_counts to update the DB
          const updatedItems = selectedOrder.bad_orders_items.map(
            (item: any) => ({
              ...item,
              return_count: returnCounts[item.id] || 0,
            })
          )
          await updateBadOrder(selectedOrder.id, { items: updatedItems })
        }

        if (isAccStep) {
          if (totalPrice === "" || Number(totalPrice) <= 0) {
            throw new Error("Total Price is required for Accounting Approval.")
          }
          await updateBadOrder(selectedOrder.id, {
            total_price: Number(totalPrice),
          })
        }
      }

      // STEP 2: Tell the Approval Engine to move forward/reject
      await processApprovalAction(selectedOrder.request_id, action, remarks)
    },
    onSuccess: () => {
      toast.success("Approval action processed successfully.")
      setSelectedOrder(null)
      queryClient.invalidateQueries({ queryKey: ["bad-order-approvals"] })
      queryClient.invalidateQueries({ queryKey: ["bad_orders"] })
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to process approval.")
    },
  })

  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "created_at",
        header: "Logged Date",
        cell: ({ row }) =>
          new Date(row.getValue("created_at")).toLocaleDateString(),
      },
      {
        accessorKey: "employee",
        header: "Requester",
        cell: ({ row }) => {
          const emp = row.original.employee
          return emp ? `${emp.first_name} ${emp.last_name}` : "Unknown"
        },
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
          const t = row.getValue("type") as string
          return (
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {t === "return_to_wh" ? "Return to WH" : "For Disposal"}
            </Badge>
          )
        },
      },
      {
        accessorKey: "current_step",
        header: "Current Step",
        cell: ({ row }) => (
          <span className="font-semibold text-amber-600">
            Step {row.getValue("current_step")}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <Button size="sm" onClick={() => handleOpenReview(row.original)}>
            <ClipboardCheck className="mr-2 h-4 w-4" /> Review
          </Button>
        ),
      },
    ],
    []
  )

  // Conditional Logic for the Modal
  const isWHStep =
    selectedOrder?.type === "return_to_wh" && selectedOrder?.current_step === 1
  const isAccStep =
    selectedOrder?.type === "return_to_wh" && selectedOrder?.current_step === 2

  return (
    <div className="flex flex-col space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bad Order Approvals
        </h1>
        <p className="text-sm text-muted-foreground">
          Review and process bad order requests pending your department's
          approval.
        </p>
      </div>

      <DataTable
        title="Pending Approvals"
        description="Tasks awaiting your action."
        entityName="Request"
        columns={columns}
        data={data?.data ?? []}
        rowCount={data?.rowCount ?? 0}
        isLoading={isLoading}
        searchPlaceholder="Search notes or type..."
        globalFilter={globalFilter}
        onSearchChange={setGlobalFilter}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        renderForm={() => <></>}
      />

      {/* REVIEW DIALOG */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Bad Order</DialogTitle>
            <DialogDescription>
              {selectedOrder?.employee?.first_name} requested a{" "}
              <strong>
                {selectedOrder?.type === "return_to_wh"
                  ? "Return to Warehouse"
                  : "Disposal"}
              </strong>{" "}
              at {selectedOrder?.outlets?.outlet_name}.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 py-4">
              {/* Requester Notes */}
              {selectedOrder.notes && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <strong>Notes:</strong> {selectedOrder.notes}
                </div>
              )}

              {/* Items Table */}
              <div className="rounded-md border">
                <UITable>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="w-[100px] text-center">
                        Req. Qty
                      </TableHead>
                      {/* Only show Return Count if Return to WH */}
                      {selectedOrder.type === "return_to_wh" && (
                        <TableHead className="w-[150px] text-center">
                          {isWHStep ? "Input Count *" : "Verified Count"}
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.bad_orders_items?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.skus?.sku_code} - {item.skus?.item_name}
                        </TableCell>
                        <TableCell>{item.reason}</TableCell>
                        <TableCell className="text-center">
                          {item.qty}
                        </TableCell>

                        {selectedOrder.type === "return_to_wh" && (
                          <TableCell className="text-center">
                            {isWHStep ? (
                              <Input
                                type="number"
                                min={0}
                                className="h-8 text-center"
                                value={returnCounts[item.id] || ""}
                                onChange={(e) =>
                                  setReturnCounts((prev) => ({
                                    ...prev,
                                    [item.id]: Number(e.target.value),
                                  }))
                                }
                              />
                            ) : (
                              <Badge variant="secondary">
                                {item.return_count ?? 0}
                              </Badge>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </UITable>
              </div>

              {/* Step 2: Accounting Input */}
              {isAccStep && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                  <label className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                    Accounting: Total Price Calculation{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <p className="mb-3 text-xs text-amber-700/70 dark:text-amber-400/70">
                    Warehouse has verified the counts above. Please input the
                    total assessed value for this return.
                  </p>
                  <div className="relative max-w-xs">
                    <span className="absolute top-2.5 left-3 text-sm text-muted-foreground">
                      ₱
                    </span>
                    <Input
                      type="number"
                      className="pl-7"
                      placeholder="0.00"
                      value={totalPrice}
                      onChange={(e) =>
                        setTotalPrice(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      } /* FIX 2: Safely cast to Number or empty string */
                    />
                  </div>
                </div>
              )}

              {/* Remarks Box */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Approval/Rejection Remarks
                </label>
                <Textarea
                  placeholder="Optional notes for this action..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="destructive"
              onClick={() => approveMutation.mutate({ action: "rejected" })}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reject
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => approveMutation.mutate({ action: "approved" })}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isWHStep
                ? "Save Counts & Approve"
                : isAccStep
                  ? "Save Price & Approve"
                  : "Approve Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
