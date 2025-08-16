import { RRule } from 'rrule'

export function buildRRule(preset: 'daily' | 'weekly' | 'weekdays' | 'monthly', dtStart: Date): string {
	switch (preset) {
		case 'daily':
			return new RRule({ freq: RRule.DAILY, dtstart: dtStart }).toString()
		case 'weekly':
			return new RRule({ freq: RRule.WEEKLY, dtstart: dtStart }).toString()
		case 'weekdays':
			return new RRule({ freq: RRule.WEEKLY, byweekday: [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR], dtstart: dtStart }).toString()
		case 'monthly':
			return new RRule({ freq: RRule.MONTHLY, dtstart: dtStart }).toString()
	}
}

export function nextOccurrence(rruleText: string, afterIso: string | null): string | null {
	const rule = RRule.fromString(rruleText)
	const after = afterIso ? new Date(afterIso) : new Date()
	const next = rule.after(after, true)
	return next ? next.toISOString() : null
}