"use client"

import { useState } from "react"
import { Trash, Loader2 } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface DeleteActionProps {
  id: string | number
  /** The mutation function to execute the delete (e.g., deleteOutlet, deleteTicket) */
  deleteFn: (id: string | number) => Promise<void>
  /** The TanStack query key to invalidate upon success (e.g., ["outlets"]) */
  queryKeyToInvalidate: string[]
  /** Optional name of the entity for the warning text (e.g., "ticket", "outlet") */
  entityName?: string
}

export function DeleteAction({
  id,
  deleteFn,
  queryKeyToInvalidate,
  entityName = "item",
}: DeleteActionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => deleteFn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate })
      setIsOpen(false)
    },
  })

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="xs"
          variant="ghost"
          className="text-destructive hover:text-destructive"
        >
          <Trash className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this{" "}
            {entityName}
            and remove its data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={(e) => {
              e.stopPropagation() // Prevent the click from bubbling up to the AlertDialog
              deleteMutation.mutate()
            }}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
