# EventCata Firestore Schema v1

## Collections

### `users/{uid}`
- `displayName`: string
- `username`: string (unique, lowercase)
- `photoURL`: string
- `bio`: string
- `location`: string
- `role`: `"user" | "admin" | "moderator"`
- `privateProfile`: boolean
- `createdAt`: timestamp
- `updatedAt`: timestamp

### `events/{eventId}`
- `ownerId`: uid
- `title`: string
- `description`: string
- `eventType`: `"hosted" | "interested"`
- `visibility`: `"public" | "followers" | "private"`
- `locationText`: string
- `geo`: `{ lat: number, lon: number, source: string, updatedAt: timestamp }`
- `startAt`: timestamp
- `endAt`: timestamp
- `timezone`: string
- `tags`: string[]
- `mediaCount`: number
- `ticketing`: `{ enabled: boolean, price: number, currency: string }`
- `metrics`: `{ likes: number, comments: number, shares: number, views: number, trendScore: number }`
- `createdAt`: timestamp
- `updatedAt`: timestamp

### `events/{eventId}/posts/{postId}`
- `authorId`: uid
- `kind`: `"chat" | "comment" | "media" | "reaction"`
- `text`: string
- `mediaUrl`: string
- `mediaType`: string
- `reaction`: string
- `createdAt`: timestamp
- `updatedAt`: timestamp
- `moderation`: `{ status: "active" | "flagged" | "removed", reason: string }`

### `events/{eventId}/attendees/{uid}`
- `status`: `"going" | "interested" | "not_going"`
- `updatedAt`: timestamp

### `events/{eventId}/tickets/{ticketId}`
- `buyerId`: uid
- `buyerName`: string
- `buyerEmail`: string
- `qty`: number
- `unitPrice`: number
- `totalPrice`: number
- `currency`: string
- `status`: `"pending" | "paid" | "refunded"`
- `createdAt`: timestamp

### `follows/{uid}/following/{targetUid}`
- `createdAt`: timestamp

### `feeds/{uid}/items/{itemId}`
- `type`: `"event_created" | "event_updated" | "post_created" | "ticket_purchased"`
- `actorId`: uid
- `eventId`: string
- `postId`: string
- `createdAt`: timestamp

## Migration Strategy (IndexedDB -> Firestore)

1. **Read local IndexedDB `events` store** in batches of 50.
2. **Map legacy shape** to `events/{eventId}`:
   - `name -> title`
   - `date/startTime/endTime -> startAt/endAt`
   - `location -> locationText`
   - existing `geo` reused if present.
3. **Write with idempotency**:
   - deterministic `eventId` based on existing local id.
   - upsert by id.
4. **Media migration**:
   - upload local blobs to Storage under `events/{eventId}/media/...`.
   - update `mediaCount` and post media refs.
5. **Ticket/order migration**:
   - map local `ticketOrders` into `events/{eventId}/tickets/{ticketId}`.
6. **Audit trail**:
   - persist migration status in `users/{uid}.migration`.
7. **Cutover**:
   - read Firestore first, fallback to local for non-migrated users.
