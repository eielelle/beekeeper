"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Store,
  PackageSearch,
  Loader2,
  Check,
  MapPin,
  Building,
  Network,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  ChevronsUpDown,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

import { salesBookingSchema } from "@/forms/schemas/sales_booking.schema"
import {
  fetchOutlets,
  createSalesBooking,
  CartItem,
  Outlet,
} from "@/forms/queries/sales_booking.query"
import { useCurrentEmployee } from "@/hooks/use-current-employee"

export default function CheckoutPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { employee } = useCurrentEmployee()

  // --- LOCAL STATE ---
  const [cart, setCart] = React.useState<CartItem[]>([])
  const [selectedOutlet, setSelectedOutlet] = React.useState<Outlet | null>(
    null
  )
  const [isClient, setIsClient] = React.useState(false)

  // Combobox & Debounce State
  const [openCombobox, setOpenCombobox] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")

  // Handle Debounce
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Load cart on mount
  React.useEffect(() => {
    setIsClient(true)
    const savedCart = localStorage.getItem("b2b_cart")
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }, [])

  // Sync cart changes to localStorage
  const updateCartStorage = (updatedCart: CartItem[]) => {
    setCart(updatedCart)
    localStorage.setItem("b2b_cart", JSON.stringify(updatedCart))
  }

  const setCartItemQty = (id: number, newQty: number) => {
    const updated = cart.map((item) => {
      if (item.id === id) {
        return { ...item, qty: newQty }
      }
      return item
    })
    updateCartStorage(updated)
  }

  const toggleSample = (id: number, isSample: boolean) => {
    const updated = cart.map((item) =>
      item.id === id ? { ...item, is_sample: isSample } : item
    )
    updateCartStorage(updated)
  }

  const removeItem = (id: number) => {
    const updated = cart.filter((item) => item.id !== id)
    updateCartStorage(updated)
    if (updated.length === 0) {
      localStorage.removeItem("b2b_cart")
    }
  }

  // --- FETCH OUTLETS WITH DEBOUNCED SEARCH ---
  const { data: outlets = [], isLoading: isLoadingOutlets } = useQuery({
    queryKey: ["outlets", debouncedSearch],
    queryFn: () => fetchOutlets(debouncedSearch),
  })

  // --- MUTATION ---
  const mutation = useMutation({
    mutationFn: (values: any) =>
      createSalesBooking({
        values,
        cart,
        employeeId: employee!.id,
        selectedOutlet: selectedOutlet!,
      }),
    onSuccess: () => {
      toast.success("Order booked successfully!")
      queryClient.invalidateQueries({ queryKey: ["sales_bookings"] })
      localStorage.removeItem("b2b_cart")
      router.push("/d/sales-booking")
    },
    onError: (error: any) => {
      toast.error(error.message)
    },
  })

  // --- FORM ---
  const form = useForm({
    defaultValues: {
      outlet_id: "",
      notes: "",
    },
    validators: {
      onSubmit: salesBookingSchema as any,
    },
    onSubmit: async ({ value }) => {
      if (!employee?.id) {
        toast.error("Employee data is missing.")
        return
      }
      if (!selectedOutlet) {
        toast.error("Please select a valid outlet.")
        return
      }
      if (cart.length === 0) {
        toast.error("Your cart is empty.")
        return
      }
      mutation.mutate(value)
    },
  })

  if (!isClient) return null

  if (cart.length === 0) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center p-8">
        <PackageSearch className="mb-4 h-16 w-16 text-muted-foreground opacity-50" />
        <h2 className="mb-2 text-xl font-semibold">Your cart is empty</h2>
        <p className="mb-6 text-muted-foreground">
          You need to add items before checking out.
        </p>
        <Button onClick={() => router.push("/d/sales-booking")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Return to Catalog
        </Button>
      </div>
    )
  }

  const totalItems = cart.reduce((count, item) => count + item.qty, 0)
  const sampleItemsCount = cart
    .filter((i) => i.is_sample)
    .reduce((c, i) => c + i.qty, 0)

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      {/* Page Header */}
      <div className="mb-8 flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/d/sales-booking")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>
          <p className="text-sm text-muted-foreground">
            Review your order details and select an outlet.
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="grid gap-8 lg:grid-cols-12"
      >
        {/* LEFT COLUMN - Outlet & Notes (5 Cols) */}
        <div className="space-y-6 lg:col-span-5">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
              <CardDescription>
                Select the outlet for this booking.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Searchable Combobox for Outlets */}
              <form.Field name="outlet_id">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel>
                        Select Outlet{" "}
                        <span className="text-destructive">*</span>
                      </FieldLabel>

                      <Popover
                        open={openCombobox}
                        onOpenChange={setOpenCombobox}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openCombobox}
                            className="w-full justify-between font-normal"
                          >
                            {selectedOutlet
                              ? `${selectedOutlet.outlet_name} (${selectedOutlet.outlet_code})`
                              : "Search outlet by name or code..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[--radix-popover-trigger-width] p-0"
                          align="start"
                        >
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Type to search outlet..."
                              value={searchQuery}
                              onValueChange={setSearchQuery}
                            />
                            <CommandList>
                              {isLoadingOutlets ? (
                                <div className="flex h-20 items-center justify-center">
                                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                              ) : outlets.length === 0 ? (
                                <CommandEmpty>No outlets found.</CommandEmpty>
                              ) : (
                                <CommandGroup>
                                  {outlets.map((o) => (
                                    <CommandItem
                                      key={o.id}
                                      value={o.id.toString()}
                                      onSelect={() => {
                                        field.handleChange(o.id.toString())
                                        setSelectedOutlet(o)
                                        setOpenCombobox(false)
                                      }}
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${
                                          selectedOutlet?.id === o.id
                                            ? "opacity-100"
                                            : "opacity-0"
                                        }`}
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-medium">
                                          {o.outlet_name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          Code: {o.outlet_code}
                                        </span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              </form.Field>

              {/* Outlet Snapshot Preview UI */}
              {selectedOutlet && (
                <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                  {selectedOutlet.distributor && (
                    <div className="mb-2 flex items-center gap-2 rounded bg-primary/10 px-2 py-1.5 text-xs font-medium text-primary">
                      <Network className="h-3.5 w-3.5" />
                      <span>
                        Distributor: {selectedOutlet.distributor.outlet_name}
                      </span>
                    </div>
                  )}

                  <h4 className="flex items-center gap-2 font-semibold">
                    <Store className="h-4 w-4 text-primary" />
                    <span>
                      {selectedOutlet.outlet_name}{" "}
                      <span className="font-mono text-xs font-normal text-muted-foreground">
                        ({selectedOutlet.outlet_code})
                      </span>
                    </span>
                  </h4>

                  <div className="grid gap-2 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        {selectedOutlet.address || "No address provided."}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Building className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        {[
                          selectedOutlet.barangay,
                          selectedOutlet.city,
                          selectedOutlet.province,
                          selectedOutlet.region,
                        ]
                          .filter(Boolean)
                          .join(", ") || "No regional data provided."}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <form.Field name="notes">
                {(field) => (
                  <Field>
                    <FieldLabel>Order Notes (Optional)</FieldLabel>
                    <Textarea
                      placeholder="Any specific delivery instructions?"
                      className="resize-none"
                      rows={3}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={mutation.isPending}
                    />
                  </Field>
                )}
              </form.Field>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN - Cart Review & Management (7 Cols) */}
        <div className="space-y-6 lg:col-span-7">
          <Card>
            <CardHeader>
              <CardTitle>Review Order Items</CardTitle>
              <CardDescription>
                Adjust quantities or mark items as free samples.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="divide-y">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                  >
                    {/* Item Details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold">
                          {item.item_name}
                        </h4>
                        {item.is_sample && (
                          <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
                            Sample (Free)
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-xs text-muted-foreground">
                        {item.sku_code}
                      </p>

                      {/* Sample Checkbox */}
                      <div className="flex items-center space-x-2 pt-1">
                        <Checkbox
                          id={`sample-${item.id}`}
                          checked={item.is_sample}
                          onCheckedChange={(checked) =>
                            toggleSample(item.id, checked === true)
                          }
                        />
                        <label
                          htmlFor={`sample-${item.id}`}
                          className="cursor-pointer text-xs text-muted-foreground select-none"
                        >
                          Mark as sample item (Free)
                        </label>
                      </div>
                    </div>

                    {/* Quantity & Delete Controls */}
                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      {/* Manual Cart Qty Input */}
                      <div className="flex items-center gap-1 rounded-md border bg-background p-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            setCartItemQty(item.id, Math.max(1, item.qty - 1))
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={item.qty === 0 ? "" : item.qty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value)
                            setCartItemQty(item.id, isNaN(val) ? 0 : val)
                          }}
                          onBlur={() => {
                            if (item.qty < 1) setCartItemQty(item.id, 1)
                          }}
                          className="h-7 w-12 [appearance:textfield] border-0 p-0 text-center text-sm font-semibold shadow-none focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setCartItemQty(item.id, item.qty + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Summary Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Total Sale Items:</span>
                  <span>{totalItems - sampleItemsCount} units</span>
                </div>
                {sampleItemsCount > 0 && (
                  <div className="flex justify-between font-medium text-emerald-600">
                    <span>Total Sample (Free) Items:</span>
                    <span>{sampleItemsCount} units</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 text-base font-bold">
                  <span>Total Quantity Requested:</span>
                  <span>{totalItems} items</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={mutation.isPending || !selectedOutlet}
              >
                {mutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Confirm & Place Order
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
