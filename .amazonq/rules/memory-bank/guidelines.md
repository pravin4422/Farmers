# Development Guidelines - Backbone Agricultural Management System

## Code Quality Standards

### File Naming Conventions
- **Backend Files**: camelCase for JavaScript files (e.g., authController.js, authMiddleware.js)
- **Frontend Files**: PascalCase for React components (e.g., CreatorDetail.js, UserProfile.js)
- **Python Files**: snake_case for Python modules (e.g., gemini_service.py, yield.py)
- **Configuration Files**: lowercase with hyphens or dots (e.g., package.json, .env)

### Code Formatting
- **Indentation**: 2 spaces for JavaScript/React, 4 spaces for Python
- **Line Endings**: CRLF (Windows style) - consistent across the codebase
- **Semicolons**: Used consistently in backend JavaScript, optional in React components
- **Quotes**: Single quotes for JavaScript imports, double quotes for JSX attributes
- **Arrow Functions**: Preferred for callbacks and functional components

### Structural Conventions
- **Module Exports**: Use module.exports for Node.js (CommonJS pattern)
- **ES6 Imports**: Use import/export for React frontend
- **Destructuring**: Consistently used for extracting properties and imports
- **Async/Await**: Preferred over promises for asynchronous operations
- **Error Handling**: Try-catch blocks in all async functions

### Documentation Standards
- **Inline Comments**: Used for complex logic explanation
- **Section Headers**: Comment blocks with === separators for major sections
- **TODO Comments**: Mark incomplete features or future improvements
- **API Documentation**: Separate markdown files for comprehensive API docs

## Backend Development Patterns

### Controller Pattern
```javascript
// Standard controller structure
exports.functionName = async (req, res) => {
  try {
    // 1. Extract data from request
    const { param1, param2 } = req.body;
    
    // 2. Validate input (if needed)
    if (!param1) return res.status(400).json({ message: 'Error message' });
    
    // 3. Perform business logic
    const result = await Model.findOne({ param1 });
    
    // 4. Return response
    res.status(200).json({ data: result });
  } catch (error) {
    // 5. Handle errors
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
```

### Model Pattern (Mongoose)
```javascript
const mongoose = require('mongoose');

const schemaName = new mongoose.Schema({
  field1: { type: String, required: true },
  field2: { type: String, unique: true },
  field3: { type: Number, default: 0 },
  referenceField: { type: mongoose.Schema.Types.ObjectId, ref: 'OtherModel' }
}, { timestamps: true }); // Always include timestamps

module.exports = mongoose.model('ModelName', schemaName);
```

### Route Pattern
```javascript
const express = require('express');
const router = express.Router();
const controller = require('../controllers/controllerName');
const protect = require('../middleware/authMiddleware');

// Public routes
router.post('/endpoint', controller.functionName);

// Protected routes
router.get('/protected', protect, controller.protectedFunction);

module.exports = router;
```

### Authentication Middleware Usage
- **Import Pattern**: `const protect = require('../middleware/authMiddleware');`
- **Apply to Routes**: Add as second parameter before controller function
- **Access User**: Use `req.user` or `req.userId` in protected controllers
- **Token Format**: Always use "Bearer {token}" in Authorization header

### Error Response Format
```javascript
// Consistent error response structure
res.status(statusCode).json({ 
  message: 'Human-readable error message',
  error: error.message // Optional: technical details
});
```

### Success Response Format
```javascript
// Consistent success response structure
res.status(200).json({ 
  data: result,           // Main data payload
  message: 'Success message' // Optional
});
```

## Frontend Development Patterns

### Component Structure
```javascript
import React, { useState, useEffect } from 'react';
import api from '../api';

function ComponentName({ user }) {
  // 1. State declarations
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 2. useEffect hooks
  useEffect(() => {
    fetchData();
  }, []);
  
  // 3. Helper functions
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/endpoint');
      setData(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 4. Render
  return (
    <div>
      {/* JSX content */}
    </div>
  );
}

export default ComponentName;
```

### API Call Pattern
```javascript
// Using centralized axios instance
import api from '../api';

// GET request
const response = await api.get('/endpoint');

// POST request
const response = await api.post('/endpoint', { data });

// PUT request
const response = await api.put('/endpoint/:id', { data });

// DELETE request
const response = await api.delete('/endpoint/:id');
```

