import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Edit2 } from 'lucide-react'
import { db } from '../db'
import TaskList from '../components/TaskList'
import EmojiPicker from '../components/EmojiPicker'
import type { Project, Task } from '../types'

function PieChart({ completed, total }: { completed: number; total: number }) {
	const percentage = total > 0 ? (completed / total) * 100 : 0
	const circumference = 2 * Math.PI * 16
	const strokeDasharray = circumference
	const strokeDashoffset = circumference - (percentage / 100) * circumference

	return (
		<div className="relative w-8 h-8">
			<svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
				<circle
					cx="18"
					cy="18"
					r="16"
					fill="none"
					stroke="currentColor"
					strokeWidth="3"
					className="text-neutral-200 dark:text-neutral-700"
				/>
				<circle
					cx="18"
					cy="18"
					r="16"
					fill="none"
					stroke="currentColor"
					strokeWidth="3"
					strokeDasharray={strokeDasharray}
					strokeDashoffset={strokeDashoffset}
					strokeLinecap="round"
					className="text-green-500 transition-all duration-300"
				/>
			</svg>
			<div className="absolute inset-0 flex items-center justify-center">
				<span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
					{Math.round(percentage)}%
				</span>
			</div>
		</div>
	)
}

export default function ProjectView() {
	const { id } = useParams<{ id: string }>()
	const projectId = Number(id)
	const [project, setProject] = useState<Project | null>(null)
	const [tasks, setTasks] = useState<Task[]>([])
	const [isEditingName, setIsEditingName] = useState(false)
	const [editName, setEditName] = useState('')

	useEffect(() => {
		if (!projectId) return
		
		const loadData = async () => {
			const proj = await db.projects.get(projectId)
			const taskList = await db.tasks.where('projectId').equals(projectId).toArray()
			setProject(proj || null)
			setTasks(taskList)
			setEditName(proj?.name || '')
		}
		
		loadData()
		
		// Refresh tasks periodically to update the pie chart
		const interval = setInterval(loadData, 2000)
		return () => clearInterval(interval)
	}, [projectId])

	const completedTasks = tasks.filter(t => t.isCompleted).length
	const totalTasks = tasks.length

	const updateProjectName = async () => {
		if (!project || !editName.trim()) return
		await db.projects.update(projectId, { name: editName.trim(), updatedAt: Date.now() })
		setProject({ ...project, name: editName.trim() })
		setIsEditingName(false)
	}

	const updateProjectEmoji = async (emoji: string) => {
		if (!project) return
		await db.projects.update(projectId, { emoji, updatedAt: Date.now() })
		setProject({ ...project, emoji })
	}

	if (!projectId) return <div className="p-4">Project not found</div>
	if (!project) return <div className="p-4">Loading...</div>

	return (
		<div className="p-4">
			<div className="flex items-center gap-4 mb-6">
				<EmojiPicker
					value={project.emoji}
					onChange={(emoji) => updateProjectEmoji(emoji || '📁')}
				/>
				
				<div className="flex-1">
					{isEditingName ? (
						<input
							type="text"
							value={editName}
							onChange={(e) => setEditName(e.target.value)}
							onBlur={updateProjectName}
							onKeyDown={(e) => {
								if (e.key === 'Enter') updateProjectName()
								if (e.key === 'Escape') {
									setEditName(project.name)
									setIsEditingName(false)
								}
							}}
							className="text-2xl font-bold bg-transparent border-b-2 border-blue-500 outline-none"
							autoFocus
						/>
					) : (
						<div className="flex items-center gap-2">
							<h1 className="text-2xl font-bold">{project.name}</h1>
							<button
								onClick={() => setIsEditingName(true)}
								className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
								title="Edit project name"
							>
								<Edit2 size={16} />
							</button>
						</div>
					)}
					
					{totalTasks > 0 && (
						<div className="text-sm text-neutral-500 mt-1">
							{completedTasks} of {totalTasks} tasks completed
						</div>
					)}
				</div>

				{totalTasks > 0 && (
					<PieChart completed={completedTasks} total={totalTasks} />
				)}
			</div>

			<TaskList projectId={projectId} />
		</div>
	)
}