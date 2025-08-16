import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Id, Task } from '../types'
import { db } from '../db'
import { formatShort } from '../utils/datetime'
import { ChevronDown, ChevronRight, Circle, CircleCheck, Clock, Plus } from 'lucide-react'
import { useHotkeys } from 'react-hotkeys-hook'
import { buildRRule } from '../utils/rrule'
import DatePicker from './DatePicker'
import TagPicker from './TagPicker'
import RecurrencePicker from './RecurrencePicker'
import SchedulePicker from './SchedulePicker'

interface Props {
	projectId: Id
	sectionId?: Id | null
	parentId?: Id | null
	focusHotkey?: string
}

export default function TaskList({ projectId, sectionId = null, parentId = null, focusHotkey }: Props) {
	const [tasks, setTasks] = useState<Task[]>([])
	const [expanded, setExpanded] = useState<Record<Id, boolean>>({})
	const [completingTasks, setCompletingTasks] = useState<Set<Id>>(new Set())
	const inputRef = useRef<HTMLInputElement | null>(null)

	useEffect(() => {
		const load = async () => {
			const list = await db.tasks
				.where({ projectId })
				.filter(t => (t.parentId ?? null) === parentId && (t.sectionId ?? null) === sectionId)
				.toArray()
			setTasks(list)
		}
		load()
	}, [projectId, sectionId, parentId])

	useHotkeys(focusHotkey || '', (e) => { if (!focusHotkey) return; e.preventDefault(); inputRef.current?.focus() }, { enableOnFormTags: true }, [focusHotkey])

	async function addTask(title: string, pId: Id, parent: Id | null, sec: Id | null) {
		const now = Date.now()
		await db.tasks.add({ title, projectId: pId, parentId: parent, sectionId: sec, createdAt: now, updatedAt: now, isCompleted: false, isCollapsed: false, tagNames: [], recurrence: null, location: null, dueAt: null, scheduledAt: null, dueTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone })
		const list = await db.tasks.where({ projectId: pId }).filter(t => (t.parentId ?? null) === parent && (t.sectionId ?? null) === sec).toArray()
		setTasks(list)
	}

	async function toggleDone(task: Task) {
		if (!task.isCompleted) {
			// Mark as completing for animation
			setCompletingTasks(prev => new Set(prev).add(task.id!))
			
			// Wait for animation
			setTimeout(async () => {
				await db.tasks.update(task.id!, { isCompleted: true, updatedAt: Date.now(), completedAt: new Date().toISOString() })
				
				// Wait a bit more then move to completed
				setTimeout(async () => {
					setCompletingTasks(prev => {
						const newSet = new Set(prev)
						newSet.delete(task.id!)
						return newSet
					})
					const list = await db.tasks.where({ projectId }).filter(t => (t.parentId ?? null) === parentId && (t.sectionId ?? null) === sectionId).toArray()
					setTasks(list)
				}, 1500)
			}, 500)
		} else {
			// Uncompleting - immediate
			await db.tasks.update(task.id!, { isCompleted: false, updatedAt: Date.now(), completedAt: null })
			const list = await db.tasks.where({ projectId }).filter(t => (t.parentId ?? null) === parentId && (t.sectionId ?? null) === sectionId).toArray()
			setTasks(list)
		}
	}

	async function toggleCollapse(task: Task) {
		setExpanded(prev => ({ ...prev, [task.id!]: !prev[task.id!] }))
	}

	async function setDueDate(task: Task, dueAt: string | null) {
		await db.tasks.update(task.id!, { dueAt, updatedAt: Date.now() })
		const list = await db.tasks.where({ projectId }).filter(t => (t.parentId ?? null) === parentId && (t.sectionId ?? null) === sectionId).toArray()
		setTasks(list)
	}

	async function setRecurrence(task: Task, recurrence: { preset: any; rrule?: string | null } | null) {
		if (recurrence && recurrence.preset !== 'none') {
			const rrule = buildRRule(recurrence.preset, new Date())
			await db.tasks.update(task.id!, { recurrence: { preset: recurrence.preset, rrule }, updatedAt: Date.now() })
		} else {
			await db.tasks.update(task.id!, { recurrence: null, updatedAt: Date.now() })
		}
		const list = await db.tasks.where({ projectId }).filter(t => (t.parentId ?? null) === parentId && (t.sectionId ?? null) === sectionId).toArray()
		setTasks(list)
	}

	async function setSchedule(task: Task, scheduledAt: string | null) {
		await db.tasks.update(task.id!, { scheduledAt, updatedAt: Date.now() })
		const list = await db.tasks.where({ projectId }).filter(t => (t.parentId ?? null) === parentId && (t.sectionId ?? null) === sectionId).toArray()
		setTasks(list)
	}

	async function setTags(task: Task, tagNames: string[]) {
		await db.tasks.update(task.id!, { tagNames, updatedAt: Date.now() })
		const list = await db.tasks.where({ projectId }).filter(t => (t.parentId ?? null) === parentId && (t.sectionId ?? null) === sectionId).toArray()
		setTasks(list)
	}

	return (
		<div className="space-y-1">
			<AnimatePresence>
				{tasks.map((t) => {
					const isCompleting = completingTasks.has(t.id!)
					return (
						<motion.div 
							key={t.id} 
							layout
							initial={{ opacity: 1, scale: 1 }}
							animate={{ 
								opacity: isCompleting ? 0.6 : 1,
								scale: isCompleting ? 0.95 : 1,
								backgroundColor: isCompleting ? '#10b981' : 'transparent'
							}}
							exit={{ 
								opacity: 0, 
								scale: 0.8,
								x: 300,
								transition: { duration: 0.3 } 
							}}
							className="group rounded-md px-2 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
						>
					<div className="flex items-center gap-2">
						<button className="text-neutral-500" onClick={() => toggleDone(t)} aria-label="Complete">
							{t.isCompleted ? <CircleCheck size={18} /> : <Circle size={18} />}
						</button>
						<button className="text-neutral-500" onClick={() => toggleCollapse(t)} aria-label="Expand">
							{expanded[t.id!] ? <ChevronDown size={16}/> : <ChevronRight size={16}/>} 
						</button>
						<div className="flex-1 min-w-0">
							<div className="truncate">
								<span className={t.isCompleted ? 'line-through text-neutral-400' : ''}>{t.title}</span>
							</div>
							<div className="flex items-center gap-3 mt-0.5">
								{t.dueAt ? (
									<div className="text-xs text-neutral-500 flex items-center gap-1"><Clock size={12}/>{formatShort(t.dueAt)}</div>
								) : null}
								{(t.tagNames ?? []).length > 0 && (
									<div className="text-xs flex items-center gap-1">
										{t.tagNames!.map((tag) => {
											const tagColors = [
												'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
												'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
												'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
												'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
												'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
												'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
											]
											const hash = tag.split('').reduce((a, b) => {
												a = ((a << 5) - a) + b.charCodeAt(0)
												return a & a
											}, 0)
											const colorClass = tagColors[Math.abs(hash) % tagColors.length]
											return (
												<span key={tag} className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
													#{tag}
												</span>
											)
										})}
									</div>
								)}
							</div>
						</div>
						<div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
							<SchedulePicker value={t.scheduledAt} onChange={(date) => setSchedule(t, date)} />
							<DatePicker value={t.dueAt} onChange={(date) => setDueDate(t, date)} placeholder="Due" />
							<RecurrencePicker value={t.recurrence} onChange={(recurrence) => setRecurrence(t, recurrence)} />
							<TagPicker value={t.tagNames ?? []} onChange={(tags) => setTags(t, tags)} />
						</div>
					</div>
					{expanded[t.id!] && (
						<div className="pl-6 mt-1">
							<TaskList projectId={projectId} sectionId={sectionId} parentId={t.id!} />
						</div>
					)}
						</motion.div>
					)
				})}
			</AnimatePresence>
			<div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-neutral-900 transition-all">
				<Plus size={16} className="text-neutral-400" />
				<input 
					ref={inputRef} 
					className="w-full bg-transparent outline-none text-sm placeholder:text-neutral-400" 
					placeholder="Add a task..." 
					onKeyDown={async (e) => {
						if (e.key === 'Enter') {
							const title = (e.target as HTMLInputElement).value.trim()
							if (!title) return
							await addTask(title, projectId, parentId, sectionId)
							;(e.target as HTMLInputElement).value = ''
						}
					}} 
				/>
			</div>
		</div>
	)
}