import Dexie, { liveQuery } from 'dexie'
import type { Table } from 'dexie'
import type { Id, Project, Section, Settings, Tag, Task } from './types'

export class TodoDB extends Dexie {
	projects!: Table<Project, Id>
	sections!: Table<Section, Id>
	tasks!: Table<Task, Id>
	tags!: Table<Tag, Id>
	settings!: Table<Settings, number>

	constructor() {
		super('todo-db')
		this.version(1).stores({
			projects: '++id, name',
			sections: '++id, projectId, name, sortOrder',
			tasks: '++id, projectId, sectionId, parentId, dueAt, isCompleted',
			tags: '++id, name',
			settings: 'id'
		})
	}
}

export const db = new TodoDB()

export async function ensureSeed() {
	const count = await db.projects.count()
	if (count === 0) {
		const now = Date.now()
		const inboxId = await db.projects.add({ name: 'Inbox', createdAt: now, updatedAt: now, color: null })
		await db.settings.put({ id: 1, theme: 'light', accent: 'blue', enableTimeNotifications: true, enableLocationNotifications: false })
		await db.tasks.bulkAdd([
			{ title: 'Welcome to Minimalist Todo', projectId: inboxId, createdAt: now, updatedAt: now, isCompleted: false, isCollapsed: false, tagNames: [], recurrence: null, location: null, dueAt: null, dueTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
			{ title: 'Press Ctrl/Cmd + K to open commands', projectId: inboxId, createdAt: now, updatedAt: now, isCompleted: false, isCollapsed: false, tagNames: ['tips'], recurrence: null, location: null, dueAt: null, dueTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
		])
	}
}

export const queries = {
	inboxTasks: () => liveQuery(() => db.tasks.where({ projectId: 1, isCompleted: 0 as any }).toArray()),
	allProjects: () => liveQuery(() => db.projects.toArray()),
	projectTasks: (projectId: Id) => liveQuery(() => db.tasks.where('projectId').equals(projectId).toArray()),
	dueBetween: (startIso: string, endIso: string) => liveQuery(() => db.tasks
		.where('dueAt')
		.between(startIso, endIso, true, true)
		.filter(t => !t.isCompleted)
		.toArray()),
}