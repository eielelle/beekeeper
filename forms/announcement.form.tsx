"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Megaphone } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox" // <-- Added Checkbox import
import { RichTextEditor } from "@/components/custom/richtext/rich-text-editor"

import {
  announcementSchema,
  createAnnouncement,
} from "./queries/announcement.query"

export function AnnouncementForm({ onClose }: { onClose?: () => void }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      toast.success("Announcement posted successfully!")
      queryClient.invalidateQueries({ queryKey: ["announcements"] })
      form.reset()
      if (onClose) onClose()
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to post announcement.")
    },
  })

  const form = useForm({
    defaultValues: {
      title: "",
      content: "",
      is_superuser_only: false,
      send_notification: false,
    },
    validators: {
      onSubmit: announcementSchema as any,
    },
    onSubmit: async ({ value }) => {
      // Validate that the content isn't just empty HTML tags
      const strippedContent = value.content.replace(/(<([^>]+)>)/gi, "").trim()
      if (!strippedContent) {
        toast.error("Announcement content cannot be empty.")
        return
      }

      mutation.mutate(value)
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
      <div className="flex flex-col space-y-4">
        {/* TITLE FIELD */}
        <form.Field name="title">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  Announcement Title <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g., Office Closure on Friday"
                  disabled={mutation.isPending}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>

        {/* RICH TEXT CONTENT FIELD */}
        <form.Field name="content">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel>
                  Message <span className="text-destructive">*</span>
                </FieldLabel>

                <RichTextEditor
                  value={field.state.value}
                  onChange={field.handleChange}
                  disabled={mutation.isPending}
                />

                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>

        {/* OPTIONS GRID */}
        <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
          {/* SUPERUSER ONLY CHECKBOX */}
          <form.Field name="is_superuser_only">
            {(field) => (
              <Field className="flex flex-col gap-2">
                <div className="flex items-start gap-3 rounded-lg border p-4 shadow-sm">
                  <Checkbox
                    id={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) =>
                      field.handleChange(checked === true)
                    }
                    className="mt-0.5"
                    disabled={mutation.isPending}
                  />
                  <div className="flex flex-col space-y-1.5 leading-none">
                    <FieldLabel htmlFor={field.name} className="cursor-pointer">
                      Superuser Only
                    </FieldLabel>
                    <p className="text-xs text-muted-foreground">
                      Restrict this announcement so only administrators can see
                      it.
                    </p>
                  </div>
                </div>
              </Field>
            )}
          </form.Field>

          {/* SEND NOTIFICATION CHECKBOX */}
          <form.Field name="send_notification">
            {(field) => (
              <Field className="flex flex-col gap-2">
                <div className="flex items-start gap-3 rounded-lg border p-4 shadow-sm">
                  <Checkbox
                    id={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) =>
                      field.handleChange(checked === true)
                    }
                    className="mt-0.5"
                    disabled={mutation.isPending}
                  />
                  <div className="flex flex-col space-y-1.5 leading-none">
                    <FieldLabel htmlFor={field.name} className="cursor-pointer">
                      Push Notification
                    </FieldLabel>
                    <p className="text-xs text-muted-foreground">
                      Alert eligible users about this new announcement.
                    </p>
                  </div>
                </div>
              </Field>
            )}
          </form.Field>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Megaphone className="mr-2 h-4 w-4" />
          )}
          Post Announcement
        </Button>
      </div>
    </form>
  )
}
