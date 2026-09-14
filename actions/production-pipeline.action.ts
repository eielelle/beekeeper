"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility } from "@/lib/casl/server"
import { ProductionPipelineFormValues } from "@/forms/schemas/production-pipeline.schema"
import { FetchParams } from "@/types/fetch-params"

export async function fetchProductionPipelinesAction(params: FetchParams) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "production_pipelines")) {
    throw new Error("Forbidden: You do not have permission to view pipelines.")
  }

  const supabase = await createClient()

  let query = supabase.from("production_pipelines").select(
    `
    *,
    department:departments(name, code),
    steps:production_pipeline_steps(count)
    `,
    { count: "exact" }
  )

  if (params.globalFilter) {
    query = query.or(
      `name.ilike.%${params.globalFilter}%,description.ilike.%${params.globalFilter}%`
    )
  }

  if (params.columnFilters && params.columnFilters.length > 0) {
    params.columnFilters.forEach((filter) => {
      const { id, value } = filter
      if (typeof value === "string") {
        query = query.ilike(id, `%${value}%`)
        return
      }

      switch (value.operator) {
        case "range":
          if (value.min !== null && value.min !== undefined && value.min !== "")
            query = query.gte(id, value.min)
          if (value.max !== null && value.max !== undefined && value.max !== "")
            query = query.lte(id, value.max)
          break
        case "in":
          query = query.in(id, value.values)
          break
        case "eq":
          query = query.eq(id, value.value)
          break
        case "ilike":
          query = query.ilike(id, `%${String(value.value)}%`)
          break
      }
    })
  }

  if (params.sorting && params.sorting.length > 0) {
    const sort = params.sorting[0]
    query = query.order(sort.id, { ascending: !sort.desc })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  const from = params.pageIndex * params.pageSize
  const to = from + params.pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data, rowCount: count || 0 }
}

export async function getProductionPipelineAction(id: string) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "production_pipelines")) {
    throw new Error("Forbidden: You cannot view this pipeline.")
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("production_pipelines")
    .select(`*, steps:production_pipeline_steps(*)`)
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function createProductionPipelineAction(
  value: ProductionPipelineFormValues
) {
  const ability = await getServerAbility()
  if (ability.cannot("create", "production_pipelines")) {
    throw new Error(
      "Forbidden: You do not have permission to create pipelines."
    )
  }

  const supabase = await createClient()

  const { steps, department_id, ...pipelineData } = value

  const { data: pipeline, error: pipeError } = await supabase
    .from("production_pipelines")
    // Use the first step as the pipeline name since the name input is hidden
    .insert([
      {
        ...pipelineData,
        name: steps[0]?.step_name || "New Pipeline",
        department_id: Number(department_id),
      },
    ])
    .select()
    .single()

  if (pipeError) throw new Error(pipeError.message)

  let previousStepId = null
  for (let i = 0; i < steps.length; i++) {
    const { data: step, error: stepError } = await supabase
      .from("production_pipeline_steps")
      .insert([
        {
          pipeline_id: pipeline.id,
          step_name: steps[i].step_name,
          step_order: i + 1,
          depends_on_step_id: previousStepId,
        },
      ])
      .select()
      .single()

    if (stepError) throw new Error(stepError.message)
    previousStepId = step.id
  }

  return pipeline
}

// ----------------------------------------------------------------------
// Update Pipeline & Reorder Steps
// ----------------------------------------------------------------------
export async function updateProductionPipelineAction(
  value: ProductionPipelineFormValues & {
    id: string
    created_at?: string
    org_id?: number
  }
) {
  const ability = await getServerAbility()
  if (ability.cannot("update", "production_pipelines")) {
    throw new Error(
      "Forbidden: You do not have permission to update pipelines."
    )
  }

  const supabase = await createClient()

  const { id, steps, created_at, org_id, department_id, ...updates } = value
  if (!id) throw new Error("Pipeline ID is required for updates.")

  // 1. Update Pipeline Header
  const { data: pipeline, error: pipeError } = await supabase
    .from("production_pipelines")
    .update({
      ...updates,
      name: steps[0]?.step_name || "New Pipeline",
      department_id: Number(department_id),
    })
    .eq("id", id)
    .select()
    .single()

  if (pipeError) throw new Error(pipeError.message)

  // 2. Clear all dependencies temporarily to prevent FK constraint violations during reorder/delete
  await supabase
    .from("production_pipeline_steps")
    .update({ depends_on_step_id: null })
    .eq("pipeline_id", id)

  // 3. Fetch existing steps
  const { data: existingSteps } = await supabase
    .from("production_pipeline_steps")
    .select("id")
    .eq("pipeline_id", id)

  // 4. Delete removed steps
  const payloadIds = steps.filter((s) => s.id).map((s) => s.id)
  const stepsToDelete =
    existingSteps
      ?.filter((es) => !payloadIds.includes(es.id))
      .map((es) => es.id) || []

  if (stepsToDelete.length > 0) {
    const { error: delError } = await supabase
      .from("production_pipeline_steps")
      .delete()
      .in("id", stepsToDelete)
    if (delError)
      throw new Error(
        "Cannot delete step: it may be in use by an active production run."
      )
  }

  // 5. Temporarily offset remaining steps to prevent "unique_step_order" constraint violation
  const remainingSteps =
    existingSteps?.filter((es) => !stepsToDelete.includes(es.id)) || []
  for (let i = 0; i < remainingSteps.length; i++) {
    await supabase
      .from("production_pipeline_steps")
      .update({ step_order: 10000 + i }) // Move them safely out of the 1-N range temporarily
      .eq("id", remainingSteps[i].id)
  }

  // 6. Upsert steps sequentially to rebuild the depends_on_step_id chain and apply new order
  let previousStepId = null
  for (let i = 0; i < steps.length; i++) {
    const stepPayload = {
      pipeline_id: id,
      step_name: steps[i].step_name,
      step_order: i + 1, // Safe to assign now
      depends_on_step_id: previousStepId,
    }

    let currentStep
    if (steps[i].id) {
      const { data, error } = await supabase
        .from("production_pipeline_steps")
        .update(stepPayload)
        .eq("id", steps[i].id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      currentStep = data
    } else {
      const { data, error } = await supabase
        .from("production_pipeline_steps")
        .insert([stepPayload])
        .select()
        .single()
      if (error) throw new Error(error.message)
      currentStep = data
    }
    previousStepId = currentStep.id
  }

  return pipeline
}

export async function deleteProductionPipelineAction(id: string) {
  const ability = await getServerAbility()
  if (ability.cannot("delete", "production_pipelines")) {
    throw new Error(
      "Forbidden: You do not have permission to delete pipelines."
    )
  }

  const supabase = await createClient()

  await supabase
    .from("production_pipeline_steps")
    .delete()
    .eq("pipeline_id", id)

  const { data, error } = await supabase
    .from("production_pipelines")
    .delete()
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
