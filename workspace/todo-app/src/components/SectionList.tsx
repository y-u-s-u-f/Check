import { useEffect, useState } from 'react'
import type { Id, Section } from '../types'
import { db } from '../db'
import TaskList from './TaskList'

export default function SectionList({ projectId }: { projectId: Id }) {
	const [sections, setSections] = useState<Section[]>([])
	useEffect(() => {
		const load = async () => {
			const list = await db.sections.where('projectId').equals(projectId).sortBy('sortOrder')
			setSections(list)
		}
		load()
	}, [projectId])

	async function addSection() {
		const name = prompt('Section name')?.trim()
		if (!name) return
		const now = Date.now()
		const sortOrder = (sections[sections.length - 1]?.sortOrder ?? 0) + 1
		await db.sections.add({ name, projectId, sortOrder, createdAt: now, updatedAt: now })
		const list = await db.sections.where('projectId').equals(projectId).sortBy('sortOrder')
		setSections(list)
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-sm font-medium text-neutral-500">No section</h2>
				<div className="mt-2">
					<TaskList projectId={projectId} focusHotkey="a" />
				</div>
			</div>
			{sections.map((s) => (
				<div key={s.id}>
					<div className="flex items-center justify-between">
						<h2 className="text-sm font-medium text-neutral-500">{s.name}</h2>
					</div>
					<div className="mt-2">
						<TaskList projectId={projectId} sectionId={s.id!} />
					</div>
				</div>
			))}
			<div>
				<button className="btn" onClick={addSection}>Add section</button>
			</div>
		</div>
	)
}