'use client'

import { LayoutDashboard, FileText, Send, ListTodo, BarChart3, LogOut } from 'lucide-react'
import { NavItem } from './nav-item'
import { Separator } from '@/components/ui/separator'
import { useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const { signOut } = useClerk()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <div className={className}>
      <div className="flex h-full flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <h1 className="text-xl font-bold">Get That Gig</h1>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid gap-1 px-2">
            <NavItem href="/dashboard" icon={LayoutDashboard} label="Overview" />
            <NavItem href="/dashboard/cv" icon={FileText} label="CVs" />
            <NavItem href="/dashboard/apply" icon={Send} label="Apply" />
            <NavItem href="/dashboard/track" icon={ListTodo} label="Track" />
            <NavItem href="/dashboard/analytics" icon={BarChart3} label="Analytics" />
          </nav>
        </div>
        <div className="p-4">
          <Separator className="mb-4" />
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
