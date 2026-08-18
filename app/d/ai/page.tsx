"use client"

import { useEffect, useRef, useState } from "react"
import { Send, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function AIClonePage() {
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

    // Simulated API Call matching the image text
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Great question! You can ask for my help with the following:\n1. Anything to do with your reports in our software e.g. What is the last report we exported?\n2. Anything to do with your organisation e.g. how many employees are using our software?\n3. Anything to do with the features we have in our software e.g how can I change the colours of my report?`,
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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-white font-sans text-slate-800">
      {/* Background Gradients mimicking the image */}
      <div className="absolute inset-0 z-0 bg-white" />
      <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-0 h-3/4 bg-gradient-to-tr from-fuchsia-300/40 via-purple-200/30 to-transparent opacity-80 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 z-0 h-1/2 w-1/2 bg-gradient-to-tr from-pink-300/40 to-transparent opacity-60 blur-3xl" />

      {/* Main Chat Area */}
      <main className="relative z-10 flex-1 overflow-y-auto pt-12 pb-36">
        <div className="mx-auto max-w-4xl px-4 md:px-8">
          {/* Empty State / Greeting */}
          {messages.length === 0 && (
            <div className="mt-20 flex flex-col items-center justify-center text-center md:mt-32">
              <Sparkles
                className="mb-6 h-10 w-10 text-slate-900"
                strokeWidth={1.5}
              />
              <h1 className="text-[28px] font-normal tracking-tight text-slate-900 md:text-[32px]">
                Ask our AI anything
              </h1>
            </div>
          )}

          {/* Messages List */}
          <div className="mt-12 flex flex-col gap-8">
            {messages.map((msg) => (
              <div key={msg.id} className="flex w-full">
                {msg.role === "user" ? (
                  // User Message ("ME")
                  <div className="flex w-full flex-col items-start pr-12 md:pr-24">
                    <span className="mb-2 ml-1 text-[11px] font-medium tracking-wider text-slate-400 uppercase">
                      Me
                    </span>
                    <div className="rounded-2xl rounded-tl-sm border border-slate-100/50 bg-white px-5 py-3.5 text-[15px] leading-relaxed text-slate-800 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)]">
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  // AI Message ("OUR AI")
                  <div className="mt-2 flex w-full flex-col items-start pl-16 md:pl-28">
                    <span className="mb-2 ml-1 text-[11px] font-medium tracking-wider text-slate-400 uppercase">
                      Our AI
                    </span>
                    <div className="rounded-2xl rounded-tl-sm border border-white/60 bg-white/40 px-6 py-4 text-[15px] leading-relaxed text-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] backdrop-blur-md">
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="mt-2 flex w-full flex-col items-start pl-16 md:pl-28">
                <span className="mb-2 ml-1 text-[11px] font-medium tracking-wider text-slate-400 uppercase">
                  Our AI
                </span>
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-white/60 bg-white/40 px-6 py-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] backdrop-blur-md">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 delay-75"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 delay-150"></div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>
      </main>

      {/* Input Area (Fixed Bottom) */}
      <div className="fixed bottom-0 z-20 w-full pt-4 pb-8">
        <div className="mx-auto max-w-4xl px-4 md:px-8">
          <form
            onSubmit={handleSubmit}
            className="relative flex items-center rounded-xl border border-slate-200 bg-white/90 p-1 shadow-sm backdrop-blur-sm transition-colors focus-within:border-slate-300 focus-within:ring-2 focus-within:ring-slate-100 focus-within:ring-offset-0"
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your projects"
              className="max-h-[150px] min-h-[44px] flex-1 resize-none border-0 bg-transparent px-4 py-3 text-[15px] shadow-none placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={1}
            />

            <div className="flex shrink-0 items-center px-2">
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="h-10 w-10 rounded-lg text-slate-400 transition-colors hover:bg-slate-100/50 hover:text-slate-600"
              >
                <Send className="h-5 w-5" strokeWidth={1.5} />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
