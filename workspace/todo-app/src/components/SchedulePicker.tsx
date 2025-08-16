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
  const [selectedDate, setSelectedDate] = useState<Date>(value ? parseISO(value) : new Date())
  const [selectedTime, setSelectedTime] = useState<string>(
    value ? format(parseISO(value), 'HH:mm') : '09:00'
  )
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
    { label: 'Next Week', date: addDays(new Date(), 7) },
  ]

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    // Combine date with current time
    const [hours, minutes] = selectedTime.split(':')
    const combined = new Date(date)
    combined.setHours(parseInt(hours), parseInt(minutes))
    onChange(combined.toISOString())
    setIsOpen(false)
  }

  const handleTimeChange = (time: string) => {
    setSelectedTime(time)
    if (value) {
      const [hours, minutes] = time.split(':')
      const combined = new Date(selectedDate)
      combined.setHours(parseInt(hours), parseInt(minutes))
      onChange(combined.toISOString())
    }
  }

  const handleClear = () => {
    onChange(null)
    setIsOpen(false)
  }

  const generateCalendar = () => {
    const currentMonth = selectedDate.getMonth()
    const currentYear = selectedDate.getFullYear()
    
    const firstDay = new Date(currentYear, currentMonth, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const currentDate = new Date(startDate)
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return days
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
        <div className="absolute top-full left-0 z-50 mt-1 w-80 card p-4 shadow-lg">
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
            Choose when you want to work on this task
          </div>

          {/* Quick options */}
          <div className="flex gap-1 mb-4">
            {scheduleOptions.map((option) => (
              <button
                key={option.label}
                onClick={() => handleDateSelect(option.date)}
                className="px-2 py-1 text-xs rounded border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Calendar header */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
            >
              ‹
            </button>
            <div className="text-sm font-medium">
              {format(selectedDate, 'MMMM yyyy')}
            </div>
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
            >
              ›
            </button>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
              <div key={day} className="text-xs text-neutral-500 text-center p-1">
                {day}
              </div>
            ))}
            {generateCalendar().map((date, index) => {
              const isCurrentMonth = date.getMonth() === selectedDate.getMonth()
              const isSelected = value && format(date, 'yyyy-MM-dd') === format(parseISO(value), 'yyyy-MM-dd')
              const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
              
              return (
                <button
                  key={index}
                  onClick={() => handleDateSelect(date)}
                  className={`
                    text-xs p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800
                    ${!isCurrentMonth ? 'text-neutral-300 dark:text-neutral-600' : ''}
                    ${isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                    ${isToday && !isSelected ? 'font-semibold text-blue-500' : ''}
                  `}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>

          {/* Time picker */}
          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-500">Time:</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="text-xs px-2 py-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}