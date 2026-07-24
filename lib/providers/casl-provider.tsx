"use client"

import * as React from "react"
import { createContext, useContext, useMemo } from "react"
import {
  AppAbility,
  buildAbility,
  AppAction,
  AppSubject,
} from "@/lib/casl/factory"

// 1. Create the React Context
const AbilityContext = createContext<AppAbility>(buildAbility([], false))

// 2. Create the Provider
export function CaslProvider({
  permissions,
  isSuperuser,
  children,
}: {
  permissions: string[]
  isSuperuser: boolean
  children: React.ReactNode
}) {
  const ability = useMemo(() => {
    return buildAbility(permissions, isSuperuser)
  }, [permissions, isSuperuser])

  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  )
}

// 3. Create a hook for manual checks (e.g., inside DataTable props)
export function useAppAbility() {
  const context = useContext(AbilityContext)
  if (!context) {
    throw new Error("useAppAbility must be used within a CaslProvider")
  }
  return context
}

// 4. Custom, strictly-typed <Can> component built natively in React.
export function Can({
  I,
  a,
  children,
  fallback = null,
}: {
  I: AppAction
  a: AppSubject
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const ability = useAppAbility()

  // ability.can() comes natively from @casl/ability core
  if (ability.can(I, a)) {
    return <>{children}</>
  }

  return <>{fallback}</>
}
