import { useState } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import type { Task } from '../../api/tasks';
import { cn } from '../../utils/cn';
import { Calendar, MessageSquare, GripVertical, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const COLUMNS: { id: Task['status']; title: string; color: string }[] = [
  { id: 'TODO', title: 'To Do', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'REVIEW', title: 'In Review', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { id: 'DONE', title: 'Done', color: 'bg-green-50 text-green-700 border-green-200' }
];

export default function TaskBoard() {
  const { tasks, updateTask } = useTaskStore();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    // Small delay to allow the drag image to be generated before styling the original
    setTimeout(() => {
      const el = document.getElementById(`task-${taskId}`);
      if (el) el.classList.add('opacity-50');
    }, 0);
  };

  const handleDragEnd = (_e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(null);
    const el = document.getElementById(`task-${taskId}`);
    if (el) el.classList.remove('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (_e: React.DragEvent, status: Task['status']) => {
    _e.preventDefault();
    if (!draggedTaskId) return;

    const task = tasks.find(t => t.id === draggedTaskId);
    if (task && task.status !== status) {
      // Optimistic update in UI handled by the store internally or we just call update
      await updateTask(draggedTaskId, { status });
    }
    setDraggedTaskId(null);
  };

  return (
    <div className="flex h-full gap-6 overflow-x-auto pb-4">
      {COLUMNS.map(col => {
        const columnTasks = tasks.filter(t => t.status === col.id);
        
        return (
          <div 
            key={col.id} 
            className="flex-shrink-0 w-80 flex flex-col"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className={cn("px-4 py-3 rounded-t-xl border-t border-x font-semibold flex justify-between items-center", col.color)}>
              <span>{col.title}</span>
              <span className="bg-white/50 text-current text-xs px-2 py-0.5 rounded-full">
                {columnTasks.length}
              </span>
            </div>
            
            <div className={cn(
              "flex-1 p-3 border-x border-b border-gray-200 rounded-b-xl flex flex-col gap-3 min-h-[200px] transition-colors",
              draggedTaskId ? "bg-gray-50/50" : "bg-gray-50"
            )}>
              {columnTasks.map(task => (
                <div
                  key={task.id}
                  id={`task-${task.id}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={(e) => handleDragEnd(e, task.id)}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {task.priority === 'URGENT' && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Urgent</span>
                      )}
                      {task.priority === 'HIGH' && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">High</span>
                      )}
                    </div>
                    <GripVertical className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <h4 className="font-medium text-gray-900 mb-1 leading-tight">{task.title}</h4>
                  
                  {task.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{task.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-3 text-xs text-gray-400">
                      {task.dueDate && (
                        <div className="flex items-center text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          <Calendar className="w-3 h-3 mr-1" />
                          {format(new Date(task.dueDate), 'MMM d')}
                        </div>
                      )}
                      {task.messageId && (
                        <div className="flex items-center text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded" title="Created from message">
                          <MessageSquare className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    
                    {task.assignee && (
                      <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 ml-2 border border-white" title={task.assignee.name}>
                        {task.assignee.avatar ? (
                          <img src={task.assignee.avatar} alt={task.assignee.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-medium text-gray-600 bg-indigo-100">
                            {task.assignee.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {columnTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100">
                    <CheckCircle className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-900 font-medium text-sm">No tasks here</p>
                  <p className="text-gray-500 text-xs mt-1 text-center max-w-[200px]">Tasks moved to this column will appear here.</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
