import { useState, useRef, useEffect } from 'react'
import { MoreVertical, Trash2, Copy } from 'lucide-react'
import { db } from '../db'
import type { Task, Project, Id } from '../types'

interface TaskActionsProps {
  task: Task
  onUpdate: () => void
  className?: string
}

export default function TaskActions({ task, onUpdate, className = "" }: TaskActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Load projects when opened
      loadProjects()
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const loadProjects = async () => {
    const allProjects = await db.projects.toArray()
    setProjects(allProjects)
  }

  const moveTask = async (targetProjectId: Id) => {
    await db.tasks.update(task.id!, { projectId: targetProjectId, updatedAt: Date.now() })
    setIsOpen(false)
    onUpdate()
  }

  const duplicateTask = async () => {
    const { id, createdAt, updatedAt, completedAt, ...taskData } = task
    const now = Date.now()
    await db.tasks.add({
      ...taskData,
      title: `${task.title} (copy)`,
      createdAt: now,
      updatedAt: now,
      isCompleted: false,
      completedAt: null
    })
    setIsOpen(false)
    onUpdate()
  }

  const deleteTask = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      await db.tasks.delete(task.id!)
      setIsOpen(false)
      onUpdate()
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
        title="More actions"
      >
        <MoreVertical size={14} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 z-50 mt-1 w-56 card p-2 shadow-lg">
          <div className="space-y-1">
            {/* Move to project */}
            <div className="px-2 py-1">
              <div className="text-xs font-medium text-neutral-500 mb-1">Move to project</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {projects
                  .filter(p => p.id !== task.projectId)
                  .map((project) => (
                    <button
                      key={project.id}
                      onClick={() => moveTask(project.id!)}
                      className="w-full text-left px-2 py-1 text-sm rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                    >
                      <span className="text-xs">{project.emoji || '📁'}</span>
                      <span className="truncate">{project.name}</span>
                    </button>
                  ))}
              </div>
            </div>

            <div className="border-t border-neutral-200 dark:border-neutral-700 my-1"></div>

            {/* Duplicate */}
            <button
              onClick={duplicateTask}
              className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
            >
              <Copy size={14} />
              Duplicate task
            </button>

            {/* Delete */}
            <button
              onClick={deleteTask}
              className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2"
            >
              <Trash2 size={14} />
              Delete task
            </button>
          </div>
        </div>
      )}
    </div>
  )
}