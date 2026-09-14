"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility, fetchUserPermissions } from "@/lib/casl/server"
import { VisitPlanFormValues } from "@/forms/schemas/visit_plan.schema"

export async function createVisitPlanAction(value: VisitPlanFormValues) {
  const ability = await getServerAbility()

  if (ability.cannot("create", "visit_plans")) {
    throw new Error(
      "Forbidden: You do not have permission to create visit plans."
    )
  }

  // Strictly enforce the logged-in user's employee ID
  const { employeeId } = await fetchUserPermissions()
  if (!employeeId) {
    throw new Error("Could not locate your employee profile.")
  }

  const supabase = await createClient()

  // 1. Insert Visit Plan
  const { data: plan, error: planError } = await supabase
    .from("visit_plans")
    .insert([
      {
        title: value.title,
        start_date: value.start_date,
        end_date: value.end_date,
        remarks: value.remarks,
        employee_id: employeeId,
      },
    ])
    .select()
    .single()

  if (planError) throw new Error(planError.message)

  // 2. Insert Visits & Link to Plan
  for (const visit of value.visits) {
    // A. Insert individual visit assigned to the active user
    const { data: newVisit, error: visitError } = await supabase
      .from("visits")
      .insert([
        {
          employee_id: employeeId,
          outlet_id: Number(visit.outlet_id),
          visit_type_id: Number(visit.visit_type_id),
          start_date: visit.start_date,
          end_date: visit.end_date,
          notes: visit.notes,
          status: "scheduled",
        },
      ])
      .select()
      .single()

    if (visitError) throw new Error(visitError.message)

    // B. Insert mapping item
    const { error: itemError } = await supabase
      .from("visit_plan_items")
      .insert([
        {
          visit_plan_id: plan.id,
          visit_id: newVisit.id,
        },
      ])

    if (itemError) throw new Error(itemError.message)
  }

  return plan
}
