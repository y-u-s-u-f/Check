import { useState, useRef, useEffect } from 'react'
import { Tag, X, Plus } from 'lucide-react'
import { db } from '../db'

interface TagPickerProps {
  value: string[]
  onChange: (tags: string[]) => void
  className?: string
}

export default function TagPicker({ value, onChange, className = "" }: TagPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [filteredTags, setFilteredTags] = useState<string[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadTags = async () => {
      // Get all unique tag names from existing tasks
      const tasks = await db.tasks.toArray()
      const allTags = new Set<string>()
      tasks.forEach(task => {
        if (task.tagNames) {
          task.tagNames.forEach(tag => allTags.add(tag))
        }
      })
      setAvailableTags(Array.from(allTags).sort())
    }
    loadTags()
  }, [])

  useEffect(() => {
    if (inputValue) {
      const filtered = availableTags.filter(tag => 
        !value.includes(tag) && 
        tag.toLowerCase().includes(inputValue.toLowerCase())
      )
      setFilteredTags(filtered)
    } else {
      setFilteredTags(availableTags.filter(tag => !value.includes(tag)))
    }
  }, [inputValue, availableTags, value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setInputValue('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const addTag = (tagName: string) => {
    if (tagName && !value.includes(tagName)) {
      onChange([...value, tagName])
      setInputValue('')
    }
  }

  const removeTag = (tagName: string) => {
    onChange(value.filter(tag => tag !== tagName))
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const trimmed = inputValue.trim()
      if (trimmed) {
        addTag(trimmed)
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setInputValue('')
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  const tagColors = [
    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  ]

  const getTagColor = (tag: string) => {
    const hash = tag.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    return tagColors[Math.abs(hash) % tagColors.length]
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100)
          }
        }}
        className="btn px-2 py-1 text-xs flex items-center gap-1"
        title="Manage tags"
      >
        <Tag size={14} />
        {value.length > 0 ? `${value.length} tag${value.length === 1 ? '' : 's'}` : 'Add tags'}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 z-50 mt-1 w-80 card p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Manage tags</h3>
          </div>

          {/* Current tags */}
          {value.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-neutral-500 mb-2">Current tags:</div>
              <div className="flex flex-wrap gap-1">
                {value.map((tag) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTagColor(tag)}`}
                  >
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Input for new tags */}
          <div className="mb-3">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Type to add or search tags..."
                className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {inputValue && (
                <button
                  onClick={() => addTag(inputValue.trim())}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
                  title="Add new tag"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Suggestions */}
          {(filteredTags.length > 0 || inputValue) && (
            <div>
              <div className="text-xs text-neutral-500 mb-2">
                {inputValue ? 'Matching tags:' : 'Available tags:'}
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {inputValue && !availableTags.includes(inputValue.trim()) && inputValue.trim() && (
                  <button
                    onClick={() => addTag(inputValue.trim())}
                    className="w-full text-left px-2 py-1 text-xs rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                  >
                    <Plus size={12} />
                    Create "{inputValue.trim()}"
                  </button>
                )}
                {filteredTags.slice(0, 10).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => addTag(tag)}
                    className="w-full text-left px-2 py-1 text-xs rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getTagColor(tag)}`}>
                      #{tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredTags.length === 0 && inputValue && availableTags.includes(inputValue.trim()) && (
            <div className="text-xs text-neutral-500 text-center py-2">
              Tag already added
            </div>
          )}
        </div>
      )}
    </div>
  )
}