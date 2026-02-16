'use client'

import { LayoutList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export type Density = 'compact' | 'default' | 'expanded'

export function DensityToggle() {
  // TODO: Wire to use-density hook and persist preference
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
          <LayoutList className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Toggle density (d)</p>
      </TooltipContent>
    </Tooltip>
  )
}
