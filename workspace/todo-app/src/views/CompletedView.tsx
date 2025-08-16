import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { db } from '../db'
import type { Task } from '../types'
import { formatShort } from '../utils/datetime'

export default function CompletedView() {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    const loadTasks = async () => {
      const completedTasks = await db.tasks.where('isCompleted').equals(1 as any).reverse().toArray()
      setTasks(completedTasks)
    }
    loadTasks()
  }, [])

  const restoreTask = async (task: Task) => {
    await db.tasks.update(task.id!, { isCompleted: false, updatedAt: Date.now() })
    setTasks(prev => prev.filter(t => t.id !== task.id))
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <Check size={16} className="text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Completed</h1>
          <p className="text-sm text-neutral-500">
            {tasks.length} completed task{tasks.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <Check size={48} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-4" />
          <p className="text-neutral-500">No completed tasks yet</p>
          <p className="text-sm text-neutral-400 mt-1">Completed tasks will appear here</p>
        </div>
      ) : (
        <div className="space-y-1">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className="group rounded-md px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 transition-all"
            >
              <div className="flex items-center gap-3">
                <Check size={16} className="text-green-500" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm line-through text-neutral-500">
                    {task.title}
                  </div>
                  {task.dueAt && (
                    <div className="text-xs text-neutral-400 mt-0.5">
                      Due: {formatShort(task.dueAt)}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => restoreTask(task)}
                  className="opacity-0 group-hover:opacity-100 btn px-2 py-1 text-xs"
                  title="Restore task"
                >
                  Restore
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}