# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack web application with:
- **Backend**: Node.js with Express, PostgreSQL database
- **Frontend**: React with TypeScript and Tailwind CSS
- **Authentication**: JWT-based authentication system
- **Admin Panel**: User management interface for administrators

## Project Structure

```
zAEus1/
├── backend/
│   ├── config/         # Database configuration and initialization
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Authentication middleware
│   ├── routes/         # API routes
│   ├── server.js       # Main server file
│   └── .env           # Environment variables
└── frontend/
    ├── src/
    │   ├── components/  # React components
    │   ├── context/     # Auth context
    │   ├── pages/       # Page components
    │   ├── services/    # API services
    │   └── types/       # TypeScript types
    └── public/
```

## Commands

### Backend
- **Start development server**: `cd backend && npm run dev`
- **Start production server**: `cd backend && npm start`
- **Install dependencies**: `cd backend && npm install`

### Frontend
- **Start development server**: `cd frontend && npm start`
- **Build for production**: `cd frontend && npm run build`
- **Install dependencies**: `cd frontend && npm install`

## Database Setup

1. Create a PostgreSQL database
2. Update the `.env` file in the backend directory with your database credentials
3. The database tables will be created automatically when the server starts
4. Default admin user: `Victor` / `admin123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### User Management (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### AI Features
- `POST /api/ai/chat` - Chat with Forex AI assistant
- `GET /api/ai/quiz?level=beginner|intermediate|advanced` - Generate quiz
- `POST /api/ai/quiz/evaluate` - Evaluate quiz answers
- `GET /api/ai/chat/history` - Get chat history
- `GET /api/ai/progress` - Get learning progress
- `PUT /api/ai/level` - Update user level

## Key Features

1. **Authentication**: JWT-based authentication with role-based access control
2. **User Management**: Admins can create, edit, and delete users
3. **Forex AI Assistant**: Educational chat bot powered by OpenAI GPT for Forex learning
4. **Interactive Quiz System**: Personalized quizzes with AI-generated questions and feedback
5. **Learning Progress Tracking**: User levels and progress analytics
6. **Modern UI**: Responsive design using Tailwind CSS
7. **TypeScript**: Type-safe frontend development
8. **Protected Routes**: Route protection based on authentication and user roles

## Development Notes

- The backend runs on port 5001 by default  
- The frontend runs on port 3000 by default
- CORS is enabled for cross-origin requests
- All API requests require authentication except login
- Admin routes require admin role
- OpenAI API key required for AI features (set OPENAI_API_KEY in .env)
- Users have learning levels: beginner, intermediate, advanced
- AI chat history and quiz progress are saved per user