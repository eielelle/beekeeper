"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility } from "@/lib/casl/server"
import {
  FetchProductionLinesParams,
  ProductionLineStoreType,
} from "@/forms/queries/production_line.query"

export async function getProductionPipelineAction() {}

export async function createProductionPipelineAction() {}

export async function updateProductionPipelineAction() {}

export async function deleteProductionPipelineAction() {}
