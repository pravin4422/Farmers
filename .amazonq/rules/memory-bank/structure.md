# Project Structure - Backbone Agricultural Management System

## Directory Organization

### Root Structure
```
Back_Bone/
├── backbone-backend/     # Node.js/Express backend server
├── frontend/             # React.js web application
├── ML/                   # Python ML microservices
├── Documents/            # Project documentation
└── .amazonq/             # Amazon Q configuration and rules
```

## Backend Structure (backbone-backend/)

### Core Directories
```
backbone-backend/
├── config/               # Configuration files
│   └── db.js            # MongoDB connection setup
├── controllers/          # Business logic layer
├── middleware/           # Request processing middleware
├── models/              # MongoDB schemas (Mongoose)
├── routes/              # API endpoint definitions
├── services/            # External service integrations
├── validators/          # Input validation logic
└── scripts/             # Database migration scripts
```

### Controllers (Business Logic)
- **authController.js**: User registration, login, password reset
- **creatorController.js**: Seeding and planting activity management
- **cultivationController.js**: Field cultivation operations
- **tractorController.js**: Equipment usage tracking
- **productController.js**: Agricultural product inventory
- **priceController.js**: Market price management
- **kamittyController.js**: Mandi/market records
- **problemController.js**: Problem reporting and solutions
- **libraryController.js**: Knowledge base management
- **expiryController.js**: Product expiry tracking
- **schemeController.js**: Government scheme information
- **chatbotController.js**: AI chatbot interactions
- **cropRecommendationController.js**: ML crop suggestions
- **predictionController.js**: Yield prediction coordination
- **userProfileController.js**: Extended user profile management

### Models (Database Schemas)
- **User.js**: Authentication and basic user data
- **UserProfile.js**: Extended user information
- **Creator.js**: Seeding/planting records
- **CultivationActivity.js**: Field cultivation data
- **Tractor.js**: Equipment usage records
- **Product.js**: Agricultural product inventory
- **Price.js**: Market price information
- **Kamitty.js**: Mandi records
- **Problem.js**: Reported agricultural problems
- **Library.js**: Knowledge base entries
- **Expiry.js**: Product expiry tracking
- **Scheme.js**: Government schemes
- **Post.js**: Forum posts
- **CommonForum.js**: Community discussions
- **Task.js**: Reminders and scheduled activities
- **ChatHistory.js**: Chatbot conversation history

