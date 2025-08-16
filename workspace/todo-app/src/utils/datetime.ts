import { format, isSameDay, startOfDay, endOfDay } from 'date-fns'

export function isoNow() {
	return new Date().toISOString()
}

export function isoStartOfToday() {
	return startOfDay(new Date()).toISOString()
}

export function isoEndOfToday() {
	return endOfDay(new Date()).toISOString()
}

export function formatShort(iso: string | null | undefined) {
	if (!iso) return ''
	try { return format(new Date(iso), 'PP p') } catch { return '' }
}

export function isDueToday(iso: string | null | undefined) {
	if (!iso) return false
	return isSameDay(new Date(iso), new Date())
}