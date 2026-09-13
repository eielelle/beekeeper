import * as z from "zod"

export const leaveSchema = z
  .object({
    leave_date_from: z.string().min(1, { message: "Start date is required." }),
    leave_date_to: z.string().min(1, { message: "End date is required." }),
    reason: z.string().min(1, { message: "Reason for leave is required." }),
  })
  .refine(
    (data) => {
      if (data.leave_date_from && data.leave_date_to) {
        return new Date(data.leave_date_to) >= new Date(data.leave_date_from)
      }
      return true
    },
    {
      message: "End date cannot be earlier than start date.",
      path: ["leave_date_to"],
    }
  )

export type LeaveFormValues = z.infer<typeof leaveSchema>
