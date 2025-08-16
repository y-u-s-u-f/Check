import { useEffect, useRef, useState } from 'react'
import type { Id, Task } from '../types'
import { db } from '../db'
import { formatShort } from '../utils/datetime'
import { ChevronDown, ChevronRight, Circle, CircleCheck, Clock, Plus, Repeat, Tag } from 'lucide-react'
import { useHotkeys } from 'react-hotkeys-hook'
import { buildRRule } from '../utils/rrule'
import DateTimeDialog from './DateTimeDialog'
import TagPickerDialog from './TagPickerDialog'

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
	const [dueDialogTaskId, setDueDialogTaskId] = useState<Id | null>(null)
	const [tagDialogTaskId, setTagDialogTaskId] = useState<Id | null>(null)

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

	async function setDue(task: Task, iso: string | null) {
		await db.tasks.update(task.id!, { dueAt: iso, updatedAt: Date.now() })
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
									<div className="text-xs text-neutral-500 flex items-center gap-1">
										{t.tagNames!.map((tag) => <span key={tag} className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">#{tag}</span>)}
									</div>
								)}
							</div>
						</div>
						<div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
							<button className="btn px-2 py-1" title="Set due" onClick={() => setDueDialogTaskId(t.id!)}><Clock size={14}/></button>
							<button className="btn px-2 py-1" title="Repeat" onClick={() => setRecurrencePrompt(t)}><Repeat size={14}/></button>
							<button className="btn px-2 py-1" title="Tags" onClick={() => setTagDialogTaskId(t.id!)}><Tag size={14}/></button>
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

			{/* Dialogs */}
			{dueDialogTaskId !== null && (
				<DateTimeDialog
					open={true}
					initialIso={tasks.find(t => t.id === dueDialogTaskId)?.dueAt ?? null}
					onSave={async (iso) => {
						const task = tasks.find(t => t.id === dueDialogTaskId)
						if (task) await setDue(task, iso)
						setDueDialogTaskId(null)
					}}
					onClose={() => setDueDialogTaskId(null)}
				/>
			)}
			{tagDialogTaskId !== null && (
				<TagPickerDialog
					open={true}
					initialTagNames={tasks.find(t => t.id === tagDialogTaskId)?.tagNames ?? []}
					onSave={async (names) => {
						const task = tasks.find(t => t.id === tagDialogTaskId)
						if (task) await setTags(task, names)
						setTagDialogTaskId(null)
					}}
					onClose={() => setTagDialogTaskId(null)}
				/>
			)}
		</div>
	)
}