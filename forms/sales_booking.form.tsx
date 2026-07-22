"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Minus,
  Plus,
  Trash2,
  PackageSearch,
  Loader2,
  Check,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// 1. Import the inferred type from your schema
import {
  salesBookingSchema,
  type SalesBookingFormValues,
} from "@/forms/schemas/sales_booking.schema"
import {
  fetchOutlets,
  createSalesBooking,
  type CartItem,
  type Outlet, // 2. Import the Outlet type
} from "@/forms/queries/sales_booking.query"
import { useCurrentEmployee } from "@/hooks/use-current-employee"

interface SalesBookingFormProps {
  cart: CartItem[]
  updateQty: (id: number, delta: number) => void
  removeFromCart: (id: number) => void
  onSuccess: () => void
}

export function SalesBookingForm({
  cart,
  updateQty,
  removeFromCart,
  onSuccess,
}: SalesBookingFormProps) {
  const queryClient = useQueryClient()
  const { employee } = useCurrentEmployee()

  const { data: outlets = [], isLoading: isLoadingOutlets } = useQuery({
    queryKey: ["outlets"],
    // 3. Wrap in an anonymous function so React Query doesn't accidentally pass the QueryContext object as the search string
    queryFn: () => fetchOutlets(),
  })

  const cartItemCount = cart.reduce((count, item) => count + item.qty, 0)

  const mutation = useMutation({
    // 4. Strongly type the mutation variables instead of using 'any'
    mutationFn: ({
      values,
      selectedOutlet,
    }: {
      values: SalesBookingFormValues
      selectedOutlet: Outlet
    }) =>
      createSalesBooking({
        values,
        cart,
        employeeId: employee!.id,
        selectedOutlet,
      }),
    onSuccess: () => {
      toast.success("Order booked successfully!")
      queryClient.invalidateQueries({ queryKey: ["sales_bookings"] })
      form.reset()
      onSuccess() // Triggers cart clear and sheet close in parent
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // 1. Remove the <SalesBookingFormValues> from useForm
  const form = useForm({
    // 2. Cast the defaultValues object instead
    defaultValues: {
      outlet_id: "",
      notes: "",
    } as SalesBookingFormValues,

    // (Optional) If you have the Zod adapter installed, you pass it here:
    // validatorAdapter: zodValidator(),

    validators: {
      onSubmit: salesBookingSchema,
    },
    onSubmit: async ({ value }) => {
      // TypeScript will now correctly know that `value` is SalesBookingFormValues!

      if (!employee?.id) {
        toast.error("Employee data is missing.")
        return
      }
      if (cart.length === 0) {
        toast.error("Your cart is empty.")
        return
      }

      const selectedOutlet = outlets.find(
        (o) => o.id.toString() === value.outlet_id
      )

      if (!selectedOutlet) {
        toast.error("Invalid outlet selected.")
        return
      }

      mutation.mutate({ values: value, selectedOutlet })
    },
  })

  return (
    <form
      className="flex h-full flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      <ScrollArea className="mt-6 flex-1 pr-4">
        {cart.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center space-y-2 text-muted-foreground">
            <PackageSearch className="h-10 w-10 opacity-20" />
            <p>Your cart is empty.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                  {item.sku_url ? (
                    <img
                      src={item.sku_url}
                      alt={item.item_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <PackageSearch className="h-6 w-6 text-muted-foreground/30" />
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h4 className="line-clamp-1 text-sm font-medium">
                      {item.item_name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {item.sku_code}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-md border p-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => updateQty(item.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-xs font-medium">
                        {item.qty}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => updateQty(item.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {cart.length > 0 && (
        <div className="mt-4 space-y-4 border-t pt-6">
          <form.Field name="outlet_id">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel>
                    Select Outlet <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    disabled={isLoadingOutlets || mutation.isPending}
                  >
                    <SelectTrigger aria-invalid={isInvalid}>
                      <SelectValue placeholder="Choose where to book..." />
                    </SelectTrigger>
                    <SelectContent>
                      {outlets.map((o) => (
                        <SelectItem key={o.id} value={o.id.toString()}>
                          {o.outlet_name} ({o.outlet_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          </form.Field>

          <form.Field name="notes">
            {(field) => (
              <Field>
                <FieldLabel>Order Notes</FieldLabel>
                <Textarea
                  placeholder="e.g., Deliver by backdoor..."
                  className="resize-none"
                  rows={2}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  disabled={mutation.isPending}
                />
              </Field>
            )}
          </form.Field>

          <div className="space-y-1.5 pt-4">
            <Separator className="mb-3" />
            <div className="flex justify-between text-sm font-semibold">
              <span>Total Requested Qty:</span>
              <span>{cartItemCount} items</span>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Confirm Booking
            </Button>
          </div>
        </div>
      )}
    </form>
  )
}
