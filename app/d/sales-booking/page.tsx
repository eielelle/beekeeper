"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Store,
  Tag,
  Loader2,
  PackageSearch,
  LayoutGrid,
  List,
  ArrowRight,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

import {
  fetchCatalog,
  SKU,
  CartItem,
} from "@/forms/queries/sales_booking.query"

export default function SalesBookingPage() {
  const router = useRouter()

  // --- STATE ---
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All")
  const [cart, setCart] = React.useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid")

  // Pre-add quantity tracker
  const [pendingQty, setPendingQty] = React.useState<Record<number, number>>({})

  const getPendingQty = (id: number) => pendingQty[id] ?? 1
  const updatePendingQty = (id: number, qty: number) => {
    setPendingQty((prev) => ({ ...prev, [id]: qty }))
  }

  // Load cart from Local Storage on mount
  React.useEffect(() => {
    const savedCart = localStorage.getItem("b2b_cart")
    if (savedCart) setCart(JSON.parse(savedCart))
  }, [])

  // Sync cart to Local Storage
  const updateCartStorage = (updatedCart: CartItem[]) => {
    setCart(updatedCart)
    localStorage.setItem("b2b_cart", JSON.stringify(updatedCart))
  }

  // --- FETCH DATA ---
  const { data: catalog = [], isLoading: isLoadingCatalog } = useQuery({
    queryKey: ["catalog"],
    queryFn: fetchCatalog,
  })

  // --- DERIVED DATA ---
  const categories = React.useMemo(() => {
    const cats = new Set(
      catalog.map((sku) => sku.category?.category_name).filter(Boolean)
    )
    return ["All", ...Array.from(cats)] as string[]
  }, [catalog])

  const filteredCatalog = React.useMemo(() => {
    return catalog.filter((sku) => {
      const matchesSearch =
        sku.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sku.sku_code.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        selectedCategory === "All" ||
        sku.category?.category_name === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [catalog, searchQuery, selectedCategory])

  const cartItemCount = cart.reduce((count, item) => count + item.qty, 0)

  // --- CART HANDLERS ---
  const addToCart = (sku: SKU, qtyToAdd: number) => {
    // Ensure we are adding at least 1, even if they blanked out the input
    const finalQty = Math.max(1, qtyToAdd || 1)

    let updatedCart
    const existing = cart.find((item) => item.id === sku.id)
    if (existing) {
      updatedCart = cart.map((item) =>
        item.id === sku.id ? { ...item, qty: item.qty + finalQty } : item
      )
    } else {
      updatedCart = [...cart, { ...sku, qty: finalQty, is_sample: false }]
    }

    updateCartStorage(updatedCart)
    toast.success(`${finalQty}x ${sku.item_name} added to cart`)

    // Reset pending qty for this item back to 1
    updatePendingQty(sku.id, 1)
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

  const removeFromCart = (id: number) => {
    const updated = cart.filter((item) => item.id !== id)
    updateCartStorage(updated)
    if (updated.length === 0) {
      localStorage.removeItem("b2b_cart")
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-muted/20">
      {/* HEADER */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-6 py-4 shadow-sm">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Store className="h-6 w-6 text-primary" />
            B2B Ordering
          </h1>
          <p className="hidden text-sm text-muted-foreground sm:block">
            Book sales orders for your assigned outlets.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden w-64 md:block">
            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search SKUs..."
              className="bg-muted/50 pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative h-10 px-4">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Cart
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 flex h-5 w-5 justify-center rounded-full p-0">
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="flex w-full flex-col sm:max-w-lg">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Your Order Cart
                </SheetTitle>
              </SheetHeader>

              {/* Mini Cart Contents */}
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
                            {/* Manual Cart Qty Input */}
                            <div className="flex items-center gap-1 rounded-md border p-0.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() =>
                                  setCartItemQty(
                                    item.id,
                                    Math.max(1, item.qty - 1)
                                  )
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
                                  // Restore to 1 if user leaves it blank or 0
                                  if (item.qty < 1) setCartItemQty(item.id, 1)
                                }}
                                className="h-6 w-10 [appearance:textfield] border-0 p-0 text-center text-xs font-semibold shadow-none focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() =>
                                  setCartItemQty(item.id, item.qty + 1)
                                }
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>

                            <Button
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
                <div className="mt-4 border-t pt-6">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => router.push("/d/sales-booking/checkout")}
                  >
                    Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Filters */}
        <aside className="hidden w-56 overflow-y-auto border-r bg-background p-4 md:block">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Tag className="h-4 w-4" /> Categories
          </h3>
          <div className="space-y-1">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "secondary" : "ghost"}
                className={`w-full justify-start text-sm ${selectedCategory === cat ? "font-semibold" : "font-normal text-muted-foreground"}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </aside>

        {/* Product Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 md:hidden">
              <Input
                type="search"
                placeholder="Search SKUs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-[140px] shrink-0">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="hidden md:flex" />

            <div className="flex items-center self-end rounded-md border bg-background p-1 sm:self-auto">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
                title="List View"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isLoadingCatalog ? (
            <div className="flex h-[50vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCatalog.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center space-y-3 rounded-lg border border-dashed bg-background">
              <PackageSearch className="h-10 w-10 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                No SKUs found matching your criteria.
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {filteredCatalog.map((sku) => {
                const qty = getPendingQty(sku.id)

                return (
                  <Card
                    key={sku.id}
                    className="group flex flex-col overflow-hidden border-transparent bg-background transition-all hover:border-border hover:shadow-md"
                  >
                    <div className="relative flex aspect-square w-full items-center justify-center bg-muted/30 p-4">
                      {sku.sku_url ? (
                        <img
                          src={sku.sku_url}
                          alt={sku.item_name}
                          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <PackageSearch className="h-12 w-12 text-muted-foreground/20" />
                      )}
                      {sku.brand && (
                        <Badge
                          variant="secondary"
                          className="absolute top-2 left-2 bg-background/80 text-[10px] backdrop-blur-sm"
                        >
                          {sku.brand.brand_name}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="flex flex-1 flex-col p-4 pt-4">
                      <div className="mb-1 line-clamp-1 text-xs text-muted-foreground">
                        {sku.category?.category_name || "Uncategorized"}
                      </div>
                      <h3
                        className="mb-1 line-clamp-2 text-sm font-semibold"
                        title={sku.item_name}
                      >
                        {sku.item_name}
                      </h3>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="font-mono text-xs text-muted-foreground">
                          {sku.sku_code}
                        </div>
                        {sku.uom && (
                          <div className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                            {sku.uom.uom_name}
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2 p-4 pt-0">
                      {/* Manual Input Qty Counter */}
                      <div className="flex h-9 items-center rounded-md border bg-background">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-r-none"
                          onClick={() =>
                            updatePendingQty(sku.id, Math.max(1, qty - 1))
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={qty === 0 ? "" : qty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value)
                            updatePendingQty(sku.id, isNaN(val) ? 0 : val)
                          }}
                          onBlur={() => {
                            if (qty < 1) updatePendingQty(sku.id, 1)
                          }}
                          className="h-8 w-10 [appearance:textfield] border-0 p-0 text-center font-semibold shadow-none focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-l-none"
                          onClick={() => updatePendingQty(sku.id, qty + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <Button
                        className="flex-1 gap-2 transition-transform active:scale-95"
                        onClick={() => addToCart(sku, qty)}
                      >
                        Add
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col space-y-3">
              {filteredCatalog.map((sku) => {
                const qty = getPendingQty(sku.id)

                return (
                  <div
                    key={sku.id}
                    className="flex flex-col justify-between gap-4 rounded-lg border bg-background p-4 transition-all hover:shadow-sm sm:flex-row sm:items-center"
                  >
                    <div className="flex flex-col">
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="text-sm font-semibold">
                          {sku.item_name}
                        </h3>
                        {sku.brand && (
                          <Badge variant="secondary" className="text-[10px]">
                            {sku.brand.brand_name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">{sku.sku_code}</span>
                        <span className="hidden sm:inline">&bull;</span>
                        <span>
                          {sku.category?.category_name || "Uncategorized"}
                        </span>
                        {sku.uom && (
                          <>
                            <span className="hidden sm:inline">&bull;</span>
                            <span>{sku.uom.uom_name}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
                      {/* Manual Input Qty Counter */}
                      <div className="flex h-9 items-center rounded-md border bg-background">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-r-none"
                          onClick={() =>
                            updatePendingQty(sku.id, Math.max(1, qty - 1))
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={qty === 0 ? "" : qty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value)
                            updatePendingQty(sku.id, isNaN(val) ? 0 : val)
                          }}
                          onBlur={() => {
                            if (qty < 1) updatePendingQty(sku.id, 1)
                          }}
                          className="h-8 w-10 [appearance:textfield] border-0 p-0 text-center font-semibold shadow-none focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-l-none"
                          onClick={() => updatePendingQty(sku.id, qty + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <Button
                        className="flex-1 gap-2 transition-transform active:scale-95 sm:flex-none"
                        onClick={() => addToCart(sku, qty)}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
