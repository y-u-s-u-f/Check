import { useState, useRef, useEffect } from 'react'
import { Repeat, X } from 'lucide-react'
import type { RecurrencePreset } from '../types'

interface RecurrencePickerProps {
  value?: { preset: RecurrencePreset; rrule?: string | null } | null
  onChange: (recurrence: { preset: RecurrencePreset; rrule?: string | null } | null) => void
  className?: string
}

const recurrenceOptions: { value: RecurrencePreset; label: string; description: string }[] = [
  { value: 'none', label: 'No repeat', description: 'This task will not repeat' },
  { value: 'daily', label: 'Daily', description: 'Repeats every day' },
  { value: 'weekly', label: 'Weekly', description: 'Repeats every week' },
  { value: 'weekdays', label: 'Weekdays', description: 'Repeats Monday through Friday' },
  { value: 'monthly', label: 'Monthly', description: 'Repeats every month' },
]

export default function RecurrencePicker({ value, onChange, className = "" }: RecurrencePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleOptionSelect = (option: RecurrencePreset) => {
    if (option === 'none') {
      onChange(null)
    } else {
      onChange({ preset: option, rrule: null })
    }
    setIsOpen(false)
  }

  const currentLabel = value?.preset ? 
    recurrenceOptions.find(opt => opt.value === value.preset)?.label || 'Custom' :
    'No repeat'

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn px-2 py-1 text-xs flex items-center gap-1"
        title="Set recurrence"
      >
        <Repeat size={14} />
        {currentLabel}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-80 card p-4 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Repeat task</h3>
            {value && (
              <button
                onClick={() => {
                  onChange(null)
                  setIsOpen(false)
                }}
                className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
                title="Clear recurrence"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="space-y-2">
            {recurrenceOptions.map((option) => {
              const isSelected = option.value === (value?.preset || 'none')
              
              return (
                <button
                  key={option.value}
                  onClick={() => handleOptionSelect(option.value)}
                  className={`
                    w-full text-left p-3 rounded-lg border transition-all
                    ${isSelected 
                      ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' 
                      : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{option.label}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">{option.description}</div>
                    </div>
                    {isSelected && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}