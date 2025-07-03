# ZAEUS - AI-Powered Forex Education Platform

ZAEUS is an innovative educational platform designed to teach Forex trading through personalized AI-powered learning experiences. The platform combines interactive quizzes, real-time progress tracking, and an intelligent AI assistant to create an engaging learning environment.

## Project Structure

```
zAEus/
├── backend/                 # Node.js Express server
│   ├── config/             # Database configurations
│   ├── controllers/        # API controllers
│   ├── middleware/         # Authentication & logging
│   ├── routes/            # API routes
│   ├── services/          # Business logic & AI services
│   └── server.js          # Main server file
├── frontend/               # React TypeScript application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # Authentication context
│   │   ├── pages/         # Application pages
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript definitions
│   └── package.json       # Frontend dependencies
└── Documentation/          # Project documentation
    ├── CLAUDE.md
    ├── DOCUMENTATIE.md
    └── ZAEUS.md
```

## Features

### 🎓 Educational System
- **Interactive Quiz System**: Dynamic quizzes with real-time feedback and scoring
- **Skill Progression**: Track progress across multiple Forex trading skills
- **Mission System**: Complete daily and weekly challenges to earn rewards
- **Progress Analytics**: Visual charts and statistics for learning progress

### 🤖 AI Integration
- **Personalized AI Assistant**: OpenAI-powered chat assistant for Forex education
- **Adaptive Learning**: AI adjusts difficulty based on user performance
- **Smart Recommendations**: Personalized learning paths based on skill gaps
- **Real-time Feedback**: Instant AI-generated explanations for quiz answers

### 👤 User Management
- **Secure Authentication**: JWT-based authentication system
- **User Profiles**: Customizable profiles with avatar support
- **Activity Tracking**: Comprehensive logging of user interactions
- **Progress Persistence**: All learning progress saved to database

### 📊 Technical Features
- **Real-time Updates**: WebSocket support for live features
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **TypeScript**: Full type safety across the frontend
- **SQLite Database**: Lightweight, file-based database
- **RESTful API**: Well-structured API endpoints

## Technology Stack

### Frontend
- **React 18**: Modern React with functional components
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **Chart.js**: Data visualization for progress charts

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **SQLite3**: Database engine
- **JSON Web Tokens**: Authentication
- **bcrypt**: Password hashing
- **OpenAI API**: AI integration
- **Winston**: Logging framework

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Git

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```env
PORT=5000
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-api-key
NODE_ENV=development
```

4. Initialize the database:
```bash
node config/init-db-sqlite.js
```

5. Start the server:
```bash
npm start
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
REACT_APP_API_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm start
```

## Usage

1. **Registration**: Create a new account with username, email, and password
2. **Login**: Access your personalized dashboard
3. **Take Quizzes**: Test your Forex knowledge with interactive quizzes
4. **Track Progress**: Monitor your skill development through visual charts
5. **Chat with AI**: Get personalized help from the AI assistant
6. **Complete Missions**: Achieve daily goals for bonus rewards

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### User Endpoints
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/stats` - Get user statistics

### Quiz Endpoints
- `GET /api/skills/quiz/:category` - Get quiz questions
- `POST /api/skills/quiz/:category/submit` - Submit quiz answers
- `GET /api/skills/progress` - Get skill progress

### AI Endpoints
- `POST /api/ai/chat` - Send message to AI assistant
- `POST /api/ai/evaluate` - Get AI evaluation of performance

## Database Schema

The application uses SQLite with the following main tables:
- `users` - User accounts and profiles
- `quiz_results` - Quiz performance history
- `skill_progress` - Skill development tracking
- `activity_logs` - User activity logging
- `missions` - Available missions and challenges

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens expire after 24 hours
- API endpoints are protected with authentication middleware
- Input validation on all user inputs
- SQL injection protection through parameterized queries

## Future Enhancements

- [ ] Real-time market data integration
- [ ] Social features (leaderboards, challenges)
- [ ] Mobile applications (iOS/Android)
- [ ] Advanced AI tutoring capabilities
- [ ] Video lesson integration
- [ ] Trading simulator with virtual currency
- [ ] Multi-language support

## License

This project is proprietary software. All rights reserved.

## Contact

For questions or support, please contact the development team.

---

**Note**: This is an educational platform for learning Forex trading concepts. It does not provide financial advice or real trading capabilities.