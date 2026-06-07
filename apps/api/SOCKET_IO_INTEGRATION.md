# Socket.io Integration Guide for ComfyTag API

## Overview

Socket.io is now integrated for real-time notifications. The `io` instance is available on the Express app via `req.app.locals.io`.

## How to Use in Controllers

### 1. Creating a Notification with Socket.io Emission

When you create a notification in any controller, pass the `io` instance:

```javascript
import { createNotification } from './notification.js'

export const someControllerFunction = async (req, res, next) => {
  try {
    // ... your logic ...

    // Create notification with Socket.io emission
    const io = req.app.locals.io
    await createNotification({
      userId: user._id,
      type: 'ticket_confirmed',
      title: 'Your ticket is confirmed',
      message: 'Your ticket to the event is ready',
      data: { ticketId: ticket._id, eventId: event._id },
      io, // Pass io instance
    })

    // ... continue with response ...
  } catch (err) {
    next(err)
  }
}
```

### 2. Manually Emitting Events

If you need to emit custom events, use the utility functions:

```javascript
import {
  emitNotification,
  emitUnreadCountUpdate,
  emitNotificationRead,
  emitAllNotificationsRead,
} from '../socket/index.js'

const io = req.app.locals.io

// Emit a new notification
emitNotification(io, userId, {
  _id: notificationId,
  type: 'custom_event',
  title: 'Title',
  message: 'Message',
  data: {},
  read: false,
  createdAt: new Date(),
})

// Update unread count
emitUnreadCountUpdate(io, userId, 5)

// Emit notification read event
emitNotificationRead(io, userId, notificationId)

// Emit all read event
emitAllNotificationsRead(io, userId)
```

## Socket.io Events Reference

### Server → Client Events

| Event | Data | Purpose |
|-------|------|---------|
| `connected` | `{message, userId, socketId}` | Confirmation of connection |
| `notification:received` | `{...notification, receivedAt}` | New notification received |
| `notification:read` | `{notificationId, read, readAt}` | Single notification marked as read |
| `notification:readAll` | `{readAt}` | All notifications marked as read |
| `unreadCount:update` | `{unreadCount, updatedAt}` | Unread count updated |
| `notification:updated` | `{notificationId, read}` | Generic notification update |
| `allNotifications:read` | - | Triggered from client `notification:readAll` |

### Client → Server Events

| Event | Data | Purpose |
|-------|------|---------|
| `notification:read` | `{notificationId}` | User marks notification as read |
| `notification:readAll` | - | User marks all notifications as read |
| `disconnect` | - | User disconnects |
| `error` | `{error}` | Connection error |

## Controllers That Need Socket.io Integration

The following controllers create notifications and should emit Socket.io events:

1. **audience.js** (Ticket confirmation)
   - When: Ticket purchase completed
   - Event: `ticket_confirmed`

2. **transfer.js** (Ticket transfers)
   - When: Transfer initiated, accepted, declined
   - Events: `transfer_received`, `transfer_accepted`, `transfer_declined`

3. **auth.js** (Welcome series, KYC)
   - When: KYC approved/rejected
   - Events: `kyc_approved`, `kyc_rejected`

4. **bank.js** (Payout notifications)
   - When: Payout approved/rejected
   - Events: `payout_approved`, `payout_rejected`

5. **event.js** (Event reminders, alerts)
   - When: New event from follower
   - Event: `new_event_from_following`

6. **notification.js** (Marking as read/unread)
   - Already updated with Socket.io emissions

## Error Handling

Socket.io emissions are **non-blocking**. If the Socket.io server is down or the user is offline, the REST API still works:

```javascript
const io = req.app.locals.io

// Safe to call even if io is undefined
if (io) {
  emitNotification(io, userId, notification)
}

// Your controller continues normally
res.status(200).json(response)
```

## Testing Socket.io Integration

### Manual Testing

1. Start the API server:
   ```bash
   cd apps/api && npm run dev
   ```

2. Open two browser windows connected to the partner/web app

3. Create a notification (e.g., purchase ticket)

4. Verify:
   - Real-time notification appears in navbar badge
   - Unread count updates in real-time
   - Mark as read triggers Socket.io event

### Debugging

Enable Socket.io debug logging:

```bash
# In your terminal
DEBUG=socket.io* npm run dev
```

Check browser console:
- Open DevTools → Network → WS tab
- Look for Socket.io connection (`socket.io/?EIO=...`)
- Monitor message frames

## Future Enhancements

- [ ] Redis adapter for multi-server deployments
- [ ] Message acknowledgments (ensure client received event)
- [ ] Event replay on reconnection (for missed events)
- [ ] Typing indicators (real-time collaboration)
- [ ] Presence tracking (who's online)

## References

- Socket.io Docs: https://socket.io/docs/v4/
- Event Names: See `apps/api/socket/index.js` for all event definitions
- Notification Types: See `packages/types/src/index.ts` for enum