### Authentication State Management
```javascript
// Store authentication data in localStorage
localStorage.setItem('token', token);
localStorage.setItem('userEmail', email);
localStorage.setItem('displayName', name);

// Retrieve authentication data
const token = localStorage.getItem('token');
const email = localStorage.getItem('userEmail');

// Clear on logout
localStorage.removeItem('token');
localStorage.removeItem('userEmail');
localStorage.removeItem('displayName');
```

### Protected Route Pattern
```javascript
// Wrap protected pages with ProtectedRoute component
<Route
  path="/protected-page"
  element={
    <ProtectedRoute>
      <ProtectedPage user={user} />
    </ProtectedRoute>
  }
/>
```

### Context Usage Pattern
```javascript
// Wrap app with context providers
<LanguageProvider>
  <SeasonProvider>
    <App />
  </SeasonProvider>
</LanguageProvider>
```

## Database Patterns

### Schema Design Principles
- **Timestamps**: Always include `{ timestamps: true }` for createdAt/updatedAt
- **Required Fields**: Mark essential fields with `required: true`
- **Unique Constraints**: Use `unique: true` for fields like email
- **Default Values**: Provide sensible defaults (e.g., `default: 0` for counters)
- **References**: Use ObjectId with ref for relationships

### Query Patterns
```javascript
// Find with user isolation
const data = await Model.find({ userId: req.userId });

// Find one with error handling
const item = await Model.findOne({ _id: id });
if (!item) return res.status(404).json({ message: 'Not found' });

// Create with user association
const newItem = new Model({ ...data, userId: req.userId });
await newItem.save();

// Update
await Model.findByIdAndUpdate(id, updateData, { new: true });

// Delete
await Model.findByIdAndDelete(id);

// Exclude password from queries
const user = await User.findById(id).select('-password');
```

## Security Patterns

### Password Handling
```javascript
// Hash password on signup
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

// Compare password on login
const isMatch = await bcrypt.compare(password, user.password);
```

### JWT Token Management
```javascript
// Generate token with 7-day expiration
const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Verify token in middleware
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### Environment Variables
- **Never commit .env files**: Always in .gitignore
- **Required Variables**: MONGO_URI, PORT, JWT_SECRET, GROQ_API_KEY
- **Access Pattern**: `process.env.VARIABLE_NAME`
- **Load Early**: Use `dotenv.config()` at the top of server.js

## API Design Patterns

### RESTful Conventions
- **GET**: Retrieve data (list or single item)
- **POST**: Create new resource
- **PUT**: Update existing resource
- **DELETE**: Remove resource

### Endpoint Naming
- **Plural Nouns**: /api/products, /api/tasks
- **Nested Resources**: /api/creator-details/history
- **Actions**: /api/auth/login, /api/predict/crop

### Status Codes
- **200**: Success (GET, PUT)
- **201**: Created (POST)
- **400**: Bad request (validation error)
- **401**: Unauthorized (authentication required)
- **404**: Not found
- **500**: Server error

## Python/ML Service Patterns

### Service Structure
```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib

app = Flask(__name__)
CORS(app)

