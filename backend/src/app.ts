import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { logger } from './config/logger';
import { env } from './config/env';
import { corsConfig } from './config/cors';
import { setupSwagger } from './config/swagger';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware';
import { requestIdMiddleware } from './middleware/requestId';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import workspaceRoutes from './routes/workspaceRoutes';
import fileRoutes from './routes/fileRoutes';
import notificationRoutes from './routes/notificationRoutes';
import activityRoutes from './routes/activityRoutes';
import bookmarkRoutes from './routes/bookmarkRoutes';
import searchRoutes from './routes/searchRoutes';
import insightRoutes from './routes/insightRoutes';
import meetingRoutes from './routes/meetingRoutes';
import watchRoutes from './routes/watchRoutes';
import aiRoutes from './routes/aiRoutes';
import { whiteboardRouter } from './routes/whiteboardRoutes';
import { taskRouter } from './routes/taskRoutes';
import { calendarRouter } from './routes/calendarRoutes';
import { webhookRouter } from './routes/webhookRoutes';
import { integrationRouter } from './routes/integrationRoutes';
import { ApiResponse } from './utils/ApiResponse';

const app = express();

// Middleware
app.use(helmet());
app.use(cors(corsConfig));
app.use(compression());
app.use(express.json());
app.use(cookieParser());
app.use(requestIdMiddleware);

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per `window` (here, per 15 minutes)
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, 
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}

// Swagger Setup
setupSwagger(app);

// Health Check
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.status(200).json(new ApiResponse(200, null, 'CollabHub API is running smoothly'));
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/workspaces', workspaceRoutes);
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/activity', activityRoutes);
app.use('/api/v1/bookmarks', bookmarkRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/insights', insightRoutes);
app.use('/api/v1/meetings', meetingRoutes);
app.use('/api/v1/watch', watchRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/whiteboards', whiteboardRouter);
app.use('/api/v1/tasks', taskRouter);
app.use('/api/v1/calendar', calendarRouter);
app.use('/api/v1/webhooks', webhookRouter);
app.use('/api/v1/integrations', integrationRouter);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
