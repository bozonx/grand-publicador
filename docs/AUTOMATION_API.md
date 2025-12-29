# Automation API Documentation

## Overview
The Automation API is designed for scheduled publishing workflows. It allows automation systems to:
1. Query for posts ready to be published
2. Claim posts atomically to prevent race conditions
3. Update post status after publishing

All endpoints require API key authentication.

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

### Get Pending Posts
Retrieve posts that are scheduled and ready to be published.

**Endpoint:** `GET /api/automation/v1/posts/pending?limit=10`

**Query Parameters:**
- `limit` (optional): Maximum number of posts to return. Default: 10

**Response:**
```json
[
  {
    "id": "post-uuid",
    "publicationId": "publication-uuid",
    "channelId": "channel-uuid",
    "authorId": "user-uuid",
    "content": "Post content",
    "socialMedia": "TELEGRAM",
    "postType": "POST",
    "title": "Post title",
    "description": null,
    "authorComment": null,
    "tags": "tag1,tag2",
    "mediaFiles": "[\"url1.jpg\"]",
    "postDate": null,
    "status": "SCHEDULED",
    "scheduledAt": "2025-12-29T10:00:00.000Z",
    "publishedAt": null,
    "meta": "{}",
    "createdAt": "2025-12-28T10:00:00.000Z",
    "updatedAt": "2025-12-28T10:00:00.000Z",
    "channel": {
      "id": "channel-uuid",
      "projectId": "project-uuid",
      "socialMedia": "TELEGRAM",
      "name": "My Channel",
      "channelIdentifier": "@mychannel",
      "credentials": "{}",
      "isActive": true,
      "createdAt": "2025-12-01T10:00:00.000Z",
      "updatedAt": "2025-12-01T10:00:00.000Z"
    },
    "publication": {
      "id": "publication-uuid",
      "projectId": "project-uuid",
      "authorId": "user-uuid",
      "title": "Publication title",
      "content": "Publication content",
      "mediaFiles": "[\"url1.jpg\"]",
      "tags": "tag1,tag2",
      "status": "SCHEDULED",
      "meta": "{}",
      "createdAt": "2025-12-28T10:00:00.000Z",
      "updatedAt": "2025-12-28T10:00:00.000Z"
    },
    "author": {
      "id": "user-uuid",
      "fullName": "John Doe",
      "username": "johndoe"
    }
  }
]
```

**Notes:**
- Only returns posts with `status = SCHEDULED` and `scheduledAt <= now`
- Posts are ordered by `scheduledAt` (oldest first)

### Claim Post
Atomically claim a post for publishing to prevent race conditions.

**Endpoint:** `POST /api/automation/v1/posts/:id/claim`

**URL Parameters:**
- `id`: UUID of the post

**Response:**
```json
{
  "id": "post-uuid",
  "publicationId": "publication-uuid",
  "channelId": "channel-uuid",
  "content": "Post content",
  "status": "SCHEDULED",
  "meta": "{\"processing\":true,\"claimedAt\":\"2025-12-29T10:05:00.000Z\"}",
  "channel": { ... },
  "publication": { ... },
  ...
}
```

**Notes:**
- Sets `meta.processing = true` to indicate the post is being processed
- Adds `meta.claimedAt` timestamp
- Returns error if post is already being processed
- Returns error if post status is not `SCHEDULED`

**Error Responses:**
```json
{
  "message": "Post is already being processed"
}
```

### Update Post Status
Update the status of a post after publishing attempt.

**Endpoint:** `PATCH /api/automation/v1/posts/:id/status`

**URL Parameters:**
- `id`: UUID of the post

**Request Body:**
```json
{
  "status": "PUBLISHED",
  "error": "Optional error message if failed"
}
```

**Fields:**
- `status` (required): One of: `DRAFT`, `SCHEDULED`, `PUBLISHED`, `FAILED`
- `error` (optional): Error message if status is `FAILED`

**Response:**
```json
{
  "id": "post-uuid",
  "status": "PUBLISHED",
  "publishedAt": "2025-12-29T10:10:00.000Z",
  "meta": "{\"updatedAt\":\"2025-12-29T10:10:00.000Z\"}",
  ...
}
```

**Notes:**
- Removes `meta.processing` flag
- Sets `publishedAt` timestamp if status is `PUBLISHED`
- Stores error message in `meta.lastError` if provided

## Workflow Example

### n8n Scheduled Publishing Workflow

```
┌─────────────────┐
│  Cron Trigger   │ Every 5 minutes
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Get Pending    │ GET /api/automation/v1/posts/pending?limit=5
│     Posts       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Loop Over      │ For each post
│     Posts       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Claim Post     │ POST /api/automation/v1/posts/:id/claim
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Publish to     │ Call your publishing microservice
│  Social Media   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Update Status  │ PATCH /api/automation/v1/posts/:id/status
│                 │ { "status": "PUBLISHED" } or { "status": "FAILED", "error": "..." }
└─────────────────┘
```

### Step 1: Get Pending Posts
```
HTTP Request Node:
- Method: GET
- URL: https://your-domain.com/api/automation/v1/posts/pending?limit=5
- Headers:
  - X-API-Key: {{ $env.GRAND_PUBLICADOR_API_KEY }}
```

### Step 2: Loop Over Posts
```
Loop Over Items Node:
- Input: {{ $json }}
```

### Step 3: Claim Post
```
HTTP Request Node:
- Method: POST
- URL: https://your-domain.com/api/automation/v1/posts/{{ $json.id }}/claim
- Headers:
  - X-API-Key: {{ $env.GRAND_PUBLICADOR_API_KEY }}
```

### Step 4: Publish to Social Media
```
HTTP Request Node (to your publishing microservice):
- Method: POST
- URL: https://your-publishing-service.com/publish
- Body:
  {
    "platform": "{{ $json.channel.socialMedia }}",
    "channelId": "{{ $json.channel.channelIdentifier }}",
    "content": "{{ $json.content }}",
    "mediaFiles": {{ JSON.parse($json.mediaFiles) }},
    "credentials": {{ JSON.parse($json.channel.credentials) }}
  }
```

### Step 5: Update Status (Success)
```
HTTP Request Node:
- Method: PATCH
- URL: https://your-domain.com/api/automation/v1/posts/{{ $json.id }}/status
- Headers:
  - X-API-Key: {{ $env.GRAND_PUBLICADOR_API_KEY }}
- Body:
  {
    "status": "PUBLISHED"
  }
```

### Step 5b: Update Status (Error)
```
HTTP Request Node (in error handler):
- Method: PATCH
- URL: https://your-domain.com/api/automation/v1/posts/{{ $json.id }}/status
- Headers:
  - X-API-Key: {{ $env.GRAND_PUBLICADOR_API_KEY }}
- Body:
  {
    "status": "FAILED",
    "error": "{{ $json.error }}"
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
  "message": "Post not found"
}
```

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Post is not scheduled"
}
```

## Best Practices

1. **Claim Before Publishing**: Always claim a post before attempting to publish it
2. **Update Status**: Always update the status after publishing (success or failure)
3. **Error Handling**: Include error messages when updating to FAILED status
4. **Batch Size**: Use reasonable `limit` values (5-10) to avoid overwhelming your system
5. **Retry Logic**: Implement retry logic for failed posts with exponential backoff
6. **Monitoring**: Monitor the `meta.lastError` field for recurring issues

## Security Notes
1. Keep your API key secret
2. Use HTTPS in production
3. Rotate API keys regularly
4. Monitor API usage for suspicious activity
