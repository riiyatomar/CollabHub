import { useState, useEffect } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useModalStore } from '../../store/useModalStore';
import { X } from 'lucide-react';
import { Input } from '../Input';
import { Button } from '../Button';
import { toast } from 'sonner';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId?: string;
  initialTitle?: string;
}

export default function CreateTaskModal({ isOpen, onClose, messageId, initialTitle }: CreateTaskModalProps) {
  const { activeWorkspace, fetchWorkspaceMembers, members } = useWorkspaceStore();
  const { createTask, isLoading } = useTaskStore();
  const { data } = useModalStore();
  
  const [title, setTitle] = useState(data?.initialTitle || initialTitle || '');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (isOpen && activeWorkspace) {
      setTitle(data?.initialTitle || initialTitle || '');
      fetchWorkspaceMembers(activeWorkspace.id);
    }
  }, [isOpen, activeWorkspace, data, initialTitle, fetchWorkspaceMembers]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) {
      toast.error("Active workspace is missing!");
      return;
    }
    
    try {
      toast.info("Sending request to backend...");
      await createTask(activeWorkspace.id, {
        title,
        description,
        priority,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        messageId: data?.messageId || messageId || null
      });
      toast.success('Task created successfully');
      setTitle('');
      setDescription('');
      setAssigneeId('');
      setDueDate('');
      setPriority('MEDIUM');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create task');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Create Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input 
            label="Task Title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="What needs to be done?" 
            required 
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 transition-colors"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 transition-colors"
                value={priority}
                onChange={(e: any) => setPriority(e.target.value)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 transition-colors"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
            <select
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 transition-colors"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {members.map(member => (
                <option key={member.id} value={member.user?.id}>{member.user?.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isLoading} onClick={handleSubmit}>
              {isLoading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
