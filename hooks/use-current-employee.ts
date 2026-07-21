import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { User } from "@supabase/supabase-js"

export type Employee = {
  id: number
  user_id: string
  org_id: number
  // Add other employee fields here as needed (e.g., first_name, role_id)
  [key: string]: any
}

export function useCurrentEmployee() {
  const [user, setUser] = useState<User | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAuthAndEmployee() {
      setIsLoading(true)
      setError(null)

      try {
        // 1. Get the currently authenticated user
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) throw authError

        if (authUser) {
          setUser(authUser)

          // 2. Fetch the linked employee record
          const { data: employeeData, error: empError } = await supabase
            .from("employees")
            .select("*")
            .eq("user_id", authUser.id)
            .single()

          if (empError) throw empError

          setEmployee(employeeData)
        }
      } catch (err: any) {
        console.error("Error fetching auth/employee:", err)
        setError(err.message || "Failed to load user data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAuthAndEmployee()
  }, [])

  return {
    user,
    employee,
    orgId: employee?.org_id,
    isLoading,
    error,
  }
}