# Load models at startup
model = joblib.load('model.pkl')
encoder = joblib.load('encoder.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        # Process and predict
        result = model.predict(processed_data)
        return jsonify({'prediction': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)
```

### AI Integration Pattern
```python
# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Configure AI service
import google.generativeai as genai
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Create model instance
model = genai.GenerativeModel("gemini-1.5-flash")

# Generate response with structured prompt
def get_advice(prompt: str):
    response = model.generate_content(f"""
        System instructions here.
        
        User input: {prompt}
    """)
    return response.text
```

## Testing Patterns

### Frontend Testing
```javascript
import { render, screen } from '@testing-library/react';
import Component from './Component';

test('description of test', () => {
  render(<Component />);
  const element = screen.getByText(/text to find/i);
  expect(element).toBeInTheDocument();
});
```

### Backend Testing
- **Test Files**: Named test-*.js in root directory
- **Manual Testing**: Use Postman or similar tools
- **Test Data**: Separate test data files (e.g., test_data.json)

## Common Code Idioms

### Conditional Rendering (React)
```javascript
{loading && <div>Loading...</div>}
{error && <div>Error: {error}</div>}
{data.length > 0 ? (
  <DataList data={data} />
) : (
  <div>No data available</div>
)}
```

### Array Operations
```javascript
// Map for transformation
const items = data.map(item => <Item key={item._id} data={item} />);

// Filter for selection
const filtered = data.filter(item => item.status === 'active');

// Find for single item
const found = data.find(item => item.id === targetId);
```

### Async Error Handling
```javascript
// Always wrap async operations in try-catch
try {
  const result = await asyncOperation();
  // Handle success
} catch (error) {
  console.error('Error:', error);
  // Handle error
} finally {
  // Cleanup (e.g., setLoading(false))
}
```

## Internal API Usage Examples

### Authentication Flow
```javascript
// Frontend: Login
const response = await api.post('/auth/login', { email, password });
localStorage.setItem('token', response.data.token);

// Backend: Protected endpoint
router.get('/protected', protect, async (req, res) => {
  // Access authenticated user via req.user or req.userId
  const data = await Model.find({ userId: req.userId });
  res.json({ data });
});
```

### CRUD Operations
```javascript
// Create
const newItem = await api.post('/endpoint', formData);

// Read (list)
const items = await api.get('/endpoint');

// Read (single)
const item = await api.get(`/endpoint/${id}`);

// Update
const updated = await api.put(`/endpoint/${id}`, updateData);

// Delete
await api.delete(`/endpoint/${id}`);
```

### ML Service Integration
```javascript
// Backend controller calling ML service
const axios = require('axios');

exports.predictCrop = async (req, res) => {
  try {
    const mlResponse = await axios.post('http://localhost:5001/predict', req.body);
    res.json({ prediction: mlResponse.data });
  } catch (error) {
    res.status(500).json({ message: 'Prediction failed', error: error.message });
  }
};
```

## Frequently Used Annotations

### JSDoc Comments (Backend)
```javascript
/**
 * Get user profile by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} User profile data
 */
```

### React PropTypes (Optional)
```javascript
// Component.propTypes = {
//   user: PropTypes.object.isRequired,
//   onSubmit: PropTypes.func
// };
```

### Python Type Hints
```python
def get_advice(prompt: str) -> str:
    """Get agricultural advice from AI model"""
    return response.text
```

## Best Practices Summary

### Code Organization
- One feature per file (controller, model, route)
- Group related files in directories
- Separate concerns (business logic in controllers, data in models)
- Keep components small and focused

### Performance
- Use async/await for non-blocking operations
- Load ML models once at startup, not per request
- Implement pagination for large datasets
- Use database indexes for frequently queried fields

### Security
- Always validate user input
- Use parameterized queries (Mongoose handles this)
- Never expose sensitive data in responses
- Implement rate limiting for production
- Use HTTPS in production

### Maintainability
- Write self-documenting code with clear variable names
- Add comments for complex logic only
- Keep functions small and single-purpose
- Use consistent naming conventions
- Update documentation when changing features

### Error Handling
- Always use try-catch for async operations
- Provide meaningful error messages
- Log errors for debugging
- Return appropriate HTTP status codes
- Never expose stack traces to clients

### Git Practices
- Commit frequently with descriptive messages
- Keep .env files in .gitignore
- Don't commit node_modules or build artifacts
- Use branches for new features
- Review code before merging

## Project-Specific Conventions

### User Data Isolation
- Always filter queries by userId: `{ userId: req.userId }`
- Attach userId to created documents
- Verify ownership before update/delete operations

### Multi-Language Support
- Use LanguageContext for language state
- Prepare translation keys for all user-facing text
- Support voice content for accessibility

### Season Filtering
- Use SeasonContext for season-based filtering
- Provide season selection in relevant components
- Filter historical data by season and year

### Response Consistency
- Always return JSON responses
- Use consistent property names (data, message, error)
- Include appropriate status codes
- Handle both success and error cases

### File Upload Handling
- Use multer middleware for file uploads
- Validate file types and sizes
- Store files securely
- Clean up temporary files

This guidelines document reflects the actual patterns and practices used throughout the Backbone Agricultural Management System codebase. Follow these conventions to maintain consistency and code quality.
