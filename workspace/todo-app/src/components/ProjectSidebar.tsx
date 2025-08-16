import { Link, useNavigate } from 'react-router-dom'
import { useObservable } from '../hooks/useLiveQuery'
import { db, queries } from '../db'
import { Calendar, CheckSquare, Home, Plus, Tag, Check, Trash2 } from 'lucide-react'
import type { Project } from '../types'

export default function ProjectSidebar() {
	const projects = useObservable(queries.allProjects, [])
	const navigate = useNavigate()
	async function createProject() {
		const name = prompt('Project name')?.trim()
		if (!name) return
		const now = Date.now()
		const id = await db.projects.add({ name, color: null, createdAt: now, updatedAt: now })
		navigate(`/project/${id}`)
	}
	return (
		<aside className="w-60 shrink-0 border-r border-neutral-200/70 dark:border-neutral-800/70 hidden md:block">
			<div className="p-3 space-y-2">
				<nav className="space-y-1">
					<Link className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-900" to="/"><Home size={16}/> Inbox</Link>
					<Link className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-900" to="/today"><Calendar size={16}/> Today</Link>
					<Link className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-900" to="/scheduled"><CheckSquare size={16}/> Scheduled</Link>
					<Link className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-900" to="/completed"><Check size={16}/> Completed</Link>
					<Link className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-900" to="/deleted"><Trash2 size={16}/> Deleted</Link>
				</nav>
				<div className="pt-2">
					<div className="px-2 text-xs uppercase text-neutral-500 mb-1">Projects</div>
					<div className="space-y-1">
						{projects?.filter(p => p.name !== 'Inbox').map((p: Project) => (
							<Link key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-900" to={`/project/${p.id}`}>
								<span className="text-sm">{p.emoji || '📁'}</span>
								<span>{p.name}</span>
							</Link>
						))}
					</div>
					<button className="btn w-full justify-between mt-2" onClick={createProject}>
						<span className="inline-flex items-center gap-2"><Tag size={16}/> New Project</span>
						<Plus size={16} />
					</button>
				</div>
			</div>
		</aside>
	)
}