import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import { supabase } from "@/lib/supabase"

export type skuUomType = {
  id: string
  uom_name: string
  created_at?: string
}

const queryKey = ["sku_uoms"]

// =================
// GET ALL
// =================

async function getSkuUoms(): Promise<skuUomType[]> {
  const { data, error } = await supabase
    .from("sku_uoms")
    .select("*")
    .order("created_at", {
      ascending: false,
    })

  if (error) throw error

  return data
}

// =================
// GET ONE
// =================

async function getSkuUom(id: string): Promise<skuUomType> {
  const { data, error } = await supabase
    .from("sku_uoms")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw error

  return data
}

// =================
// CREATE
// =================

async function createSkuUom(item: Omit<skuUomType, "id">) {
  const { data, error } = await supabase
    .from("sku_uoms")
    .insert({
      uom_name: item.uom_name,
    })
    .select()
    .single()

  if (error) throw error

  return data
}

// =================
// UPDATE
// =================

async function updateSkuUom(item: skuUomType) {
  const { data, error } = await supabase
    .from("sku_uoms")
    .update({
      uom_name: item.uom_name,
    })
    .eq("id", item.id)
    .select()
    .single()

  if (error) throw error

  return data
}

// =================
// DELETE
// =================

async function deleteSkuUom(id: string) {
  const { error } = await supabase.from("sku_uoms").delete().eq("id", id)

  if (error) throw error

  return id
}

// =================
// QUERY HOOKS
// =================

export function useSkuUoms() {
  return useQuery({
    queryKey,
    queryFn: getSkuUoms,
  })
}

export function useSkuUom(id: string) {
  return useQuery({
    queryKey: [...queryKey, id],
    queryFn: () => getSkuUom(id),
    enabled: !!id,
  })
}

// =================
// MUTATION HOOKS
// =================

export function useCreateSkuUom() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: createSkuUom,

    onSuccess: (newItem) => {
      client.setQueryData<skuUomType[]>(queryKey, (old = []) => [
        newItem,
        ...old,
      ])
    },
  })
}

export function useUpdateSkuUom() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: updateSkuUom,

    onSuccess: (updated) => {
      client.setQueryData<skuUomType[]>(queryKey, (old = []) =>
        old.map((item) => (item.id === updated.id ? updated : item))
      )

      client.setQueryData([...queryKey, updated.id], updated)
    },
  })
}

export function useDeleteSkuUom() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: deleteSkuUom,

    onSuccess: (deletedId) => {
      client.setQueryData<skuUomType[]>(queryKey, (old = []) =>
        old.filter((item) => item.id !== deletedId)
      )
    },
  })
}
