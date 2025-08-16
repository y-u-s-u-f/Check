import { useParams } from 'react-router-dom'
import TaskList from '../components/TaskList'

export default function ProjectView() {
	const { id } = useParams<{ id: string }>()
	const projectId = Number(id)
	if (!projectId) return <div className="p-4">Project not found</div>
	return (
		<div className="p-4">
			<h1 className="text-xl font-semibold">Project #{projectId}</h1>
			<div className="mt-4">
				<TaskList projectId={projectId} />
			</div>
		</div>
	)
}