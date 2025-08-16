import { Trash2 } from 'lucide-react'

export default function DeletedView() {

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <Trash2 size={16} className="text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Deleted</h1>
          <p className="text-sm text-neutral-500">
            Deleted tasks will appear here
          </p>
        </div>
      </div>

      <div className="text-center py-12">
        <Trash2 size={48} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-4" />
        <p className="text-neutral-500">No deleted tasks</p>
        <p className="text-sm text-neutral-400 mt-1">
          Tasks you delete will appear here and can be restored or permanently removed
        </p>
      </div>
    </div>
  )
}