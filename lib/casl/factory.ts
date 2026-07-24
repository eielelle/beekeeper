import { createMongoAbility, MongoAbility, CreateAbility } from "@casl/ability"

// Extracting Subjects (Resources) and Actions from your DB schema
export type AppSubject =
  | "employees"
  | "outlets"
  | "inventories"
  | "visits"
  | "skus"
  | "bad_orders"
  | "productions"
  | "attendances"
  | "expenses"
  | "organization"
  | "stt"
  | "sales_groups"
  | "leaves"
  | "approvals"
  | "approval_rules"
  | "all" // special CASL keyword

export type AppAction =
  | "read"
  | "create"
  | "update"
  | "delete"
  | "manage"
  | "assign"
  | "work_info"
  | "plan"
  | "catalog"
  | "settings"

export type AppAbility = MongoAbility<[AppAction, AppSubject]>
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>

/**
 * Converts a raw list of permissions (e.g., ["outlets.create"]) into a CASL Ability.
 * This can be used on BOTH the server and the client.
 */
export function buildAbility(
  permissions: string[],
  isSuperuser: boolean
): AppAbility {
  if (isSuperuser) {
    // Grant absolute access to everything
    return createAppAbility([{ action: "manage", subject: "all" }])
  }

  // Map "subject.action" to CASL's { action, subject } format
  const rules = permissions.map((perm) => {
    const [subject, action] = perm.split(".")
    return {
      action: action as AppAction,
      subject: subject as AppSubject,
    }
  })

  return createAppAbility(rules)
}
