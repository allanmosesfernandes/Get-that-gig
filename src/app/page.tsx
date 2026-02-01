import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function LandingPage() {
  const { userId } = await auth()

  // If authenticated, redirect to dashboard
  if (userId) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted">
      <div className="container flex max-w-4xl flex-col items-center gap-8 px-4 text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
          Get That Gig
        </h1>
        <p className="max-w-2xl text-xl text-muted-foreground">
          AI-powered job application assistant. Create tailored CVs, apply with confidence, and track your applications all in one place.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/sign-up">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
