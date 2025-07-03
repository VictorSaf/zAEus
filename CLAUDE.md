# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with the ZAEUS application repository.

## Project Overview

ZAEUS is a sophisticated, full-stack AI-powered Forex educational platform featuring:
- **Backend**: Node.js with Express.js and SQLite database
- **Frontend**: React 19 with TypeScript and Tailwind CSS  
- **Authentication**: JWT-based authentication with role-based access control
- **AI Integration**: OpenAI GPT-3.5-turbo for chat assistance and quiz generation
- **Learning System**: Progressive skill-based learning with XP tracking and daily missions

## Project Structure

```
/Users/victorsafta/work/zAEus1/nou/
├── backend/
│   ├── config/
│   │   ├── database-sqlite.js      # SQLite database connection
│   │   ├── database.js             # Legacy PostgreSQL config (unused)
│   │   ├── init-db-sqlite.js       # SQLite schema initialization  
│   │   └── init-db.js              # Legacy PostgreSQL init (unused)
│   ├── controllers/
│   │   ├── activityController.js   # Activity logging functionality
│   │   ├── aiController.js         # AI chat & quiz core logic
│   │   ├── authController.js       # Authentication handlers
│   │   ├── skillsController.js     # Forex skills & missions system
│   │   └── userController.js       # User management (admin only)
│   ├── services/
│   │   ├── openaiService.js        # OpenAI GPT integration
│   │   ├── skillsService.js        # Forex skills & XP management
│   │   └── missionsService.js      # Daily missions processing
│   ├── routes/
│   │   ├── auth.js                 # Authentication endpoints
│   │   ├── ai.js                   # AI chat and quiz endpoints
│   │   ├── skills.js               # Skills and missions endpoints
│   │   ├── users.js                # User management (admin)
│   │   └── activity.js             # Activity logging endpoints
│   ├── middleware/
│   │   ├── auth.js                 # JWT authentication middleware
│   │   └── activityLogger.js       # Activity tracking middleware
│   ├── database.sqlite             # Main SQLite database file
│   ├── zaeus_education.db          # Secondary database file
│   ├── server.js                   # Express server entry point
│   ├── package.json                # Backend dependencies
│   └── .env                        # Environment configuration
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── PrivateRoute.tsx     # Route protection component
    │   │   ├── ProgressCharts.tsx   # AntV data visualization charts
    │   │   └── UserStatsModal.tsx   # Detailed user statistics modal
    │   ├── pages/
    │   │   ├── Dashboard.tsx        # Main dashboard with progress tracking
    │   │   ├── ForexAI.tsx         # AI chat interface with streaming
    │   │   ├── Quiz.tsx            # Interactive quiz system
    │   │   ├── Login.tsx           # User authentication page
    │   │   └── Settings.tsx        # Admin panel for user management
    │   ├── services/
    │   │   ├── api.ts              # Axios HTTP client configuration
    │   │   ├── aiService.ts        # AI-related API calls
    │   │   └── authService.ts      # Authentication service functions
    │   ├── context/
    │   │   └── AuthContext.tsx     # React authentication context
    │   ├── types/
    │   │   ├── ai.ts               # AI-related TypeScript interfaces
    │   │   └── auth.ts             # Authentication TypeScript types
    │   └── App.tsx                 # Main application component
    ├── public/                     # Static assets
    ├── package.json               # Frontend dependencies
    └── tailwind.config.js         # Tailwind CSS configuration
```

## Technology Stack

### Backend Technologies
- **Node.js 18+** with Express.js 5.1.0 framework
- **SQLite 3** database (replaced PostgreSQL for simplicity)
- **JWT** authentication with bcrypt password hashing
- **OpenAI API** integration with GPT-3.5-turbo model
- **CORS** enabled for cross-origin requests

### Frontend Technologies  
- **React 19.1.0** with TypeScript 4.9.5
- **Tailwind CSS 3.4.17** for responsive styling
- **React Router DOM 7.6.3** for navigation
- **AntV G2Plot 2.4.26** for data visualization charts
- **Axios 1.10.0** for HTTP requests with JWT interceptors

### Development Tools
- **ESLint** and **Prettier** for code quality
- **Webpack** via Create React App for bundling
- **TypeScript** for type safety
- **Hot Reload** for development efficiency

## Database Schema (SQLite)

### Core Tables
1. **users** - User accounts with authentication and level tracking
   - Fields: id, username, email, password_hash, role, level, created_at, updated_at
   - Levels: beginner, intermediate, advanced

2. **learning_progress** - Quiz results and AI feedback
   - Fields: id, user_id, quiz_type, quiz_score, total_questions, level, ai_feedback, created_at

3. **ai_chat_history** - Chat conversations with AI assistant
   - Fields: id, user_id, message, response, message_type, created_at

