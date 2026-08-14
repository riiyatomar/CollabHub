import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCalendarStore } from '../../store/useCalendarStore';
import { Calendar as CalendarIcon, ChevronLeft } from 'lucide-react';
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

export default function WorkspaceCalendar() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { events, fetchEvents, isLoading } = useCalendarStore();

  useEffect(() => {
    if (workspaceId) {
      fetchEvents(workspaceId);
    }
  }, [workspaceId, fetchEvents]);

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-500 animate-pulse">Loading Calendar...</div>;
  }

  const mappedEvents = events.map(e => ({
    title: e.title,
    start: new Date(e.startTime),
    end: new Date(e.endTime),
    resource: e
  }));

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-10 shadow-sm relative">
        <div className="flex items-center space-x-3">
          <Link 
            to={`/workspaces/${workspaceId}`}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="h-4 w-px bg-gray-300" />
          <h1 className="font-semibold text-gray-900 flex items-center">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Calendar
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          {/* New Event button hidden until implemented */}
        </div>
      </div>

      {/* Calendar Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm p-4 h-full min-h-[600px]">
          <Calendar
            localizer={localizer}
            events={mappedEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            views={['month', 'week', 'day', 'agenda']}
          />
        </div>
      </div>
    </div>
  );
}
