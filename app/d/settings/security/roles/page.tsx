"use client"

import { useEffect, useState, useMemo } from "react"
import { useCurrentEmployee } from "@/hooks/use-current-employee"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Plus, Loader2, Pencil, Trash2 } from "lucide-react"

import {
  fetchPermissions,
  fetchRoles,
  createRole,
  updateRole,
  deleteRole,
  Permission,
  Role,
} from "@/forms/queries/role.query"

export default function RolesAndPermissionsPage() {
  const { orgId, isLoading: isAuthLoading } = useCurrentEmployee()

  const [permissions, setPermissions] = useState<Permission[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isDataLoading, setIsDataLoading] = useState(true)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null)

  const [newRoleName, setNewRoleName] = useState("")
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>(
    []
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsDataLoading(true)
    const [permsData, rolesData] = await Promise.all([
      fetchPermissions(),
      fetchRoles(),
    ])
    setPermissions(permsData)
    setRoles(rolesData)
    setIsDataLoading(false)
  }

  const groupedPermissions = useMemo(() => {
    return permissions.reduce(
      (acc, permission) => {
        const firstUnderscoreIdx = permission.name.indexOf("_")

        let moduleName = "general"
        let actionName = permission.name

        if (firstUnderscoreIdx !== -1) {
          actionName = permission.name.slice(0, firstUnderscoreIdx)
          moduleName = permission.name
            .slice(firstUnderscoreIdx + 1)
            .replace(/_/g, " ")
        }

        if (!acc[moduleName]) acc[moduleName] = []
        acc[moduleName].push({
          id: permission.id,
          action: actionName,
          fullString: permission.name,
        })
        return acc
      },
      {} as Record<string, { id: number; action: string; fullString: string }[]>
    )
  }, [permissions])

  const handleTogglePermission = (permId: number) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId]
    )
  }

  const handleToggleModule = (
    modulePermissions: { id: number }[],
    isChecked: boolean
  ) => {
    const moduleIds = modulePermissions.map((p) => p.id)
    if (isChecked) {
      setSelectedPermissionIds((prev) =>
        Array.from(new Set([...prev, ...moduleIds]))
      )
    } else {
      setSelectedPermissionIds((prev) =>
        prev.filter((id) => !moduleIds.includes(id))
      )
    }
  }

  // --- Reset Form State ---
  const resetForm = () => {
    setEditingRoleId(null)
    setNewRoleName("")
    setSelectedPermissionIds([])
  }

  // --- Handlers for Edit and Delete ---
  const handleEditClick = (role: Role) => {
    setEditingRoleId(role.id)
    setNewRoleName(role.role_name)

    // Map the string permissions back to their exact IDs
    const permIds = permissions
      .filter((p) => role.permissions.includes(p.name))
      .map((p) => p.id)

    setSelectedPermissionIds(permIds)
    setIsDialogOpen(true)
  }

  const handleDeleteClick = async (roleId: number) => {
    if (!window.confirm("Are you sure you want to delete this role?")) return

    try {
      await deleteRole(roleId)
      await loadData()
    } catch (error) {
      console.error(error)
    }
  }

  const handleSaveRole = async () => {
    if (!newRoleName.trim() || selectedPermissionIds.length === 0 || !orgId)
      return

    setIsSubmitting(true)
    try {
      const payload = {
        role_name: newRoleName,
        org_id: orgId,
        permission_ids: selectedPermissionIds,
      }

      if (editingRoleId) {
        await updateRole(editingRoleId, payload)
      } else {
        await createRole(payload)
      }

      await loadData() // Refresh list
      resetForm()
      setIsDialogOpen(false)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isAuthLoading || isDataLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-8 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Roles & Permissions
          </h1>
          <p className="text-muted-foreground">
            Manage organizational roles and system access.
          </p>
        </div>

        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (!open) resetForm()
            setIsDialogOpen(open)
          }}
        >
          <DialogTrigger asChild>
            <Button disabled={!orgId}>
              <Plus className="mr-2 h-4 w-4" /> Add Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRoleId ? "Edit Role" : "Create New Role"}
              </DialogTitle>
              <DialogDescription>
                Define the role and assign its specific permissions.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="role-name">Role Name</Label>
                <Input
                  id="role-name"
                  placeholder="e.g., Warehouse Manager"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <Label>Permissions Configurator</Label>

                <Accordion type="multiple" className="w-full rounded-md border">
                  {Object.entries(groupedPermissions).map(([module, perms]) => {
                    const allSelected = perms.every((p) =>
                      selectedPermissionIds.includes(p.id)
                    )
                    const someSelected = perms.some((p) =>
                      selectedPermissionIds.includes(p.id)
                    )

                    return (
                      <AccordionItem
                        key={module}
                        value={module}
                        className="px-4"
                      >
                        <div className="flex w-full items-center justify-between">
                          <div className="z-10 flex flex-shrink-0 items-center space-x-3 py-4">
                            <Checkbox
                              id={`module-${module}`}
                              checked={
                                allSelected
                                  ? true
                                  : someSelected
                                    ? "indeterminate"
                                    : false
                              }
                              onCheckedChange={(checked) =>
                                handleToggleModule(perms, checked === true)
                              }
                            />
                          </div>

                          <AccordionTrigger className="ml-2 font-semibold capitalize hover:no-underline">
                            {module}
                            <Badge
                              variant={someSelected ? "default" : "secondary"}
                              className="ml-3 text-xs opacity-80"
                            >
                              {
                                perms.filter((p) =>
                                  selectedPermissionIds.includes(p.id)
                                ).length
                              }{" "}
                              / {perms.length}
                            </Badge>
                          </AccordionTrigger>
                        </div>

                        <AccordionContent className="pb-4 pl-9">
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {perms.map((perm) => (
                              <div
                                key={perm.id}
                                className="flex items-center space-x-2 rounded border p-2 shadow-sm transition-colors hover:bg-muted/50"
                              >
                                <Checkbox
                                  id={`perm-${perm.id}`}
                                  checked={selectedPermissionIds.includes(
                                    perm.id
                                  )}
                                  onCheckedChange={() =>
                                    handleTogglePermission(perm.id)
                                  }
                                />
                                <Label
                                  htmlFor={`perm-${perm.id}`}
                                  className="flex-grow cursor-pointer text-sm font-medium capitalize"
                                >
                                  {perm.action}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveRole}
                disabled={
                  isSubmitting ||
                  !newRoleName.trim() ||
                  selectedPermissionIds.length === 0 ||
                  !orgId
                }
              >
                {isSubmitting
                  ? "Saving..."
                  : editingRoleId
                    ? "Save Changes"
                    : "Save Role"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Existing Roles</CardTitle>
          <CardDescription>
            A list of all roles currently configured in your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Role Name</TableHead>
                <TableHead>Permissions Count</TableHead>
                <TableHead>Quick View</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    {role.role_name}
                  </TableCell>
                  <TableCell>{role.permissions.length} permissions</TableCell>
                  <TableCell className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((perm) => (
                      <Badge key={perm} variant="secondary" className="text-xs">
                        {perm}
                      </Badge>
                    ))}
                    {role.permissions.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{role.permissions.length - 3} more
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(role)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDeleteClick(role.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {roles.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-6 text-center text-muted-foreground"
                  >
                    No roles found. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
