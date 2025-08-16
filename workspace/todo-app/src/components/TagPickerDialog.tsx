import { useEffect, useMemo, useRef, useState } from 'react'
import { db } from '../db'
import type { Tag } from '../types'

interface TagPickerDialogProps {
	open: boolean
	initialTagNames: string[]
	title?: string
	onSave: (tagNames: string[]) => void
	onClose: () => void
}

export default function TagPickerDialog({ open, initialTagNames, title = 'Edit tags', onSave, onClose }: TagPickerDialogProps) {
	const [query, setQuery] = useState('')
	const [selected, setSelected] = useState<string[]>([])
	const [allTags, setAllTags] = useState<Tag[]>([])
	const inputRef = useRef<HTMLInputElement | null>(null)

	useEffect(() => {
		if (open) setSelected(initialTagNames)
	}, [open, initialTagNames])

	useEffect(() => {
		const sub = db.tags.toCollection().toArray().then(setAllTags)
		return () => { void sub }
	}, [])

	useEffect(() => {
		if (!open) return
		const id = requestAnimationFrame(() => inputRef.current?.focus())
		return () => cancelAnimationFrame(id)
	}, [open])

	const suggestions = useMemo(() => {
		const q = query.trim().toLowerCase()
		const base = allTags.map(t => t.name)
		const filtered = q ? base.filter(n => n.toLowerCase().includes(q)) : base
		return filtered.filter(n => !selected.includes(n)).slice(0, 8)
	}, [allTags, query, selected])

	function addTag(name: string) {
		const tag = name.trim()
		if (!tag) return
		if (!selected.includes(tag)) setSelected((s) => [...s, tag])
		setQuery('')
	}

	function removeTag(name: string) {
		setSelected((s) => s.filter(x => x !== name))
	}

	async function handleSave() {
		const now = Date.now()
		// ensure tags exist in tags table
		for (const name of selected) {
			const existing = await db.tags.where('name').equals(name).first()
			if (!existing) await db.tags.add({ name, color: null, createdAt: now, updatedAt: now })
		}
		onSave(selected)
	}

	if (!open) return null

	return (
		<div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
			<div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
			<div className="absolute inset-x-4 top-28 mx-auto max-w-md" onClick={(e) => e.stopPropagation()}>
				<div className="card p-4">
					<div className="text-sm font-semibold mb-2">{title}</div>
					<div className="flex flex-wrap gap-1 mb-2">
						{selected.map((n) => (
							<span key={n} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-sm">
								#{n}
								<button className="ml-1 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300" aria-label={`Remove ${n}`} onClick={() => removeTag(n)}>×</button>
							</span>
						))}
					</div>
					<input
						ref={inputRef}
						className="w-full rounded-lg border-neutral-300/70 dark:border-neutral-700/60 bg-white dark:bg-neutral-900"
						placeholder="Type to search or create tag..."
						value={query}
						onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
						onKeyDown={async (e) => {
							if (e.key === 'Enter' && query.trim()) {
								addTag(query)
							}
							if (e.key === 'Backspace' && !query && selected.length > 0) {
								removeTag(selected[selected.length - 1])
							}
						}}
					/>
					{suggestions.length > 0 && (
						<div className="mt-2 rounded-lg border border-neutral-200/70 dark:border-neutral-800/70 bg-white/80 dark:bg-neutral-900/80">
							<ul className="max-h-56 overflow-auto py-1">
								{suggestions.map((n) => (
									<li key={n}>
										<button className="w-full text-left px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800" onClick={() => addTag(n)}>
											#{n}
										</button>
									</li>
								))}
							</ul>
						</div>
					)}
					<div className="flex items-center justify-end gap-2 mt-3">
						<button className="btn" onClick={onClose}>Cancel</button>
						<button className="btn btn-primary" onClick={handleSave}>Save</button>
					</div>
				</div>
			</div>
		</div>
	)
}