### Routes (API Endpoints)
- **authRoutes.js**: /api/auth/* - Authentication endpoints
- **creatorRoutes.js**: /api/creator-details/* - Seeding/planting APIs
- **cultivationRoutes.js**: /api/cultivation-activities/* - Field activity APIs
- **tractorRoutes.js**: /api/tractor/* - Equipment APIs
- **products.js**: /api/products/* - Product inventory APIs
- **priceRoutes.js**: /api/prices/* - Market price APIs
- **kamittyRoutes.js**: /api/kamitty/* - Mandi APIs
- **problemRoutes.js**: /api/problems/* - Problem reporting APIs
- **libraryRoutes.js**: /api/library/* - Knowledge base APIs
- **expiryRoutes.js**: /api/expiries/* - Expiry tracking APIs
- **schemeRoutes.js**: /api/schemes/* - Government scheme APIs
- **chatbotRoutes.js**: /api/chatbot/* - Chatbot APIs
- **cropRecommendationRoutes.js**: /api/crop-recommendation/* - ML recommendation APIs
- **predictionRoutes.js**: /api/predict/* - Yield prediction APIs
- **posts.js**: /api/posts/* - Forum post APIs
- **commonForumRoutes.js**: /api/common-forum/* - Community forum APIs
- **tasks.js**: /api/tasks/* - Task/reminder APIs
- **userProfileRoutes.js**: /api/user-profile/* - Profile management APIs

### Middleware
- **authMiddleware.js**: JWT token verification and user authentication
- **solutionValidator.js**: AI-powered solution validation

### Services
- **chatbotService.js**: Chatbot logic and conversation management
- **geminiValidator.js**: Google Gemini AI integration for validation
- **groqValidator.js**: Groq AI integration for validation

### Configuration Files
- **server.js**: Main application entry point
- **package.json**: Node.js dependencies and scripts
- **.env**: Environment variables (MongoDB URI, JWT secret, API keys)

## Frontend Structure (frontend/)

### Core Directories
```
frontend/
├── public/              # Static assets
│   ├── Mainfolder/     # Additional static resources
│   ├── index.html      # HTML template
│   └── manifest.json   # PWA configuration
└── src/                # React source code
    ├── components/     # Reusable UI components
    ├── context/        # React Context for state management
    ├── css/            # Stylesheets
    ├── pages/          # Page-level components
    ├── App.js          # Main application component
    └── index.js        # Application entry point
```

### Key Components
- **Navbar.js**: Navigation bar with authentication state
- **ProtectedRoute.js**: Route guard for authenticated pages
- **Reusable UI Components**: Forms, tables, cards, modals

### Context Providers
- **LanguageContext.js**: Multi-language support state
- **SeasonContext.js**: Season filtering state
- **AuthContext**: User authentication state (implied)

### Pages
- **Dashboard.js**: Main dashboard with overview
- **Login.js**: User authentication page
- **Signup.js**: User registration page
- **CreatorDetails.js**: Seeding/planting management
- **CultivationField.js**: Field activity tracking
- **TractorManagement.js**: Equipment tracking
- **ProductInventory.js**: Agricultural product management
- **PriceMonitoring.js**: Market price viewing
- **TaskReminder.js**: Task and reminder management
- **Forum.js**: Community discussion board
- **Library.js**: Agricultural knowledge base
- **CropRecommendation.js**: AI crop suggestions
- **YieldPrediction.js**: Yield forecasting
- **UserProfile.js**: Profile management

### Configuration
- **package.json**: React dependencies and build scripts
- **proxy**: Configured to http://localhost:5000 for API calls

## ML Service Structure (ML/)

### Crop Recommendation Service
```
ML/
├── app.py                  # Flask server for crop prediction
├── crop_encoder.pkl        # Trained crop label encoder
├── district_encoder.pkl    # District label encoder
├── season_encoder.pkl      # Season label encoder
├── state_encoder.pkl       # State label encoder
└── [model files]           # Trained ML models
```

### Yield Prediction Service
```
ML/Yield_prediction/
├── yield.py               # Flask server for yield prediction
├── yield_model.pkl        # Trained yield prediction model
└── yield_encoders.pkl     # Label encoders for yield features
```

## Documentation Structure (Documents/)

### Documentation Files
- **PROJECT_DOCUMENTATION.md**: Comprehensive project documentation
- **BACKEND_STATUS_REPORT.md**: Backend implementation status
- **PREDICTION_SERVICE_README.md**: ML service documentation
- **CHATBOT_SETUP.md**: Chatbot configuration guide
- **CROP_RECOMMENDATION_*.md**: Crop recommendation feature docs
- **AI_VALIDATION_*.md**: AI validation pipeline documentation
- **TROUBLESHOOTING.md**: Common issues and solutions
- **QUICK_START_*.md**: Quick start guides for features

## Architectural Patterns

### Three-Tier Architecture
1. **Presentation Layer**: React.js frontend with responsive UI
2. **Application Layer**: Express.js backend with RESTful APIs
3. **Data Layer**: MongoDB with Mongoose ODM

### Microservices Pattern
- **Backend Service**: Main application logic (Port 5000)
- **Crop Prediction Service**: ML-based crop recommendations (Port 5001)
- **Yield Prediction Service**: ML-based yield forecasting (Port 5002)

### Component Relationships

#### Frontend → Backend
- React components make HTTP requests via Axios
- JWT tokens included in Authorization headers
- RESTful API communication pattern

#### Backend → Database
- Mongoose ODM for schema definition and validation
- Connection pooling for performance
- Indexed queries for fast retrieval

#### Backend → ML Services
- HTTP requests to Flask microservices
- JSON payload for input parameters
- Async/await pattern for non-blocking calls

### Authentication Flow
1. User submits credentials to /api/auth/login
2. Backend validates against User model
3. JWT token generated and returned
4. Frontend stores token in localStorage
5. Token included in subsequent API requests
6. authMiddleware verifies token on protected routes

### Data Flow Example (Creator Details)
1. User fills form in CreatorDetails.js page
2. Form submission triggers API call to /api/creator-details
3. Request passes through authMiddleware
4. creatorController processes business logic
5. Creator model saves data to MongoDB
6. Response sent back to frontend
7. UI updates with new data

## Key Design Principles

### Separation of Concerns
- Controllers handle business logic
- Models define data structure
- Routes define API endpoints
- Middleware handles cross-cutting concerns

### Modularity
- Each feature has dedicated controller, model, and routes
- Reusable components in frontend
- Independent ML microservices

### Scalability
- Stateless API design
- Microservices can scale independently
- Database indexing for performance
- Connection pooling and caching ready

### Security
- JWT-based authentication
- Password hashing with bcrypt
- User-specific data isolation
- CORS configuration
- Environment variable protection

### Maintainability
- Consistent naming conventions
- Modular code structure
- Comprehensive documentation
- Version control with Git
