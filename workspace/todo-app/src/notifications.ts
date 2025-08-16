import { db } from './db'
import type { Task } from './types'

let initialized = false

function canNotify() {
	return 'Notification' in window
}

export async function requestNotificationPermission() {
	if (!canNotify()) return false
	if (Notification.permission === 'granted') return true
	if (Notification.permission === 'denied') return false
	const res = await Notification.requestPermission()
	return res === 'granted'
}

function showNotification(title: string, opts?: NotificationOptions) {
	try { new Notification(title, opts) } catch (e) { console.warn('Notification failed', e) }
}

function withinRadiusMeters(a: GeolocationPosition, task: Task) {
	if (!task.location) return false
	const { latitude, longitude } = a.coords
	const R = 6371000
	const toRad = (v: number) => v * Math.PI / 180
	const dLat = toRad(task.location.lat - latitude)
	const dLon = toRad(task.location.lng - longitude)
	const lat1 = toRad(latitude)
	const lat2 = toRad(task.location.lat)
	const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
	const dist = 2 * R * Math.asin(Math.sqrt(h))
	return dist <= task.location.radiusM
}

export function initSchedulers() {
	if (initialized) return
	initialized = true
	// time-based every minute
	if (canNotify()) {
		const tick = async () => {
			const now = new Date()
			const windowStart = new Date(now.getTime() - 60000) // last minute
			const due = await db.tasks.where('dueAt').belowOrEqual(now.toISOString()).toArray()
			for (const t of due) {
				if (t.isCompleted) continue
				const last = t.lastNotifiedAt ? new Date(t.lastNotifiedAt) : null
				if (last && last > windowStart) continue
				showNotification(t.title, { body: 'Task due' })
				await db.tasks.update(t.id!, { lastNotifiedAt: new Date().toISOString() })
			}
		}
		setInterval(tick, 60_000)
	}

	// location-based
	if ('geolocation' in navigator && canNotify()) {
		navigator.geolocation.watchPosition(async (pos) => {
			const withLoc = await db.tasks.where('projectId').above(0).filter(t => !!t.location && !t.isCompleted).toArray()
			for (const t of withLoc) {
				if (withinRadiusMeters(pos, t)) {
					const last = t.lastNotifiedAt ? new Date(t.lastNotifiedAt) : null
					const windowStart = new Date(Date.now() - 30 * 60_000)
					if (!last || last < windowStart) {
						showNotification(t.title, { body: 'You are near this task location' })
						await db.tasks.update(t.id!, { lastNotifiedAt: new Date().toISOString() })
					}
				}
			}
		})
	}
}