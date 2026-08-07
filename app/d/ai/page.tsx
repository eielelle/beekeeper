"use client"

import { useEffect, useRef, useState } from "react"
import { Send, Menu, Plus, Mic, Sparkle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function GeminiClonePage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulated API Call
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I am a simulated response. Connect me to the `@ai-sdk/react` library to stream real responses from Google's Gemini models!",
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsLoading(false)
    }, 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      {/* Top Navigation */}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-background/80 p-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:bg-muted/50"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-xl font-medium text-muted-foreground">
            Gemini
          </span>
        </div>
        <div className="flex items-center gap-4">
          {/* Placeholder for User Profile/Avatar */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
            U
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto pb-36">
        <div className="mx-auto max-w-3xl px-4 md:px-0">
          {/* Empty State / Greeting */}
          {messages.length === 0 && (
            <div className="mt-24 mb-12 md:mt-32">
              <h1 className="mb-2 text-5xl font-semibold tracking-tight">
                <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 bg-clip-text text-transparent">
                  Hello, User
                </span>
              </h1>
              <h2 className="text-5xl font-semibold tracking-tight text-muted-foreground/50">
                How can I help you today?
              </h2>
            </div>
          )}

          {/* Messages List */}
          <div className="mt-8 flex flex-col gap-8">
            {messages.map((msg) => (
              <div key={msg.id} className="flex w-full">
                {msg.role === "user" ? (
                  // User Message: Right aligned, soft gray bubble
                  <div className="ml-auto max-w-[80%] rounded-3xl bg-muted/70 px-5 py-3 text-[15px] leading-relaxed md:max-w-[70%]">
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ) : (
                  // AI Message: Left aligned, no bubble, sparkle icon
                  <div className="flex w-full gap-4">
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                      <Sparkle className="h-6 w-6 fill-blue-500/20 text-blue-500" />
                    </div>
                    <div className="flex-1 pt-1 text-[15px] leading-relaxed">
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex w-full gap-4">
                <div className="mt-1 flex h-8 w-8 shrink-0 animate-pulse items-center justify-center rounded-full">
                  <Sparkle className="h-6 w-6 fill-blue-500/20 text-blue-500" />
                </div>
                <div className="flex-1 pt-2">
                  <div className="h-4 w-32 animate-pulse rounded-md bg-muted"></div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>
      </main>

      {/* Input Area (Fixed Bottom) */}
      <div className="fixed bottom-0 w-full bg-gradient-to-t from-background via-background to-transparent pt-6 pb-4">
        <div className="mx-auto max-w-3xl px-4 md:px-0">
          <form
            onSubmit={handleSubmit}
            className="relative flex items-center rounded-full border border-transparent bg-muted/50 py-1 pr-2 pl-4 shadow-sm transition-colors focus-within:border-border"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-full text-muted-foreground hover:bg-muted"
            >
              <Plus className="h-5 w-5" />
            </Button>

            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a prompt here"
              className="max-h-[200px] min-h-[52px] flex-1 resize-none border-0 bg-transparent px-2 py-4 text-[15px] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={1}
            />

            <div className="flex shrink-0 items-center gap-1">
              {!input.trim() ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-muted-foreground hover:bg-muted"
                >
                  <Mic className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading}
                  className="h-10 w-10 rounded-full bg-foreground text-background transition-transform hover:bg-foreground/90 active:scale-95"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>

          <div className="mt-3 text-center">
            <p className="text-[11px] text-muted-foreground">
              Gemini may display inaccurate info, including about people, so
              double-check its responses.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
