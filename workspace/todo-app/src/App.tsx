import { useEffect, useMemo, useRef, useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useNavigate } from 'react-router-dom'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'cmdk'
import { useHotkeys } from 'react-hotkeys-hook'
import { Search, Moon, Sun } from 'lucide-react'
import './index.css'
import ProjectSidebar from './components/ProjectSidebar'
import InboxView from './views/InboxView'
import TodayView from './views/TodayView'
import ScheduledView from './views/ScheduledView'
import ProjectView from './views/ProjectView'
import { ensureSeed, db } from './db'
import { initSchedulers, requestNotificationPermission } from './notifications'

function ThemeToggle() {
	const [dark, setDark] = useState(() => {
		return typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
	})
	useEffect(() => {
		if (dark) document.documentElement.classList.add('dark')
		else document.documentElement.classList.remove('dark')
	}, [dark])
	return (
		<button className="btn" aria-label="Toggle theme" onClick={() => setDark((v) => !v)}>
			{dark ? <Sun size={16} /> : <Moon size={16} />}
			<span className="hidden md:inline">{dark ? 'Light' : 'Dark'}</span>
		</button>
	)
}

function Header({ onOpenCommand }: { onOpenCommand: () => void }) {
	return (
		<header className="sticky top-0 z-10 border-b border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-950/60 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-neutral-950/50">
			<div className="mx-auto max-w-6xl px-3 h-14 flex items-center gap-3">
				<Link to="/" className="text-sm font-semibold">Todos</Link>
				<div className="flex-1" />
				<button className="btn" onClick={onOpenCommand} aria-label="Command">
					<Search size={16} />
					<span className="hidden md:inline">Search or run a command</span>
					<kbd className="ml-2 text-xs text-neutral-500">Ctrl/Cmd + K</kbd>
				</button>
				<ThemeToggle />
			</div>
		</header>
	)
}

function CommandPalette({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
	const navigate = useNavigate()
	const inputRef = useRef<HTMLInputElement | null>(null)
	const [query, setQuery] = useState('')
	const [taskResults, setTaskResults] = useState<{ id: number; title: string; projectId: number }[]>([])
	const commands = useMemo(() => ([
		{ id: 'go:inbox', label: 'Go to Inbox', action: () => navigate('/') },
		{ id: 'go:today', label: 'Go to Today', action: () => navigate('/today') },
		{ id: 'go:scheduled', label: 'Go to Scheduled', action: () => navigate('/scheduled') },
		{ id: 'open:settings', label: 'Open Settings', action: () => navigate('/settings') },
	]), [navigate])

	useHotkeys(['ctrl+k', 'meta+k'], (e) => { e.preventDefault(); setOpen(true) }, { enableOnFormTags: true }, [setOpen])
	useEffect(() => {
		if (!open) return
		const id = requestAnimationFrame(() => inputRef.current?.focus())
		return () => cancelAnimationFrame(id)
	}, [open])
	useEffect(() => {
		if (!open) return
		const q = query.trim().toLowerCase()
		if (!q) { setTaskResults([]); return }
		const run = async () => {
			const all = await db.tasks.toArray()
			setTaskResults(all.filter(t => t.title.toLowerCase().includes(q)).slice(0, 8).map(t => ({ id: t.id!, title: t.title, projectId: t.projectId })))
		}
		run()
	}, [open, query])

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === 'Escape' && open) setOpen(false)
		}
		document.addEventListener('keydown', onKey)
		return () => document.removeEventListener('keydown', onKey)
	}, [open, setOpen])

	return (
		<div className={open ? 'fixed inset-0 z-50' : 'hidden'}>
			<div className="absolute inset-0 bg-black/40 backdrop-blur" onClick={() => setOpen(false)} />
			<div className="absolute inset-x-0 top-24 mx-auto max-w-xl">
				<Command className="card overflow-hidden">
					<CommandInput ref={inputRef as any} placeholder="Type a command or search tasks..." value={query} onValueChange={setQuery} />
					<CommandList>
						<CommandEmpty>No results found.</CommandEmpty>
						{taskResults.length > 0 && (
							<CommandGroup heading="Tasks">
								{taskResults.map((t) => (
									<CommandItem key={`task-${t.id}`} value={t.title} onSelect={() => { navigate(`/project/${t.projectId}`); setOpen(false) }}>{t.title}</CommandItem>
								))}
							</CommandGroup>
						)}
						<CommandGroup heading="Navigation">
							{commands.map((c) => (
								<CommandItem key={c.id} value={c.label} onSelect={() => { c.action(); setOpen(false) }}>{c.label}</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</div>
		</div>
	)
}

function Shell() {
	const [open, setOpen] = useState(false)
	useEffect(() => { ensureSeed(); initSchedulers(); requestNotificationPermission() }, [])
	return (
		<div className="min-h-full">
			<Header onOpenCommand={() => setOpen(true)} />
			<div className="mx-auto max-w-6xl flex">
				<ProjectSidebar />
				<main className="flex-1 min-w-0">
					<Routes>
						<Route path="/" element={<InboxView />} />
						<Route path="/today" element={<TodayView />} />
						<Route path="/scheduled" element={<ScheduledView />} />
						<Route path="/project/:id" element={<ProjectView />} />
					</Routes>
				</main>
			</div>
			<CommandPalette open={open} setOpen={setOpen} />
		</div>
	)
}

export default function App() {
	return (
		<BrowserRouter>
			<Shell />
		</BrowserRouter>
	)
}
