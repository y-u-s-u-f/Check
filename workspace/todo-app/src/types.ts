export type Id = number

export type ThemeName = 'light' | 'dark'

export interface Project {
	id?: Id
	name: string
	color?: string | null
	createdAt: number
	updatedAt: number
}

export interface Section {
	id?: Id
	projectId: Id
	name: string
	sortOrder: number
	createdAt: number
	updatedAt: number
}

export interface LocationSpec {
	lat: number
	lng: number
	radiusM: number
}

export type RecurrencePreset = 'none' | 'daily' | 'weekly' | 'weekdays' | 'monthly' | 'custom'

export interface Task {
	id?: Id
	title: string
	notes?: string
	projectId: Id
	sectionId?: Id | null
	parentId?: Id | null
	tagNames?: string[]
	isArchived?: boolean
	isPinned?: boolean
	isCollapsed?: boolean
	isCompleted?: boolean
	completedAt?: string | null
	dueAt?: string | null
	dueTimezone?: string | null
	recurrence?: {
		preset: RecurrencePreset
		rrule?: string | null
	} | null
	location?: LocationSpec | null
	lastNotifiedAt?: string | null
	createdAt: number
	updatedAt: number
}

export interface Tag {
	id?: Id
	name: string
	color?: string | null
	createdAt: number
	updatedAt: number
}

export interface Settings {
	id?: 1
	theme: ThemeName
	accent: 'blue' | 'violet' | 'rose' | 'emerald'
	enableTimeNotifications: boolean
	enableLocationNotifications: boolean
}