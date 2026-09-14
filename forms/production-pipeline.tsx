"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { GripVertical, Plus, Trash2, Check, ChevronsUpDown } from "lucide-react"

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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

import {
  createProductionPipeline,
  getProductionPipeline,
  updateProductionPipeline,
} from "./queries/production-pipeline.query"
import {
  productionPipelineSchema,
  ProductionPipelineStepValue,
} from "./schemas/production-pipeline.schema"
import { fetchDepartments, getDepartment } from "./queries/department.query"
import { cn } from "@/lib/utils"

// ----------------------------------------------------------------------
// Custom Debounce Hook
// ----------------------------------------------------------------------
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

// ----------------------------------------------------------------------
// Sortable Item Component
// ----------------------------------------------------------------------
interface SortableStepItemProps {
  step: ProductionPipelineStepValue
  index: number
  isOnlyStep: boolean
  onUpdate: (val: string) => void
  onRemove: () => void
  error?: string
}

function SortableStepItem({
  step,
  index,
  isOnlyStep,
  onUpdate,
  onRemove,
  error,
}: SortableStepItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.uid })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <div className="space-y-1">
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group flex items-center gap-2 rounded-md border bg-background p-2 shadow-sm transition-colors",
          isDragging
            ? "border-primary opacity-90 shadow-md"
            : "hover:border-primary/50",
          error && "border-destructive"
        )}
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab p-1 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
          {index + 1}
        </div>
        <Input
          value={step.step_name}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder="Enter step name..."
          className="h-8 border-transparent bg-transparent focus-visible:border-primary focus-visible:ring-0"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
          onClick={onRemove}
          disabled={isOnlyStep}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {error && <p className="pl-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}

// ----------------------------------------------------------------------
// Main Form Component
// ----------------------------------------------------------------------
export function ProductionPipelineForm({ editId }: { editId?: string }) {
  const isEditMode = Boolean(editId)

  const { data: pipelineData, isLoading } = useQuery({
    queryKey: ["production-pipelines", editId],
    queryFn: () => getProductionPipeline(editId!),
    enabled: isEditMode,
  })

  if (isEditMode && (isLoading || !pipelineData)) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Loading pipeline details...
      </div>
    )
  }

  return (
    <ProductionPipelineFormContent
      key={editId ?? "create"}
      editId={editId}
      pipelineData={pipelineData}
    />
  )
}

