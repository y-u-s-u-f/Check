import { useEffect, useRef, useState } from 'react'
import type { Id, Task } from '../types'
import { db } from '../db'
import { formatShort } from '../utils/datetime'
import { ChevronDown, ChevronRight, Circle, CircleCheck, Clock, Plus, Repeat } from 'lucide-react'
import { useHotkeys } from 'react-hotkeys-hook'
import { buildRRule } from '../utils/rrule'
import DatePicker from './DatePicker'
import TagPicker from './TagPicker'

interface Props {
	projectId: Id
	sectionId?: Id | null
	parentId?: Id | null
	focusHotkey?: string
}

export default function TaskList({ projectId, sectionId = null, parentId = null, focusHotkey }: Props) {
	const [tasks, setTasks] = useState<Task[]>([])
	const [expanded, setExpanded] = useState<Record<Id, boolean>>({})
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
		await db.tasks.add({ title, projectId: pId, parentId: parent, sectionId: sec, createdAt: now, updatedAt: now, isCompleted: false, isCollapsed: false, tagNames: [], recurrence: null, location: null, dueAt: null, dueTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone })
		const list = await db.tasks.where({ projectId: pId }).filter(t => (t.parentId ?? null) === parent && (t.sectionId ?? null) === sec).toArray()
		setTasks(list)
	}

	async function toggleDone(task: Task) {
		await db.tasks.update(task.id!, { isCompleted: !task.isCompleted, updatedAt: Date.now() })
		const list = await db.tasks.where({ projectId }).filter(t => (t.parentId ?? null) === parentId && (t.sectionId ?? null) === sectionId).toArray()
		setTasks(list)
	}

	async function toggleCollapse(task: Task) {
		setExpanded(prev => ({ ...prev, [task.id!]: !prev[task.id!] }))
	}

	async function setDueDate(task: Task, dueAt: string | null) {
		await db.tasks.update(task.id!, { dueAt, updatedAt: Date.now() })
		const list = await db.tasks.where({ projectId }).filter(t => (t.parentId ?? null) === parentId && (t.sectionId ?? null) === sectionId).toArray()
		setTasks(list)
	}

	async function setRecurrencePrompt(task: Task) {
		const preset = prompt('Recurs: none | daily | weekly | weekdays | monthly', task.recurrence?.preset ?? 'none')
		if (preset === null) return
		const p = preset.trim() as any
		if (p === 'none') {
			await db.tasks.update(task.id!, { recurrence: null, updatedAt: Date.now() })
		} else {
			const rrule = buildRRule(p, new Date())
			await db.tasks.update(task.id!, { recurrence: { preset: p, rrule }, updatedAt: Date.now() })
		}
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
			{tasks.map((t) => (
				<div key={t.id} className="group rounded-md px-2 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-900">
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
							<DatePicker value={t.dueAt} onChange={(date) => setDueDate(t, date)} />
							<button className="btn px-2 py-1" title="Repeat" onClick={() => setRecurrencePrompt(t)}><Repeat size={14}/></button>
							<TagPicker value={t.tagNames ?? []} onChange={(tags) => setTags(t, tags)} />
						</div>
					</div>
					{expanded[t.id!] && (
						<div className="pl-6 mt-1">
							<TaskList projectId={projectId} sectionId={sectionId} parentId={t.id!} />
						</div>
					)}
				</div>
			))}
			<div className="flex items-center gap-2 px-2 py-1.5">
				<Plus size={16} className="text-neutral-500" />
				<input ref={inputRef} className="w-full bg-transparent outline-none text-sm task-add-input" placeholder="Add a task" onKeyDown={async (e) => {
					if (e.key === 'Enter') {
						const title = (e.target as HTMLInputElement).value.trim()
						if (!title) return
						await addTask(title, projectId, parentId, sectionId)
						;(e.target as HTMLInputElement).value = ''
					}
				}} />
			</div>
		</div>
	)
}