'use client'

import { useState } from 'react'

export const dynamic = 'force-static'

export default function Home() {
  const [count, setCount] = useState(0)

  return (
    <main className="flex flex-col items-center justify-center gap-6 px-8 py-32">
      <h1 className="text-3xl font-semibold tracking-tight">
        AIOps Sustainability Hackathon
      </h1>
      <p className="max-w-md text-center text-lg leading-8 text-zinc-600 dark:text-zinc-400">
        This harness is a client-only Next.js app. It ships no server actions,
        no API routes, and makes zero network calls after the first load.
      </p>
      <button
        type="button"
        onClick={() => setCount((current) => current + 1)}
        className="rounded-full bg-foreground px-5 py-2 text-background transition-colors"
      >
        Clicked {count} {count === 1 ? 'time' : 'times'}
      </button>
    </main>
  )
}
