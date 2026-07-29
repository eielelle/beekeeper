"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import {
  Inbox,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  MessageSquare,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  fetchMyPendingApprovals,
  processApproval,
  PendingApproval,
} from "@/forms/queries/approval.query"

export default function ApprovalsInboxPage() {
  const queryClient = useQueryClient()

  // Fetch Pending Approvals
  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ["my-pending-approvals"],
    queryFn: fetchMyPendingApprovals,
  })

  // Action Dialog State
  const [selectedRequest, setSelectedRequest] =
    React.useState<PendingApproval | null>(null)
  const [actionType, setActionType] = React.useState<
    "approved" | "rejected" | null
  >(null)
  const [remarks, setRemarks] = React.useState("")

  // Mutation for Approving/Rejecting
  const processMutation = useMutation({
    mutationFn: processApproval,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-pending-approvals"] })
      // Also invalidate related modules so their status updates globally
      queryClient.invalidateQueries({ queryKey: ["my-leaves"] })
      queryClient.invalidateQueries({ queryKey: ["leaves"] })
      closeDialog()
    },
  })

  const formatModuleName = (mod: string) => {
    return mod
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  }

  const openDialog = (
    request: PendingApproval,
    type: "approved" | "rejected"
  ) => {
    setSelectedRequest(request)
    setActionType(type)
    setRemarks("")
  }

  const closeDialog = () => {
    setSelectedRequest(null)
    setActionType(null)
    setRemarks("")
  }

  const handleConfirmAction = () => {
    if (!selectedRequest || !actionType) return
    processMutation.mutate({
      requestId: selectedRequest.id,
      action: actionType,
      remarks: remarks.trim() === "" ? undefined : remarks,
    })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* Page Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Inbox className="h-6 w-6 text-primary" />
          Approvals Inbox
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and process requests requiring your authorization.
        </p>
      </div>

      {/* Inbox List */}
      <Card>
        <CardHeader className="border-b bg-muted/30 pb-4">
          <CardTitle className="text-lg">Pending Your Action</CardTitle>
          <CardDescription>
            You have {approvals.length} request(s) waiting in your queue.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="mb-4 h-8 w-8 animate-spin" />
              <p>Checking your inbox...</p>
            </div>
          ) : approvals.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <CheckCircle className="mb-4 h-12 w-12 text-green-500/50" />
              <p className="text-lg font-medium text-foreground">
                You're all caught up!
              </p>
              <p className="text-sm">No pending approvals at the moment.</p>
            </div>
          ) : (
            <div className="divide-y">
              {approvals.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col justify-between gap-4 p-6 transition-colors hover:bg-muted/10 sm:flex-row sm:items-center"
                >
                  {/* Request Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-primary/5 text-primary"
                      >
                        {formatModuleName(request.module)}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Step {request.current_step}
                      </Badge>
                    </div>
                    <h3 className="mt-2 text-base font-semibold">
                      {request.requester?.first_name}{" "}
                      {request.requester?.last_name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Submitted{" "}
                      {formatDistanceToNow(new Date(request.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      System Reference ID:{" "}
                      <span className="font-mono">{request.record_id}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex w-full items-center gap-3 sm:mt-0 sm:w-auto">
                    <Button
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto"
                      onClick={() => openDialog(request, "rejected")}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      className="w-full bg-green-600 text-white hover:bg-green-700 sm:w-auto"
                      onClick={() => openDialog(request, "approved")}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog (Approve / Reject) */}
      <Dialog
        open={!!selectedRequest}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {actionType === "approved" ? "Approve" : "Reject"} Request
            </DialogTitle>
            <DialogDescription>
              You are about to {actionType} the{" "}
              {selectedRequest ? formatModuleName(selectedRequest.module) : ""}{" "}
              request for{" "}
              <span className="font-semibold text-foreground">
                {selectedRequest?.requester?.first_name}{" "}
                {selectedRequest?.requester?.last_name}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              Remarks (Optional)
            </label>
            <Textarea
              placeholder={
                actionType === "rejected"
                  ? "Please provide a reason for rejection..."
                  : "Add any notes..."
              }
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="resize-none"
              rows={3}
              disabled={processMutation.isPending}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              disabled={processMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={processMutation.isPending}
              variant={actionType === "rejected" ? "destructive" : "default"}
              className={
                actionType === "approved"
                  ? "bg-green-600 hover:bg-green-700"
                  : ""
              }
            >
              {processMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm {actionType === "approved" ? "Approval" : "Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
