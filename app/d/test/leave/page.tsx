"use client"

import { useState } from "react"
import {
  createLeave,
  fetchMyLeaves,
  LeaveRecord,
} from "@/forms/queries/leave.query"
import {
  fetchMyPendingApprovals,
  processApproval,
  ApprovalRequestType,
} from "@/forms/queries/approval.query"

export default function TestLeavesPanel() {
  const [reason, setReason] = useState("")
  const [leaveDate, setLeaveDate] = useState("")
  const [leaves, setLeaves] = useState<LeaveRecord[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<
    ApprovalRequestType[]
  >([])
  const [loading, setLoading] = useState(false)

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason || !leaveDate) return
    await createLeave(reason, leaveDate)
    setReason("")
    setLeaveDate("")
    refreshData()
  }

  const refreshData = async () => {
    setLoading(true)
    try {
      const myLeaves = await fetchMyLeaves()
      setLeaves(myLeaves)

      const approvals = await fetchMyPendingApprovals()
      setPendingApprovals(approvals)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveReject = async (
    id: string,
    action: "approved" | "rejected"
  ) => {
    await processApproval(id, action)
    refreshData()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 rounded-xl border bg-background p-6 shadow-sm">
      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="text-xl font-bold">Leaves & Approvals Test Bench</h2>
        <button
          onClick={refreshData}
          disabled={loading}
          className="rounded-lg bg-secondary px-4 py-2 text-sm text-secondary-foreground"
        >
          {loading ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      {/* 1. APPLY LEAVE FORM */}
      <form onSubmit={handleApply} className="space-y-4">
        <h3 className="text-lg font-semibold">1. Apply for Leave</h3>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Reason for Leave"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="rounded-md border p-2"
            required
          />
          <input
            type="date"
            value={leaveDate}
            onChange={(e) => setLeaveDate(e.target.value)}
            className="rounded-md border p-2"
            required
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Submit Leave Request
        </button>
      </form>

      {/* 2. PENDING APPROVALS QUEUE */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-amber-600">
          2. My Pending Approvals Queue ({pendingApprovals.length})
        </h3>
        {pendingApprovals.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pending approvals assigned to you.
          </p>
        ) : (
          <div className="space-y-2">
            {pendingApprovals.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between rounded-md border bg-amber-50/50 p-4"
              >
                <div>
                  <p className="text-sm font-medium">
                    Module: {req.module.toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Record ID: {req.record_id} | Step: {req.current_step}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Requested By: {req.requester?.first_name}{" "}
                    {req.requester?.last_name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveReject(req.id, "approved")}
                    className="rounded bg-emerald-600 px-3 py-1 text-xs text-white"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleApproveReject(req.id, "rejected")}
                    className="rounded bg-rose-600 px-3 py-1 text-xs text-white"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. MY FILED LEAVES STATUS */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">3. My Filed Leaves History</h3>
        {leaves.length === 0 ? (
          <p className="text-sm text-muted-foreground">No leaves filed yet.</p>
        ) : (
          <div className="space-y-2">
            {leaves.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between rounded border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{l.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    Date: {l.leave_date}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-bold uppercase ${
                    l.status === "approved"
                      ? "bg-emerald-100 text-emerald-800"
                      : l.status === "rejected"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {l.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