4. **user_activity_log** - Comprehensive activity tracking
   - Fields: id, user_id, action_type, details, ip_address, user_agent, created_at

### Forex Skills System
5. **forex_skills** - 7 predefined Forex skills with categories
   - Skills: Analiză tehnică, Psihologie în trading, Risk Management, Price Action, Indicatori tehnici, Money Management, Fundamente economice

6. **user_skills** - User progress tracking for each skill
   - Fields: id, user_id, skill_id, current_xp, level, created_at, updated_at

7. **question_skills** - Mapping of quiz questions to skills for XP awards
   - Fields: id, question_text, skills (JSON array), created_at

### Daily Missions System
8. **daily_missions** - Active daily challenges for users
   - Fields: id, user_id, mission_type, target_value, current_progress, is_completed, expires_at, created_at

9. **mission_templates** - Templates for generating daily missions
   - Fields: id, mission_type, target_value, xp_reward, description, is_active

## Commands & Development Setup

### Backend Commands
```bash
cd backend
npm install                    # Install dependencies
npm start                     # Start production server (port 5002)
npm run dev                   # Start development server with nodemon
```

### Frontend Commands  
```bash
cd frontend
npm install                   # Install dependencies
npm start                     # Start development server (port 3000)
npm run build                 # Build for production
npm run lint                  # Run ESLint
```

### Environment Setup
Create `.env` file in backend directory:
```env
PORT=5002
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
OPENAI_API_KEY=your_openai_api_key_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=webapp_db
DB_USER=postgres
DB_PASSWORD=your_password_here
```

**Note**: PostgreSQL settings in .env are legacy - application uses SQLite exclusively.

## API Endpoints

### Authentication (`/api/auth`)
- `POST /login` - User authentication (username/password)
- `GET /me` - Get current authenticated user information

### AI Features (`/api/ai`)
- `POST /chat` - Interactive chat with AI assistant (streaming enabled)
- `GET /quiz` - Generate level-appropriate quiz questions
- `POST /quiz/evaluate` - Evaluate quiz answers with detailed AI feedback
- `GET /chat/history?limit=20&offset=0` - Retrieve chat conversation history
- `GET /progress` - Get comprehensive learning progress analytics
- `PUT /level` - Update user learning level (admin functionality)
- `GET /user-stats/:userId` - Detailed user statistics (admin only)

### Skills & Missions (`/api/skills`)
- `GET /` - Get user skills progression with XP and levels
- `GET /overview` - Skills overview grouped by categories
- `GET /missions` - Get current daily missions for user
- `POST /missions/:missionId/claim` - Claim completed mission rewards

### User Management (`/api/users` - Admin Only)
- `GET /` - List all users with pagination
- `POST /` - Create new user account
- `PUT /:id` - Update user information
- `DELETE /:id` - Delete user account

### Activity Monitoring (`/api/activity` - Admin Only)
- `GET /logs?limit=50&offset=0` - Get user activity logs
- `GET /stats` - Get activity statistics and analytics
- `GET /action-types` - Get available action types for filtering

## Key Features Implementation

### 1. Authentication & Authorization
- **JWT-based authentication** with secure token storage
- **Role-based access control** (Administrator vs regular users)
- **Password hashing** using bcrypt with salt rounds
- **Protected routes** with automatic token validation
- **Session management** with token refresh capabilities

### 2. AI-Powered Learning System
- **OpenAI GPT-3.5-turbo integration** for intelligent responses
- **Streaming chat responses** for real-time interaction
- **Context-aware conversations** based on user level
- **Adaptive quiz generation** matching user's current skill level
- **Detailed AI feedback** with personalized learning recommendations

### 3. Progressive Learning Framework
- **Three-tier level system**: Beginner → Intermediate → Advanced
- **Strict advancement criteria**: 5 consecutive perfect quiz scores required
- **Automatic level progression** without manual selection
- **Comprehensive progress tracking** with visual analytics
- **Skills-based learning** with XP rewards for correct answers

### 4. Forex Skills & XP System  
- **7 core Forex skills** covering all essential trading aspects
- **XP-based progression** (15 XP per correct answer per relevant skill)
- **10 levels per skill** (calculated as XP/1000)
- **Automatic question tagging** to relevant skills for XP attribution
- **Visual progress tracking** with charts and progress bars

### 5. Daily Missions System
- **Automated mission generation** from predefined templates
- **5 mission types**: Complete quizzes, Perfect scores, Answer streaks, Skill improvement, Chat activity
- **Daily refresh cycle** with automatic expiration
- **XP bonus rewards** for mission completion
- **Progress tracking** with real-time updates

