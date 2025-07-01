# API - Masal Makinesi

Vercel Edge Functions for story generation API.

## Endpoints

### POST /api/story
Main story generation endpoint.

**Headers:**
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "childName": "Ahmet",
  "age": 7,
  "theme": "adventure",
  "length": "short",
  "elements": ["köpek", "orman"],
  "token": "jwt_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "story": {
    "id": "story_123...",
    "title": "Ahmet'in Orman Macerası",
    "content": "Bir zamanlar...",
    "childName": "Ahmet",
    "theme": "adventure",
    "length": "short",
    "wordCount": 156,
    "createdAt": "2024-01-01T12:00:00Z"
  },
  "metadata": {
    "generationTime": 3245,
    "model": "gemini-pro",
    "safetyScore": 0.95,
    "language": "tr",
    "promptVersion": "1.0.0"
  }
}
```

### GET /api/health
Health check endpoint for monitoring.

**Response:**
```json
{
  "success": true,
  "checks": {
    "gemini": true,
    "supabase": true,
    "timestamp": "2024-01-01T12:00:00Z"
  },
  "status": "healthy"
}
```

### POST /api/test-token *(Development Only)*
Generates JWT tokens for testing.

**Request Body:**
```json
{
  "userId": "test-user-123",
  "email": "test@example.com"
}
```

## Environment Variables

```bash
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret
```

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Run tests
pnpm run test
```

## Usage Example

```bash
# 1. Get test token (development only)
curl -X POST http://localhost:3000/api/test-token \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "email": "test@example.com"}'

# 2. Generate story
curl -X POST http://localhost:3000/api/story \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "childName": "Ahmet",
    "age": 7,
    "theme": "adventure",
    "length": "short",
    "elements": ["köpek", "orman"],
    "token": "YOUR_JWT_TOKEN"
  }'

# 3. Check health
curl http://localhost:3000/api/health
```

## Error Responses

- `401 Unauthorized` - Missing or invalid JWT token
- `400 Bad Request` - Invalid request body or unsafe content
- `429 Too Many Requests` - Rate limit exceeded (10 stories/day)
- `500 Internal Server Error` - AI generation or database error 