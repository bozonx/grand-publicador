# Archive API Documentation

## Overview

The Archive API provides endpoints for managing archived entities (Projects, Channels, Publications, Posts) with support for virtual cascading archiving, restoration, permanent deletion, and entity movement.

## Base URL

```
/archive
```

## Authentication

All endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

## Entity Types

- `project` - Projects
- `channel` - Channels  
- `publication` - Publications
- `post` - Posts

## Endpoints

### Archive Entity

Archive a specific entity.

**Endpoint:** `POST /archive/:type/:id`

**Parameters:**
- `type` (path) - Entity type (`project`, `channel`, `publication`, `post`)
- `id` (path) - Entity ID

**Request Body:** None

**Response:** `200 OK`
```json
{
  "message": "Entity archived successfully"
}
```

**Virtual Cascading:**
- Archiving a Project automatically hides all its Channels and Posts
- Archiving a Channel automatically hides all its Posts
- No physical updates to child records

**Example:**
```bash
curl -X POST http://localhost:3001/archive/project/abc123 \
  -H "Authorization: Bearer <token>"
```

---

### Restore Entity

Restore an archived entity.

**Endpoint:** `POST /archive/:type/:id/restore`

**Parameters:**
- `type` (path) - Entity type
- `id` (path) - Entity ID

**Response:** `200 OK`
```json
{
  "message": "Entity restored successfully"
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/archive/project/abc123/restore \
  -H "Authorization: Bearer <token>"
```

---

### Delete Permanently

Permanently delete an archived entity from the database.

**Endpoint:** `DELETE /archive/:type/:id`

**Parameters:**
- `type` (path) - Entity type
- `id` (path) - Entity ID

**Response:** `200 OK`
```json
{
  "message": "Entity deleted permanently"
}
```

**Warning:** This action is irreversible. The entity must be archived before permanent deletion.

**Example:**
```bash
curl -X DELETE http://localhost:3001/archive/project/abc123 \
  -H "Authorization: Bearer <token>"
```

---

### Move Entity

Move an entity to a different parent.

**Endpoint:** `POST /archive/:type/:id/move`

**Parameters:**
- `type` (path) - Entity type (`channel`, `publication`, `post`)
- `id` (path) - Entity ID

**Request Body:**
```json
{
  "targetParentId": "new-parent-id"
}
```

**Response:** `200 OK`
```json
{
  "message": "Entity moved successfully"
}
```

**Move Rules:**
- Channels can be moved to different Projects
- Publications can be moved to different Projects
- Posts can be moved to different Channels or Publications

**Example:**
```bash
curl -X POST http://localhost:3001/archive/channel/abc123/move \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"targetParentId": "project-xyz"}'
```

---

### Get Archive Statistics

Get statistics about archived entities.

**Endpoint:** `GET /archive/stats`

**Response:** `200 OK`
```json
{
  "projects": 5,
  "channels": 12,
  "publications": 3,
  "posts": 45,
  "total": 65
}
```

**Example:**
```bash
curl http://localhost:3001/archive/stats \
  -H "Authorization: Bearer <token>"
```

---

### List Archived Entities

Get a list of archived entities by type.

**Endpoint:** `GET /archive/:type`

**Parameters:**
- `type` (path) - Entity type

**Response:** `200 OK`
```json
[
  {
    "id": "abc123",
    "name": "Archived Project",
    "archivedAt": "2024-01-15T10:30:00Z",
    "archivedBy": "user-id",
    ...
  }
]
```

**Example:**
```bash
curl http://localhost:3001/archive/project \
  -H "Authorization: Bearer <token>"
```

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Entity is already archived",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Entity not found",
  "error": "Not Found"
}
```

## Virtual Cascading

The archive system implements **virtual cascading**, meaning:

1. **Archiving a parent** (e.g., Project) does NOT physically update child records
2. **Children are hidden** through query filters that check parent archive status
3. **Restoration is instant** - no need to update thousands of child records
4. **Performance benefit** - minimal database writes

### Example: Virtual Cascading Logic

When querying Posts:
```typescript
// Post is considered archived if:
// - post.archivedAt is set, OR
// - post.channel.archivedAt is set, OR  
// - post.channel.project.archivedAt is set

const posts = await prisma.post.findMany({
  where: {
    archivedAt: null,
    channel: {
      archivedAt: null,
      project: {
        archivedAt: null
      }
    }
  }
});
```

## Access Control

- **Archive/Restore**: Requires project ownership or admin role
- **Permanent Delete**: Requires project ownership
- **Move**: Requires edit permissions on both source and target

## Best Practices

1. **Always archive before deleting** - Permanent deletion cannot be undone
2. **Use archive for soft delete** - Allows recovery if needed
3. **Check archive stats** - Monitor archived content growth
4. **Move carefully** - Ensure target parent exists and user has access
5. **Batch operations not supported** - All operations are single-entity only

## Related Documentation

- [Main API Documentation](./api-external.md)
- [Authentication Guide](../README.md#authentication)
- [Database Schema](../prisma/schema.prisma)
