import { useEffect, useMemo, useRef, useState } from 'react'

interface DateTimeDialogProps {
	open: boolean
	initialIso: string | null
	title?: string
	onSave: (iso: string | null) => void
	onClose: () => void
}

function toLocalInputValue(iso: string | null): string {
	if (!iso) return ''
	try {
		const date = new Date(iso)
		if (isNaN(date.getTime())) return ''
		const tzOffsetMin = date.getTimezoneOffset()
		const local = new Date(date.getTime() - tzOffsetMin * 60000)
		return local.toISOString().slice(0, 16)
	} catch {
		return ''
	}
}

function fromLocalInputValueToIso(localValue: string): string | null {
	if (!localValue) return null
	const d = new Date(localValue)
	if (isNaN(d.getTime())) return null
	return d.toISOString()
}

export default function DateTimeDialog({ open, initialIso, title = 'Set due date & time', onSave, onClose }: DateTimeDialogProps) {
	const [value, setValue] = useState<string>('')
	const inputRef = useRef<HTMLInputElement | null>(null)

	useEffect(() => {
		if (open) setValue(toLocalInputValue(initialIso))
	}, [open, initialIso])

	useEffect(() => {
		if (!open) return
		const id = requestAnimationFrame(() => inputRef.current?.focus())
		return () => cancelAnimationFrame(id)
	}, [open])

	const dialog = useMemo(() => (
		<div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
			<div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
			<div className="absolute inset-x-4 top-28 mx-auto max-w-md">
				<div className="card p-4" onClick={(e) => e.stopPropagation()}>
					<div className="text-sm font-semibold mb-2">{title}</div>
					<div className="space-y-3">
						<input
							ref={inputRef}
							type="datetime-local"
							className="w-full rounded-lg border-neutral-300/70 dark:border-neutral-700/60 bg-white dark:bg-neutral-900"
							value={value}
							onChange={(e) => setValue((e.target as HTMLInputElement).value)}
						/>
						<div className="flex items-center justify-between">
							<button className="btn" onClick={() => { setValue(''); onSave(null) }}>Clear</button>
							<div className="flex items-center gap-2">
								<button className="btn" onClick={onClose}>Cancel</button>
								<button className="btn btn-primary" onClick={() => onSave(fromLocalInputValueToIso(value))}>Save</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	), [onClose, onSave, title, value])

	if (!open) return null
	return dialog
}