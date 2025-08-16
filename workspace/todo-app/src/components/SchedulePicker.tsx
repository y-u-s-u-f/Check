import { useState, useRef, useEffect } from 'react'
import { Calendar, X } from 'lucide-react'
import { format, isToday, isTomorrow, parseISO, addDays } from 'date-fns'

interface SchedulePickerProps {
  value?: string | null
  onChange: (date: string | null) => void
  placeholder?: string
  className?: string
}

const formatScheduleLabel = (dateStr: string): string => {
  const date = parseISO(dateStr)
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return format(date, 'MMM d')
}

export default function SchedulePicker({ value, onChange, placeholder = "Schedule", className = "" }: SchedulePickerProps) {
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

  const scheduleOptions = [
    { label: 'Today', date: new Date() },
    { label: 'Tomorrow', date: addDays(new Date(), 1) },
    { label: 'This Weekend', date: addDays(new Date(), 7 - new Date().getDay()) },
    { label: 'Next Week', date: addDays(new Date(), 7) },
    { label: 'Next Month', date: addDays(new Date(), 30) },
  ]

  const handleOptionSelect = (date: Date) => {
    // Set to 9 AM for scheduled items
    const scheduledDate = new Date(date)
    scheduledDate.setHours(9, 0, 0, 0)
    onChange(scheduledDate.toISOString())
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange(null)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn px-2 py-1 text-xs flex items-center gap-1"
        title="Schedule task"
      >
        <Calendar size={14} />
        {value ? formatScheduleLabel(value) : placeholder}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-64 card p-4 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Schedule task</h3>
            {value && (
              <button
                onClick={handleClear}
                className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
                title="Remove schedule"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="text-xs text-neutral-500 mb-3">
            Scheduling sets when you want to work on this task
          </div>

          <div className="space-y-2">
            {scheduleOptions.map((option) => (
              <button
                key={option.label}
                onClick={() => handleOptionSelect(option.date)}
                className="w-full text-left px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <div className="text-sm font-medium">{option.label}</div>
                <div className="text-xs text-neutral-500">
                  {format(option.date, 'EEEE, MMM d')}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
            <div className="text-xs text-neutral-500">
              💡 Tip: Due dates are deadlines, schedules are when you plan to work
            </div>
          </div>
        </div>
      )}
    </div>
  )
}