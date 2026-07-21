"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { Megaphone, ShieldAlert, BellRing, User, Loader2 } from "lucide-react"

import { AnnouncementForm } from "@/forms/announcement.form"
import { fetchAnnouncements } from "@/forms/queries/announcement.query"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default function AnnouncementsPage() {
  // Fetch Announcements
  const { data: announcements, isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: fetchAnnouncements,
  })

  return (
    <div className="mx-auto flex max-w-2xl flex-col space-y-6 py-6">
      {/* 1. CREATION AREA (The "What's on your mind?" box) */}
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <Megaphone className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Create Announcement</CardTitle>
              <CardDescription>
                Share an update with the organization.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <AnnouncementForm />
        </CardContent>
      </Card>

      {/* 2. THE WALL / FEED */}
      <div className="flex flex-col space-y-4">
        <h3 className="text-sm font-semibold tracking-tight text-muted-foreground uppercase">
          Recent Announcements
        </h3>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : announcements?.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            No announcements posted yet.
          </div>
        ) : (
          announcements?.map((post: any) => {
            // Safely extract author info if available
            const author = post.author?.[0] || post.author
            const authorName = author
              ? `${author.first_name} ${author.last_name}`
              : "System Announcement"

            const initials = author
              ? `${author.first_name?.charAt(0)}${author.last_name?.charAt(0)}`
              : "SA"

            return (
              <Card key={post.id} className="shadow-sm">
                {/* Post Header: Avatar, Name, Date */}
                <CardHeader className="flex flex-row items-start gap-4 pb-3">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage
                      src={author?.avatar_url}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-muted text-xs font-medium">
                      {initials || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{authorName}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </CardHeader>

                {/* Post Body: Title and Rich Text */}
                <CardContent className="flex flex-col space-y-3">
                  <h4 className="text-base font-bold">{post.title}</h4>

                  {/* Dangerously set inner HTML for Tiptap rich text output */}
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />

                  {/* Post Footer: Badges/Tags */}
                  {(post.is_superuser_only || post.send_notification) && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-dashed pt-4">
                      {post.is_superuser_only && (
                        <Badge
                          variant="secondary"
                          className="flex items-center text-[10px] uppercase"
                        >
                          <ShieldAlert className="mr-1 h-3 w-3" /> Superuser
                          Only
                        </Badge>
                      )}
                      {post.send_notification && (
                        <Badge
                          variant="outline"
                          className="flex items-center text-[10px] uppercase"
                        >
                          <BellRing className="mr-1 h-3 w-3" /> Notified via
                          Push
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