### 6. Data Visualization & Analytics
- **AntV G2Plot charts** for sophisticated data visualization
- **Progress analytics** showing learning trends over time
- **Performance metrics** with detailed breakdowns
- **User statistics** accessible to administrators
- **Real-time progress updates** after quiz completion

### 7. Modern UI/UX Implementation
- **Responsive design** using Tailwind CSS
- **Interactive dashboard** with comprehensive overview
- **Real-time streaming chat** with markdown support
- **Progressive quiz interface** with immediate feedback
- **Admin panel** for user management and monitoring

## Learning Progression System Details

### Level Advancement Logic
- Users start at **Beginner** level automatically
- **No manual level selection** - system-controlled progression
- **Quiz difficulty** automatically matches user's current level
- **Advancement requirement**: 5 consecutive quizzes with 100% score at current level
- **Progress tracking**: Real-time calculation of consecutive perfect scores

### Quiz System Mechanics
- **10 questions per quiz** generated by AI
- **Level-appropriate difficulty** based on user progression
- **Immediate evaluation** with detailed AI feedback
- **Skills XP attribution** for correct answers (15 XP per skill per question)
- **Progress persistence** with comprehensive result storage

### Skills Progression Framework
1. **Analiză tehnică** (Technical Analysis) - Charts, patterns, technical indicators
2. **Psihologie în trading** (Trading Psychology) - Emotional control, discipline, mindset
3. **Risk Management** - Risk assessment, stop-loss strategies, position sizing
4. **Price Action** - Pure price movement analysis, support/resistance
5. **Indicatori tehnici** (Technical Indicators) - RSI, MACD, moving averages
6. **Money Management** - Capital allocation, portfolio management
7. **Fundamente economice** (Economic Fundamentals) - Economic events, news impact

## Default Configuration

### Server Configuration
- **Backend Port**: 5002 (configured in .env, not 5001 as previously documented)
- **Frontend Port**: 3000 (React development server default)
- **Database**: SQLite files (database.sqlite, zaeus_education.db)
- **API Base URL**: `http://localhost:5002/api`

### Default Authentication
- **Admin Username**: `Victor`
- **Admin Password**: `admin123`
- **Admin Role**: `Administrator` (full access to user management)
- **Default User Role**: Regular user (learning access only)

### AI Configuration
- **Model**: GPT-3.5-turbo (OpenAI)
- **Streaming**: Enabled for real-time chat responses
- **Context Awareness**: User level and learning history considered
- **Response Types**: Educational content, quiz questions, detailed feedback

## Development Notes & Important Details

### Database Migration Status
- **Successfully migrated** from PostgreSQL to SQLite for simplified deployment
- **Legacy PostgreSQL files** remain in codebase but are unused
- **SQLite benefits**: Single file database, no server required, easier development setup

### Current Implementation Status
- ✅ **Authentication system** - Fully implemented with JWT
- ✅ **User management** - Complete admin panel functionality  
- ✅ **AI chat system** - Streaming responses with OpenAI integration
- ✅ **Quiz system** - Adaptive difficulty with AI evaluation
- ✅ **Skills progression** - XP-based system with 7 Forex skills
- ✅ **Daily missions** - Automated generation and tracking
- ✅ **Progress analytics** - Comprehensive charts and statistics
- ✅ **Activity logging** - Complete user action tracking
- ✅ **Responsive UI** - Modern interface with Tailwind CSS

### Code Quality & Standards
- **TypeScript integration** throughout frontend for type safety
- **ESLint configuration** for consistent code styling
- **Component-based architecture** for maintainability
- **Service layer separation** for clean API integration
- **Error handling** with comprehensive try-catch blocks
- **Security measures** including JWT validation and SQL injection protection

### Performance Optimizations
- **Lazy loading** for React components to reduce initial bundle size
- **Memoization** for expensive chart rendering operations
- **Efficient database queries** with SQLite prepared statements
- **Streaming responses** for AI chat to improve perceived performance
- **Client-side caching** for user progress and statistics

### Security Implementation
- **JWT token validation** on all protected API endpoints
- **bcrypt password hashing** with appropriate salt rounds
- **SQL injection protection** through parameterized queries
- **CORS configuration** for secure cross-origin requests
- **Role-based route protection** preventing unauthorized access
- **Environment variable security** for API keys and secrets

## Future Development Notes

The application is production-ready with a comprehensive feature set. Any future enhancements should consider:
- **Multi-agent AI system** implementation for specialized learning assistants
- **Real-time market data integration** for live Forex education
- **Social learning features** for peer interaction and collaboration
- **Mobile application** development for iOS and Android platforms
- **Advanced analytics** with machine learning insights for personalized learning paths

This documentation reflects the **current state** of the ZAEUS application as of the latest update, ensuring accuracy for any future development work.