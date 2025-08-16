import TaskList from '../components/TaskList'
import { ensureSeed } from '../db'
import { useEffect } from 'react'

export default function InboxView() {
	useEffect(() => { ensureSeed() }, [])
	return (
		<div className="p-4">
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-semibold">Inbox</h1>
			</div>
			<div className="mt-4">
				<TaskList projectId={1} />
			</div>
		</div>
	)
}