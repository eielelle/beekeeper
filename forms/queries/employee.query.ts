import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export type UserType = {
  id: number
  user_id: string
  employee_no: string
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  gender: string
  team_id: number | null
  agency_id: number | null
  employment_start: string
  employment_end: string | null
  superuser: boolean
  created_at?: string
}

const queryKey = ["users"]

// =================
// GET ALL
// =================

async function getUsers(): Promise<UserType[]> {
  const res = await fetch("/api/v1/users")

  if (!res.ok) {
    throw new Error("Failed to fetch users")
  }

  return res.json()
}

// =================
// GET ONE
// =================

async function getUser(id: number): Promise<UserType> {
  const res = await fetch(`/api/v1/users/${id}`)

  if (!res.ok) {
    throw new Error("Failed to fetch user")
  }

  return res.json()
}

// =================
// CREATE
// =================

export type CreateUserInput = {
  employee_no: string

  first_name?: string

  last_name?: string

  email: string

  phone?: string

  gender: string

  team_id?: number

  agency_id?: number

  employment_start: string

  employment_end?: string

  password: string
}

async function createUser(data: CreateUserInput) {
  const res = await fetch("/api/v1/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  console.log("Status:", res.status)
  console.log("Content-Type:", res.headers.get("content-type"))

  const text = await res.text()
  console.log("Response:", text)

  if (!res.ok) {
    throw new Error(text)
  }

  return JSON.parse(text)
}

// =================
// UPDATE
// =================

async function updateUser(
  user: Partial<UserType> & {
    id: number
  }
) {
  const res = await fetch(`/api/v1/users/${user.id}`, {
    method: "PUT",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(user),
  })

  if (!res.ok) {
    throw new Error("Failed to update user")
  }

  return res.json()
}

// =================
// DELETE
// =================

async function deleteUser(id: number) {
  const res = await fetch(`/api/v1/users/${id}`, {
    method: "DELETE",
  })

  if (!res.ok) {
    throw new Error("Failed to delete user")
  }

  return id
}

// =================
// QUERY HOOKS
// =================

export function useUsers() {
  return useQuery({
    queryKey,
    queryFn: getUsers,
  })
}

export function useUser(id: number) {
  return useQuery({
    queryKey: [...queryKey, id],

    queryFn: () => getUser(id),

    enabled: !!id,
  })
}

// =================
// MUTATION HOOKS
// =================

export function useCreateUser() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: createUser,

    onSuccess: (response) => {
      client.setQueryData<UserType[]>(queryKey, (old = []) => [
        response.profile,
        ...old,
      ])
    },
  })
}

export function useUpdateUser() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: updateUser,

    onSuccess: (updated) => {
      client.setQueryData<UserType[]>(queryKey, (old = []) =>
        old.map((user) => (user.id === updated.id ? updated : user))
      )

      client.setQueryData([...queryKey, updated.id], updated)
    },
  })
}

export function useDeleteUser() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: deleteUser,

    onSuccess: (deletedId) => {
      client.setQueryData<UserType[]>(queryKey, (old = []) =>
        old.filter((user) => user.id !== deletedId)
      )
    },
  })
}
