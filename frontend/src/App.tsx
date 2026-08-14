import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ModalProvider } from './components/providers/ModalProvider';
import { useAuthStore } from './store/useAuthStore';
import { usePresenceStore } from './store/usePresenceStore';
import { userApi } from './api/user';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ProtectedRoutes from './routes/ProtectedRoutes';
import DashboardLayout from './layouts/DashboardLayout';
import WorkspacePage from './pages/WorkspacePage';
import ChannelPage from './pages/ChannelPage';
import MeetingRoom from './components/meeting/MeetingRoom';
import WhiteboardList from './components/whiteboard/WhiteboardList';
import WhiteboardView from './components/whiteboard/WhiteboardView';
import TasksPage from './pages/TasksPage';
import CalendarPage from './pages/CalendarPage';
import AiAssistantPage from './pages/AiAssistantPage';

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const isAuthenticated = useAuthStore(state => !!state.accessToken);

  useEffect(() => {
    if (isAuthenticated) {
      const cleanup = usePresenceStore.getState().initializeIdleDetection();
      return cleanup;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const currentToken = useAuthStore.getState().accessToken;
        const res = await userApi.getMe();
        if (res.data) {
          useAuthStore.getState().setAuth(res.data, currentToken || '');
        }
      } catch {
        useAuthStore.getState().logout();
      } finally {
        setIsInitializing(false);
      }
    };

    restoreSession();
  }, []);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <BrowserRouter>
        <ModalProvider />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route element={<ProtectedRoutes />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/workspaces/:workspaceId" element={<WorkspacePage />} />
              <Route path="/workspaces/:workspaceId/channels/:channelId" element={<ChannelPage />} />
              <Route path="/workspaces/:workspaceId/whiteboards" element={<WhiteboardList />} />
              <Route path="/workspaces/:workspaceId/whiteboards/:whiteboardId" element={<WhiteboardView />} />
              <Route path="/workspaces/:workspaceId/meeting/:meetingId" element={<MeetingRoom />} />
              <Route path="/workspaces/:workspaceId/tasks" element={<TasksPage />} />
              <Route path="/workspaces/:workspaceId/calendar" element={<CalendarPage />} />
              <Route path="/workspaces/:workspaceId/ai" element={<AiAssistantPage />} />
              <Route path="/" element={<Dashboard />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
