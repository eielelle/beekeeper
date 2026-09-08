// type
// queries

import { FetchParams } from "@/types/fetch-params"

export type SttStoreType = {
  id?: string
  created_at?: string
  org_id?: number
  outlet_id: number | string
  sku_id: number | string
  qty: number
  created_by?: number | string | null
  // Joined relations
  skus?: {
    id: number | string
    sku_code: string
    item_name: string
  } | null
  outlets?: {
    id: number | string
    outlet_code: string
    outlet_name: string
  } | null
}

type TicketType = {
  id?: string
  created_at?: string
  org_id?: number
  title: string
  description: string
  ticket_status_id: number
}

// create ticket
export async function createTicket(payload: TicketType) {}

// update status
export async function updateTicketStatus(id: string, statusId: number) {}

// view
export async function viewTicket(id: string) {}

export async function fetchTickets(params: FetchParams) {}
