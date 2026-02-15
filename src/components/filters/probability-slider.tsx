'use client'

import { Slider } from '@/components/ui/slider'
import { useState } from 'react'

export function ProbabilitySlider() {
  const [range, setRange] = useState([0, 100])

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-300">Likelihood Range</label>
      <Slider
        min={0}
        max={100}
        step={5}
        value={range}
        onValueChange={setRange}
      />
      <div className="flex justify-between text-xs text-slate-400">
        <span>{range[0]}%</span>
        <span>{range[1]}%</span>
      </div>
    </div>
  )
}
