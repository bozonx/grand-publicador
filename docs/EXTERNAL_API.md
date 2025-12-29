# External API Documentation

## Overview
The External API allows external systems (like n8n workflows) to create publications and schedule posts. All endpoints require API key authentication.

## Authentication
Include your API key in one of the following ways:

### Option 1: X-API-Key Header
```bash
curl -H "X-API-Key: your_api_key_here" ...
```

### Option 2: Authorization Bearer Token
```bash
curl -H "Authorization: Bearer your_api_key_here" ...
```

## Endpoints

### Create Publication
Create a new publication in a project.

**Endpoint:** `POST /api/external/v1/publications`

**Request Body:**
```json
{
  "projectId": "uuid-of-project",
  "title": "Optional title",
  "content": "Main content of the publication",
  "mediaFiles": ["url1.jpg", "url2.png"],
  "tags": "tag1,tag2,tag3",
  "status": "DRAFT"
}
```

**Fields:**
- `projectId` (required): UUID of the project
- `title` (optional): Publication title
- `content` (required): Main content
- `mediaFiles` (optional): Array of media file URLs
- `tags` (optional): Comma-separated tags
- `status` (optional): One of: `DRAFT`, `SCHEDULED`, `PUBLISHED`, `FAILED`. Default: `DRAFT`

**Response:**
```json
{
  "id": "publication-uuid",
  "projectId": "project-uuid",
  "authorId": null,
  "title": "Optional title",
  "content": "Main content",
  "mediaFiles": "[\"url1.jpg\",\"url2.png\"]",
  "tags": "tag1,tag2,tag3",
  "status": "DRAFT",
  "meta": "{}",
  "createdAt": "2025-12-29T10:00:00.000Z",
  "updatedAt": "2025-12-29T10:00:00.000Z"
}
```

### Schedule Publication
Create posts from a publication and schedule them to specific channels.

**Endpoint:** `POST /api/external/v1/publications/:id/schedule`

**URL Parameters:**
- `id`: UUID of the publication

**Request Body:**
```json
{
  "channelIds": ["channel-uuid-1", "channel-uuid-2"],
  "scheduledAt": "2025-12-30T15:00:00.000Z"
}
```

**Fields:**
- `channelIds` (required): Array of channel UUIDs
- `scheduledAt` (optional): ISO 8601 datetime. If not provided, posts will be created as DRAFT

**Response:**
```json
[
  {
    "id": "post-uuid-1",
    "publicationId": "publication-uuid",
    "channelId": "channel-uuid-1",
    "content": "Main content",
    "status": "SCHEDULED",
    "scheduledAt": "2025-12-30T15:00:00.000Z",
    ...
  },
  {
    "id": "post-uuid-2",
    "publicationId": "publication-uuid",
    "channelId": "channel-uuid-2",
    "content": "Main content",
    "status": "SCHEDULED",
    "scheduledAt": "2025-12-30T15:00:00.000Z",
    ...
  }
]
```

## Example: n8n Workflow

### Step 1: Create Publication
```
HTTP Request Node:
- Method: POST
- URL: https://your-domain.com/api/external/v1/publications
- Headers:
  - X-API-Key: {{ $env.GRAND_PUBLICADOR_API_KEY }}
  - Content-Type: application/json
- Body:
  {
    "projectId": "{{ $json.projectId }}",
    "title": "{{ $json.title }}",
    "content": "{{ $json.content }}",
    "mediaFiles": {{ $json.mediaFiles }},
    "tags": "{{ $json.tags }}"
  }
```

### Step 2: Schedule to Channels
```
HTTP Request Node:
- Method: POST
- URL: https://your-domain.com/api/external/v1/publications/{{ $json.id }}/schedule
- Headers:
  - X-API-Key: {{ $env.GRAND_PUBLICADOR_API_KEY }}
  - Content-Type: application/json
- Body:
  {
    "channelIds": {{ $json.channelIds }},
    "scheduledAt": "{{ $json.scheduledAt }}"
  }
```

## Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid API key"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Publication not found"
}
```

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [...]
}
```

## Rate Limiting
Currently no rate limiting is implemented, but it's recommended to implement it in production.

## Security Notes
1. Keep your API key secret
2. Use HTTPS in production
3. Rotate API keys regularly
4. Monitor API usage for suspicious activity
