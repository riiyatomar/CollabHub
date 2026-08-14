import { useTaskStore } from '../../store/useTaskStore';
import type { Task } from '../../api/tasks';
import { cn } from '../../utils/cn';
import { Calendar, MessageSquare, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function TaskList() {
  const { tasks } = useTaskStore();

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'TODO': return <div className="w-4 h-4 rounded border border-gray-300 mr-3" />;
      case 'IN_PROGRESS': return <Clock className="w-4 h-4 text-blue-500 mr-3" />;
      case 'REVIEW': return <AlertCircle className="w-4 h-4 text-yellow-500 mr-3" />;
      case 'DONE': return <CheckCircle className="w-4 h-4 text-green-500 mr-3" />;
      case 'CANCELLED': return <div className="w-4 h-4 rounded-full border-2 border-gray-300 mr-3 opacity-50" />;
      default: return null;
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'MEDIUM': return 'bg-blue-100 text-blue-700';
      case 'LOW': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Task Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assignee
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(task.status)}
                    <span className={cn(
                      "text-sm font-medium",
                      task.status === 'DONE' ? "text-gray-400 line-through" : "text-gray-900"
                    )}>
                      {task.title}
                    </span>
                    {task.messageId && (
                      <MessageSquare className="w-3 h-3 text-indigo-400 ml-2" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={cn(
                    "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                    task.status === 'TODO' ? "bg-gray-100 text-gray-800" :
                    task.status === 'IN_PROGRESS' ? "bg-blue-100 text-blue-800" :
                    task.status === 'REVIEW' ? "bg-yellow-100 text-yellow-800" :
                    task.status === 'DONE' ? "bg-green-100 text-green-800" :
                    "bg-gray-100 text-gray-400"
                  )}>
                    {task.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={cn(
                    "px-2 inline-flex text-xs leading-5 font-bold rounded",
                    getPriorityColor(task.priority)
                  )}>
                    {task.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {task.assignee ? (
                    <div className="flex items-center">
                      {task.assignee.avatar ? (
                        <img className="h-6 w-6 rounded-full mr-2" src={task.assignee.avatar} alt="" />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold mr-2">
                          {task.assignee.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {task.assignee.name}
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">Unassigned</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {task.dueDate ? (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                      {format(new Date(task.dueDate), 'MMM d, yyyy')}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-base font-medium text-gray-900">No tasks found</p>
                    <p className="text-sm text-gray-500 max-w-sm text-center">There are no tasks assigned in this workspace yet. Create a new task to get started.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
