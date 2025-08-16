import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useNavigate } from 'react-router-dom'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'cmdk'
import { useHotkeys } from 'react-hotkeys-hook'
import { Search, Moon, Sun, Circle, Clock } from 'lucide-react'
import './index.css'
import ProjectSidebar from './components/ProjectSidebar'
import InboxView from './views/InboxView'
import TodayView from './views/TodayView'
import ScheduledView from './views/ScheduledView'
import ProjectView from './views/ProjectView'
import { ensureSeed, db } from './db'
import { initSchedulers, requestNotificationPermission } from './notifications'
import type { Task, Project } from './types'
import { formatShort } from './utils/datetime'

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
		<header className="sticky top-0 z-10 border-b border-neutral-200/70 dark:border-neutral-800/70 bg-white/75 dark:bg-neutral-950/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-neutral-950/50">
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
	const [tasks, setTasks] = useState<Task[]>([])
	const [projects, setProjects] = useState<Project[]>([])
	
	useEffect(() => {
		if (open) {
			// Load tasks and projects when opening
			const loadData = async () => {
				const allTasks = await db.tasks.where('isCompleted').equals(0 as any).toArray()
				const allProjects = await db.projects.toArray()
				setTasks(allTasks)
				setProjects(allProjects)
			}
			loadData()
		}
	}, [open])

	const commands = useMemo(() => ([
		{ id: 'go:inbox', label: 'Go to Inbox', action: () => navigate('/'), type: 'navigation' },
		{ id: 'go:today', label: 'Go to Today', action: () => navigate('/today'), type: 'navigation' },
		{ id: 'go:scheduled', label: 'Go to Scheduled', action: () => navigate('/scheduled'), type: 'navigation' },
		{ id: 'open:settings', label: 'Open Settings', action: () => navigate('/settings'), type: 'navigation' },
	]), [navigate])

	const taskItems = useMemo(() => tasks.map(task => ({
		id: `task:${task.id}`,
		label: task.title,
		action: () => navigate(`/project/${task.projectId}`),
		type: 'task',
		task
	})), [tasks, navigate])

	const projectItems = useMemo(() => projects.map(project => ({
		id: `project:${project.id}`,
		label: `${project.name}`,
		action: () => navigate(`/project/${project.id}`),
		type: 'project',
		project
	})), [projects, navigate])

	useHotkeys(['ctrl+k', 'meta+k'], (e) => { e.preventDefault(); setOpen(true) }, { enableOnFormTags: true }, [setOpen])

	// Auto focus the input when opening
	useEffect(() => {
		if (open) {
			const timer = setTimeout(() => {
				const input = document.querySelector('[cmdk-input]') as HTMLInputElement
				if (input) {
					input.focus()
				}
			}, 100)
			return () => clearTimeout(timer)
		}
	}, [open])

	return (
		<div className={open ? 'fixed inset-0 z-50' : 'hidden'}>
			{/* Enhanced backdrop with blur */}
			<div 
				className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
				onClick={() => setOpen(false)} 
			/>
			<div className="absolute inset-x-0 top-24 mx-auto max-w-2xl">
				<Command className="card shadow-2xl border-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
					<div className="flex items-center px-3 border-b border-neutral-200/70 dark:border-neutral-800/70">
						<Search size={16} className="text-neutral-400" />
						<CommandInput 
							placeholder="Search tasks, projects, or run commands..." 
							className="flex-1 px-3 py-4 text-sm bg-transparent border-0 outline-none placeholder:text-neutral-400"
						/>
					</div>
					<CommandList className="max-h-96 overflow-y-auto">
						<CommandEmpty>
							<div className="py-6 text-center text-sm text-neutral-500">
								<Search size={32} className="mx-auto mb-2 text-neutral-300" />
								No results found.
							</div>
						</CommandEmpty>
						
						{commands.length > 0 && (
							<CommandGroup heading="Commands" className="px-2 py-2">
								{commands.map((c) => (
									<CommandItem 
										key={c.id} 
										value={c.label} 
										onSelect={() => { c.action(); setOpen(false) }}
										className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 data-[selected]:bg-neutral-100 dark:data-[selected]:bg-neutral-800"
									>
										<div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
											<Search size={14} className="text-blue-600 dark:text-blue-400" />
										</div>
										<span className="text-sm">{c.label}</span>
									</CommandItem>
								))}
							</CommandGroup>
						)}

						{taskItems.length > 0 && (
							<CommandGroup heading="Tasks" className="px-2 py-2">
								{taskItems.slice(0, 8).map((item) => (
									<CommandItem 
										key={item.id} 
										value={item.label} 
										onSelect={() => { item.action(); setOpen(false) }}
										className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 data-[selected]:bg-neutral-100 dark:data-[selected]:bg-neutral-800"
									>
										<div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
											<Circle size={14} className="text-green-600 dark:text-green-400" />
										</div>
										<div className="flex-1 min-w-0">
											<div className="text-sm truncate">{item.label}</div>
											{item.task?.dueAt && (
												<div className="text-xs text-neutral-500 flex items-center gap-1">
													<Clock size={10} />
													{formatShort(item.task.dueAt)}
												</div>
											)}
										</div>
									</CommandItem>
								))}
							</CommandGroup>
						)}

						{projectItems.length > 0 && (
							<CommandGroup heading="Projects" className="px-2 py-2">
								{projectItems.map((item) => (
									<CommandItem 
										key={item.id} 
										value={item.label} 
										onSelect={() => { item.action(); setOpen(false) }}
										className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 data-[selected]:bg-neutral-100 dark:data-[selected]:bg-neutral-800"
									>
										<div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
											<div 
												className="w-3 h-3 rounded-full" 
												style={{ backgroundColor: item.project?.color || '#8b5cf6' }}
											/>
										</div>
										<span className="text-sm">{item.label}</span>
									</CommandItem>
								))}
							</CommandGroup>
						)}
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
