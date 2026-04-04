# Services

API service layer for communicating with the Ascent Beacon backend.

## Architecture

Uses a **mixin-based composition** pattern for modular organization:

```
ApiServiceBase → authMethods → valuesMethods → prioritiesMethods → ...
```

## Files

| File               | Purpose                                                          |
| ------------------ | ---------------------------------------------------------------- |
| `api.js`           | Main entry point - exports composed `ApiService` singleton       |
| `apiBase.js`       | Base class with Axios instance, auth interceptors, token refresh |
| `apiAuth.js`       | Authentication methods (login, logout, token refresh)            |
| `apiValues.js`     | Values CRUD operations                                           |
| `apiPriorities.js` | Priorities CRUD operations                                       |
| `apiMixins.js`     | Assistant, recommendations, and discovery methods                |

## Usage

```javascript
import api from "../services/api";

// Auth
await api.requestLoginCode(email);
await api.verifyCode(email, code);
await api.logout();

// Values
const values = await api.getValues();
await api.createValue(valueData);
await api.updateValue(id, valueData);

// Priorities
const priorities = await api.getPriorities();
await api.createPriority(priorityData);
await api.updatePriority(id, priorityData);

// Assistant
await api.startSession(type);
await api.sendMessage(sessionId, message);
```

## Token Handling

- Access tokens stored in memory
- Refresh tokens stored in secure storage
- Auto-refresh on 401 responses via Axios interceptor
- Token expiry checked before requests

## Testing

Tests located in `__tests__/` directory. Run with:

```bash
npm test -- --testPathPattern=services
```