function ProductionPipelineFormContent({ editId, pipelineData }: any) {
  const queryClient = useQueryClient()
  const isEditMode = Boolean(editId)

  const initialSteps: ProductionPipelineStepValue[] = pipelineData?.steps
    ?.length
    ? pipelineData.steps
        .sort((a: any, b: any) => a.step_order - b.step_order)
        .map((s: any) => ({
          id: s.id,
          uid: String(s.id),
          step_name: s.step_name,
        }))
    : [{ uid: "initial-empty-step", step_name: "" }]

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Combobox State
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [selectedDeptName, setSelectedDeptName] = React.useState<string>("")

  // Fetch Departments
  const { data: departmentResponse, isLoading: isLoadingDepartments } =
    useQuery({
      queryKey: ["departments-search", debouncedSearch],
      queryFn: () =>
        fetchDepartments({
          pageIndex: 0,
          pageSize: 50,
          globalFilter: debouncedSearch,
        }),
    })
  const departments = departmentResponse?.data ?? []

  // Fetch initial department if editing
  const initialDeptId = pipelineData?.department_id
  const { data: initialDepartment } = useQuery({
    queryKey: ["department-single", initialDeptId],
    queryFn: () => getDepartment(String(initialDeptId)),
    enabled: !!initialDeptId,
  })

  React.useEffect(() => {
    if (initialDepartment) setSelectedDeptName(initialDepartment.name)
  }, [initialDepartment])

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof productionPipelineSchema>) => {
      if (isEditMode && editId)
        return updateProductionPipeline({ ...values, id: editId })
      return createProductionPipeline(values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-pipelines"] })
    },
  })

  const form = useForm({
    defaultValues: {
      name: pipelineData?.name ?? "",
      description: pipelineData?.description ?? "",
      department_id: pipelineData?.department_id
        ? String(pipelineData.department_id)
        : "",
      steps: initialSteps,
    },
    validators: {
      onChange: productionPipelineSchema,
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value)
    },
  })

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      <div className="space-y-4">
        {/* PIPELINE NAME */}
        <form.Field name="name">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel>
                  Pipeline Name{" "}
                  <span className="font-bold text-red-500">*</span>
                </FieldLabel>
                <Input
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g., Standard Beverage Bottling"
                  disabled={mutation.isPending}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )
          }}
        </form.Field>

        {/* DESCRIPTION */}
        <form.Field name="description">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel>Description</FieldLabel>
                <Textarea
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Optional details about this pipeline..."
                  className="resize-none"
                  rows={2}
                  disabled={mutation.isPending}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )
          }}
        </form.Field>

        {/* DEPARTMENT COMBOBOX */}
        <form.Field name="department_id">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid} className="flex flex-col gap-2">
                <FieldLabel>
                  Department <span className="font-bold text-red-500">*</span>
                </FieldLabel>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className={cn(
                        "w-full justify-between font-normal",
                        !field.state.value && "text-muted-foreground"
                      )}
                      disabled={mutation.isPending}
                    >
                      {field.state.value && selectedDeptName
                        ? selectedDeptName
                        : "Select department..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Search departments..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {isLoadingDepartments
                            ? "Searching..."
                            : "No department found."}
                        </CommandEmpty>
                        <CommandGroup>
                          {departments.map((dept) => (
                            <CommandItem
                              key={dept.id}
                              value={String(dept.id)}
                              onSelect={(currentValue) => {
                                field.handleChange(currentValue)
                                setSelectedDeptName(dept.name)
                                setOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.state.value === String(dept.id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {dept.name} ({dept.code})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )
          }}
        </form.Field>
      </div>

      {/* DnD STEPS */}
      <form.Field name="steps" mode="array">
        {(field) => {
          const steps = field.state.value || []

          const handleDragEnd = (event: DragEndEvent) => {
            const { active, over } = event
            if (over && active.id !== over.id) {
              const oldIndex = steps.findIndex((item) => item.uid === active.id)
              const newIndex = steps.findIndex((item) => item.uid === over.id)
              field.setValue(arrayMove(steps, oldIndex, newIndex))
            }
          }

          const addStep = () =>
            field.pushValue({ uid: crypto.randomUUID(), step_name: "" })
          const removeStep = (index: number) => field.removeValue(index)
          const updateStep = (index: number, val: string) => {
            const updated = [...steps]
            updated[index] = { ...updated[index], step_name: val }
            field.setValue(updated)
          }

          return (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FieldLabel>
                  Pipeline Steps <span className="text-red-500">*</span>
                </FieldLabel>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addStep}
                  className="h-7 text-xs"
                >
                  <Plus className="mr-1 h-3 w-3" /> Add Step
                </Button>
              </div>

              <DndContext
                id="pipeline-dnd-context"
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={steps.map((s) => s.uid)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {steps.map((step, index) => {
                      const stepErrors = field.state.meta.errors?.[0] as any
                      const stepErrorMsg =
                        typeof stepErrors === "object"
                          ? stepErrors?.[index]?.step_name
                          : undefined

                      return (
                        <SortableStepItem
                          key={step.uid}
                          step={step}
                          index={index}
                          isOnlyStep={steps.length === 1}
                          onUpdate={(val) => updateStep(index, val)}
                          onRemove={() => removeStep(index)}
                          error={stepErrorMsg}
                        />
                      )
                    })}
                  </div>
                </SortableContext>
              </DndContext>
              <FieldError errors={field.state.meta.errors} />
            </div>
          )
        }}
      </form.Field>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending
            ? "Saving..."
            : isEditMode
              ? "Update Pipeline"
              : "Create Pipeline"}
        </Button>
      </div>
    </form>
  )
}
