# CollabHub Deployment Guide

This guide provides instructions to deploy CollabHub in a production environment using modern, low-cost cloud providers.

## Architecture Overview
- **Frontend**: React (Vite) - Recommended deployment: **Vercel**
- **Backend**: Node.js/Express - Recommended deployment: **Render** (or Railway/Heroku)
- **Database**: PostgreSQL - Recommended deployment: **Neon** (or Supabase/Aiven)
- **File Storage**: **Cloudinary**

---

## 1. Database Deployment (Neon)

1. Create a free account at [Neon.tech](https://neon.tech/).
2. Create a new PostgreSQL project.
3. Copy the **Connection String** from the Neon dashboard.
4. It should look like this: `postgresql://user:password@ep-rest-of-host.region.aws.neon.tech/neondb?sslmode=require`
5. Keep this string ready for the backend environment variables.

---

## 2. File Storage Deployment (Cloudinary)

1. Create a free account at [Cloudinary](https://cloudinary.com/).
2. Navigate to your dashboard to find your **Cloud Name**, **API Key**, and **API Secret**.
3. Keep these ready for the backend environment variables.
4. Note the Cloud Name for the frontend environment variables as well.

---

## 3. Backend Deployment (Render)

We will use Render to host the Node.js backend. The backend uses WebSockets (Socket.IO) and requires an environment that supports persistent connections.

1. Create an account at [Render](https://render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. Set the following build and start commands:
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
5. **Environment Variables**: Add the following in Render:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: Your Neon connection string
   - `JWT_ACCESS_SECRET`: A long, random string
   - `JWT_REFRESH_SECRET`: Another long, random string
   - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary Cloud Name
   - `CLOUDINARY_API_KEY`: Your Cloudinary API Key
   - `CLOUDINARY_API_SECRET`: Your Cloudinary API Secret
   - `FRONTEND_URL`: Your Vercel frontend URL (e.g. `https://collabhub.vercel.app`)
   - `AI_API_KEY`: Your Gemini/OpenAI key
   - `TURN_SERVER_URL` (optional): WebRTC TURN server
6. Deploy the service.
7. Note the Render URL (e.g., `https://collabhub-backend.onrender.com`).

### Database Migrations in Production
Once the backend is deployed, you need to run database migrations. Do NOT use `prisma db push` in production. Instead, run:
`npx prisma migrate deploy`
(You can run this via the "Shell" tab in Render dashboard).

---

## 4. Frontend Deployment (Vercel)

1. Create a free account at [Vercel](https://vercel.com/).
2. Click **Add New Project** and select your GitHub repository.
3. Set the **Framework Preset** to `Vite`.
4. Set the **Root Directory** to `frontend`.
5. **Environment Variables**: Add the following:
   - `VITE_API_URL`: Your Render backend URL + `/api/v1` (e.g., `https://collabhub-backend.onrender.com/api/v1`)
   - `VITE_SOCKET_URL`: Your Render backend URL (e.g., `https://collabhub-backend.onrender.com`)
   - `VITE_CLOUDINARY_CLOUD_NAME`: Your Cloudinary Cloud Name
6. Deploy the project.

---

## 5. Security Checklist

Before finalizing deployment, verify:
- [ ] CORS allows ONLY the specific frontend domain.
- [ ] You have NOT checked `.env` files into GitHub.
- [ ] JWT secrets are randomly generated (e.g. via `openssl rand -hex 64`).
- [ ] Webhooks and Link Previews block internal network IPs (SSRF).
