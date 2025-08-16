import { useEffect, useState } from 'react'
import type { Observable } from 'dexie'

export function useObservable<T>(observableFactory: () => Observable<T>, deps: unknown[] = []) {
	const [value, setValue] = useState<T | undefined>(undefined)
	useEffect(() => {
		const subscription = observableFactory().subscribe({ next: setValue, error: (e) => console.error('liveQuery error', e) })
		return () => subscription.unsubscribe()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps)
	return value
}