"use client"

import { createContext, useContext, useMemo } from "react"
import { AbilityBuilder, createMongoAbility } from "@casl/ability"
import { AppAbility } from "@/lib/casl/factory"

export const AbilityContext = createContext<AppAbility>(createMongoAbility([]))

export function CaslProvider({
  children,
  permissions,
  isSuperuser,
}: {
  children: React.ReactNode
  permissions: string[]
  isSuperuser: boolean
}) {
  const ability = useMemo(() => {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility)

    if (isSuperuser) {
      can("manage", "all")
      return build()
    }

    permissions.forEach((perm) => {
      switch (perm) {
        case "read_employee":
          can("read", "employees")
          break
        case "create_employee":
          can("create", "employees")
          break
        case "update_employee":
          can("update", "employees")
          break
        case "delete_employee":
          can("delete", "employees")
          break

        case "read_my_attendances":
        case "read_all_attendances":
          can("read", "attendances")
          break
        case "create_attendance":
          can("create", "attendances")
          break
        case "update_attendance":
          can("update", "attendances")
          break
        case "delete_attendance":
          can("delete", "attendances")
          break

        case "read_my_leaves":
        case "read_all_leaves":
          can("read", "leaves")
          break
        case "create_leave":
          can("create", "leaves")
          break
        case "update_leave":
          can("update", "leaves")
          break
        case "delete_leave":
          can("delete", "leaves")
          break

        case "read_my_inventory":
        case "read_all_inventory":
          can("read", "inventories")
          break
        case "create_inventory":
          can("create", "inventories")
          break
        case "update_inventory":
          can("update", "inventories")
          break
        case "delete_inventory":
          can("delete", "inventories")
          break

        case "read_my_visits":
        case "read_all_visits":
          can("read", "visits")
          break
        case "create_visit":
          can("create", "visits")
          break
        case "update_visit":
          can("update", "visits")
          break
        case "delete_visit":
          can("delete", "visits")
          break

        case "read_assigned_outlets":
        case "read_all_outlets":
          can("read", "outlets")
          break
        case "create_outlet":
          can("create", "outlets")
          break
        case "update_outlet":
          can("update", "outlets")
          break
        case "delete_outlet":
          can("delete", "outlets")
          break
        case "assign_outlets":
          can("assign", "outlets")
          break

        case "read_my_bookings":
        case "read_all_bookings":
          can("read", "sales_bookings")
          break
        case "create_booking":
          can("create", "sales_bookings")
          break
        case "update_booking":
          can("update", "sales_bookings")
          break
        case "delete_booking":
          can("delete", "sales_bookings")
          break
      }
    })

    can("update", "approval_requests")

    return build()
  }, [permissions, isSuperuser])

  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  )
}

export function useAppAbility() {
  const ability = useContext(AbilityContext)
  if (!ability) {
    throw new Error("useAppAbility must be used within a CaslProvider")
  }
  return ability
}
