import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTaskStore } from '../store/useTaskStore';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { Kanban, List, Calendar as CalendarIcon, Plus } from 'lucide-react';
import TaskBoard from '../components/tasks/TaskBoard';
import TaskList from '../components/tasks/TaskList';
import { cn } from '../utils/cn';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})
import { useModalStore } from '../store/useModalStore';

export default function TasksPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { fetchTasks, isLoading } = useTaskStore();
  const { activeWorkspace } = useWorkspaceStore();
  const { onOpen } = useModalStore();
  const [view, setView] = useState<'KANBAN' | 'LIST' | 'CALENDAR'>('KANBAN');

  useEffect(() => {
    if (workspaceId) {
      fetchTasks(workspaceId);
    }
  }, [workspaceId, fetchTasks]);

  const tasks = useTaskStore(state => state.tasks);
  
  const mappedTasks = tasks.filter(t => t.dueDate).map(t => ({
    title: t.title,
    start: new Date(t.dueDate!),
    end: new Date(t.dueDate!), // Tasks are point-in-time usually, or span a day
    allDay: true,
    resource: t
  }));

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Workspace Tasks</h1>
            <p className="text-gray-500 text-sm mt-1">Manage and track work across {activeWorkspace?.name}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setView('KANBAN')}
                className={cn(
                  "p-2 rounded-md flex items-center transition-colors focus:outline-none",
                  view === 'KANBAN' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
                title="Board View"
              >
                <Kanban className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('LIST')}
                className={cn(
                  "p-2 rounded-md flex items-center transition-colors focus:outline-none",
                  view === 'LIST' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('CALENDAR')}
                className={cn(
                  "p-2 rounded-md flex items-center transition-colors focus:outline-none",
                  view === 'CALENDAR' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
                title="Calendar View"
              >
                <CalendarIcon className="w-4 h-4" />
              </button>
            </div>
            
            <button 
              onClick={() => onOpen('createTask')}
              className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg flex items-center transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto h-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {view === 'KANBAN' && <TaskBoard />}
              {view === 'LIST' && <TaskList />}
              {view === 'CALENDAR' && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 h-full min-h-[600px]">
                  <Calendar
                    localizer={localizer}
                    events={mappedTasks}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    views={['month', 'week', 'day', 'agenda']}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
