"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  GitMerge,
  Plus,
  Loader2,
  ShieldCheck,
  Settings2,
  UserCog,
  Trash2,
} from "lucide-react"

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
import { Badge } from "@/components/ui/badge"

import {
  fetchApprovalRules,
  deleteApprovalRule,
} from "@/forms/queries/approval-rule.query"
import { ApprovalRuleForm } from "@/forms/approval-rule.form"

export default function ApprovalRulesPage() {
  const queryClient = useQueryClient()
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["approval_rules"],
    queryFn: fetchApprovalRules,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteApprovalRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval_rules"] })
    },
  })

  // Format module name for display (e.g., "sales_booking" -> "Sales Booking")
  const formatModule = (mod: string) => {
    return mod
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  }

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this approval step?")) {
      await deleteMutation.mutateAsync(id)
    }
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
            Configure multi-step approval routing dynamically by role or
            department head.
          </p>
        </div>

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Rule
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto sm:max-w-md">
            <SheetHeader className="mb-6">
              <SheetTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                New Approval Rule
              </SheetTitle>
              <SheetDescription>
                Define a new step level and choose the designated approver for a
                specific module.
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
                <TableHead>Designated Approver</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : rules.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No approval rules configured. All requests will be
                    auto-approved.
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((rule: any) => (
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
                      {/* Check if this rule is dynamic (Department Head) or fixed (Role) */}
                      {rule.is_department_head ? (
                        <div className="flex items-center gap-2">
                          <UserCog className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-600">
                            Requester's Dept. Head
                          </span>
                          <Badge variant="outline" className="ml-2 text-[10px]">
                            Dynamic
                          </Badge>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                          {rule.role?.role_name || "Unknown Role"}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDelete(rule.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
