"use client"

import { useEffect, useState, useMemo } from "react"
import { supabase } from "@/lib/supabase"
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
import { Plus, Loader2 } from "lucide-react"

// Types based on your database schema
type Permission = { id: number; name: string; description: string | null }
type Role = { id: number; role_name: string; permissions: string[] }

export default function RolesAndPermissionsPage() {
  // 1. Call the custom hook to get the employee's orgId
  const { orgId, isLoading: isAuthLoading } = useCurrentEmployee()

  const [permissions, setPermissions] = useState<Permission[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isDataLoading, setIsDataLoading] = useState(true)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState("")
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>(
    []
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 2. Fetch Data on Mount
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsDataLoading(true)

    // Fetch all master permissions
    const { data: permsData, error: permsError } = await supabase
      .from("permissions")
      .select("*")
      .order("name")

    if (permsError) console.error("Error fetching permissions:", permsError)
    else setPermissions(permsData || [])

    // Fetch roles and their nested permissions
    const { data: rolesData, error: rolesError } = await supabase
      .from("roles")
      .select(
        `
        id,
        role_name,
        role_permissions (
          permissions ( name )
        )
      `
      )
      .order("created_at", { ascending: false })

    if (rolesError) {
      console.error("Error fetching roles:", rolesError)
    } else if (rolesData) {
      // Flatten the Supabase nested response into a clean array of strings for the UI
      const formattedRoles = rolesData.map((role: any) => ({
        id: role.id,
        role_name: role.role_name,
        permissions: role.role_permissions
          .map((rp: any) => rp.permissions?.name)
          .filter(Boolean), // Remove nulls if any
      }))
      setRoles(formattedRoles)
    }

    setIsDataLoading(false)
  }

  // Group permissions by module (e.g., { employees: [{ id: 1, action: 'create' }] })
  const groupedPermissions = useMemo(() => {
    return permissions.reduce(
      (acc, permission) => {
        const [module, action] = permission.name.split(".")
        if (!acc[module]) acc[module] = []
        acc[module].push({
          id: permission.id,
          action,
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

  // 3. Submit New Role to Supabase
  const handleCreateRole = async () => {
    if (!newRoleName.trim() || selectedPermissionIds.length === 0 || !orgId) {
      alert("Missing role name, permissions, or organization context.")
      return
    }

    setIsSubmitting(true)

    try {
      // Step A: Insert the Role using orgId from our hook
      const { data: newRole, error: roleError } = await supabase
        .from("roles")
        .insert({
          role_name: newRoleName,
          org_id: orgId,
        })
        .select()
        .single()

      if (roleError) throw roleError

      // Step B: Prepare and Insert the Many-to-Many Mappings
      const rolePermissionsToInsert = selectedPermissionIds.map((permId) => ({
        role_id: newRole.id,
        permission_id: permId,
      }))

      const { error: mappingError } = await supabase
        .from("role_permissions")
        .insert(rolePermissionsToInsert)

      if (mappingError) throw mappingError

      // Step C: Refresh UI State
      await fetchData() // Refetch to get updated list
      setNewRoleName("")
      setSelectedPermissionIds([])
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Failed to create role:", error)
      alert("Failed to save role. Check console for details.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show a single loader while either auth or data is fetching
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!orgId}>
              <Plus className="mr-2 h-4 w-4" /> Add Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Define a new role and assign its specific permissions.
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
                <Label>Permissions</Label>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(groupedPermissions).map(([module, perms]) => {
                    const allSelected = perms.every((p) =>
                      selectedPermissionIds.includes(p.id)
                    )
                    const someSelected = perms.some((p) =>
                      selectedPermissionIds.includes(p.id)
                    )

                    return (
                      <Card key={module} className="shadow-sm">
                        <CardHeader className="border-b pb-3">
                          <div className="flex items-center space-x-2">
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
                            <Label
                              htmlFor={`module-${module}`}
                              className="cursor-pointer text-base font-semibold capitalize"
                            >
                              {module}
                            </Label>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-4">
                          {perms.map((perm) => (
                            <div
                              key={perm.id}
                              className="flex items-center space-x-2 pl-6"
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
                                className="cursor-pointer text-sm leading-none font-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {perm.action}
                              </Label>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateRole}
                disabled={
                  isSubmitting ||
                  !newRoleName.trim() ||
                  selectedPermissionIds.length === 0 ||
                  !orgId
                }
              >
                {isSubmitting ? "Saving..." : "Save Role"}
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
                </TableRow>
              ))}
              {roles.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
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
