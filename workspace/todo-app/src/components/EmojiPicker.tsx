import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'

interface EmojiPickerProps {
  value?: string | null
  onChange: (emoji: string | null) => void
  className?: string
}

const emojiCategories = {
  'Recent': ['📁', '📊', '💼', '🏠', '🎯', '⭐', '🔥', '💡'],
  'Objects': ['📁', '📊', '💼', '📋', '📝', '🔖', '📌', '🗂️', '📂', '🗃️', '📚', '📖', '💡', '🔍', '🎯', '⭐', '🔥', '💎'],
  'Activities': ['🏃', '🎯', '⚽', '🏀', '🎨', '🎭', '🎪', '🎸', '🎵', '🎬', '📸', '🎮', '🎲', '🧩', '🎳', '🏆', '🥇', '🎖️'],
  'Nature': ['🌱', '🌿', '🌳', '🌸', '🌺', '🌻', '🌼', '🌵', '🍃', '🌾', '🌲', '🌴', '🌊', '⛰️', '🌋', '🏔️', '🌅', '🌄'],
  'Food': ['🍎', '🍊', '🍋', '🍌', '🍇', '🍓', '🥝', '🍑', '🥭', '🍍', '🥥', '🥑', '🍆', '🥕', '🌽', '🌶️', '🥒', '🥬'],
  'Travel': ['🚗', '🚙', '🚐', '🚛', '🚜', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴'],
  'Symbols': ['❤️', '💙', '💚', '💛', '🧡', '💜', '🖤', '🤍', '🤎', '💯', '💥', '💫', '⭐', '🌟', '✨', '⚡', '🔥', '💎']
}

export default function EmojiPicker({ value, onChange, className = "" }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('Recent')
  const [searchTerm, setSearchTerm] = useState('')
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

  const filteredEmojis = searchTerm
    ? Object.values(emojiCategories).flat().filter(emoji => 
        emoji.includes(searchTerm) // Simple search - in real app would use emoji names
      )
    : emojiCategories[activeCategory as keyof typeof emojiCategories] || []

  const handleEmojiSelect = (emoji: string) => {
    onChange(emoji)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-3xl hover:scale-110 transition-transform cursor-pointer flex items-center justify-center w-12 h-12 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
        title="Change emoji"
      >
        {value || '📁'}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 w-80 card p-4 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Choose emoji</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
            >
              <X size={14} />
            </button>
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search emojis..."
              className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Categories */}
          {!searchTerm && (
            <div className="flex gap-1 mb-4 overflow-x-auto">
              {Object.keys(emojiCategories).map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                    activeCategory === category
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          {/* Emoji Grid */}
          <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
            {filteredEmojis.map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                onClick={() => handleEmojiSelect(emoji)}
                className="w-8 h-8 text-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors flex items-center justify-center"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Clear button */}
          {value && (
            <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => {
                  onChange(null)
                  setIsOpen(false)
                }}
                className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Remove emoji
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}