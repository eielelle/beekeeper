"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { GitMerge, Plus, Loader2, ShieldCheck, Settings2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet"

import { fetchApprovalRules } from "@/forms/queries/approval-rule.query"
import { ApprovalRuleForm } from "@/forms/approval-rule.form"

export default function ApprovalRulesPage() {
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["approval_rules"],
    queryFn: fetchApprovalRules,
  })

  // Format module name for display (e.g., "sales_booking" -> "Sales Booking")
  const formatModule = (mod: string) => {
    return mod
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <GitMerge className="h-6 w-6 text-primary" />
            Approval Workflows
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure multi-step approval routing based on employee roles.
          </p>
        </div>

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Rule
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                New Approval Rule
              </SheetTitle>
              <SheetDescription>
                Define a new step level and required role for a specific module.
              </SheetDescription>
            </SheetHeader>

            <ApprovalRuleForm onSuccess={() => setIsSheetOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Routing Rules</CardTitle>
          <CardDescription>
            The engine evaluates these rules sequentially to build the approval
            chain.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Target Module</TableHead>
                <TableHead className="w-[150px] text-center">
                  Step Level
                </TableHead>
                <TableHead>Required Approver Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : rules.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No approval rules configured. All requests will be
                    auto-approved.
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">
                      {formatModule(rule.module)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {rule.step_level}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                        {rule.role?.role_name || "Unknown Role"}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
