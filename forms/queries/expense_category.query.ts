import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type ExpenseCategoryStoreType = {
  id?: string
  category_name: string
  category_description: string
  organization_id?: number
  created_at?: string
}

export async function fetchExpenseCategories() {
  const t = toast.loading("Fetching Expense Categories. Please wait.")

  const { data, error } = await supabase.from("expense_categories").select("*")

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return data
}

export async function getExpenseCategory(id: string) {
  const t = toast.loading("Fetching Expense Category. Please wait.")

  const { data, error } = await supabase
    .from("expense_categories")
    .select("*")
    .eq("id", id)
    .single()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return data
}

export async function createExpenseCategory(value: ExpenseCategoryStoreType) {
  const t = toast.loading("Creating Expense Category. Please wait.")

  const { data, error } = await supabase
    .from("expense_categories")
    .insert([value])

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Expense Category successfully created.")

  return data
}

export async function updateExpenseCategory(value: ExpenseCategoryStoreType) {
  const t = toast.loading("Updating Expense Category. Please wait.")

  const { id, ...updates } = value

  const { data, error } = await supabase
    .from("expense_categories")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Expense Category successfully updated.")

  return data
}
