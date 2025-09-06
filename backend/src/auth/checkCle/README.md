# CheckCle Authentication Service

This module provides complete authentication and API interaction with the CheckCle API.

## Features

- ✅ Authenticates with CheckCle API using credentials from environment variables
- ✅ Decodes JWT tokens to extract expiration information
- ✅ Persists tokens in the database with expiration timestamps
- ✅ Automatically returns valid tokens, refreshing when necessary
- ✅ **Generic API call layer** - abstracts all CheckCle API calls
- ✅ **Automatic token refresh** - handles 401 errors automatically
- ✅ **Complete logging** for debugging and monitoring

## Environment Variables

Make sure to set these environment variables in your `.env` file:

```env
CHECKCLE_URL=https://your-checkcle-api-url.com
CHECKCLE_USER=your-checkcle-username
CHECKCLE_PASS=your-checkcle-password
```

## Usage

### 1. Generic API Calls (Recommended)

```typescript
import { CheckcleAuthService } from './auth/checkCle';

@Injectable()
export class YourService {
  constructor(private readonly checkcleAuthService: CheckcleAuthService) {}

  // GET requests
  async getServices() {
    return await this.checkcleAuthService.callCheckCle('/collections/services/records');
  }

  async getAlerts() {
    return await this.checkcleAuthService.callCheckCle('/collections/alerts/records');
  }

  // POST requests
  async createService(serviceData: any) {
    return await this.checkcleAuthService.callCheckCle('/collections/services/records', 'POST', serviceData);
  }

  // PUT requests
  async updateService(id: string, serviceData: any) {
    return await this.checkcleAuthService.callCheckCle(`/collections/services/records/${id}`, 'PUT', serviceData);
  }

  // DELETE requests
  async deleteService(id: string) {
    return await this.checkcleAuthService.callCheckCle(`/collections/services/records/${id}`, 'DELETE');
  }
}
```

### 2. Token Management (Advanced)

```typescript
@Injectable()
export class YourService {
  constructor(private readonly checkcleAuthService: CheckcleAuthService) {}

  async getTokenInfo() {
    // Get token with expiration info
    const tokenInfo = await this.checkcleAuthService.getTokenWithExpiry();
    console.log(`Token expires at: ${tokenInfo.expiry.toUTCString()}`);
    return tokenInfo.token;
  }

  async forceLogin() {
    // Force a new login (useful for testing)
    await this.checkcleAuthService.login();
  }
}
```

## HTTP Endpoints

### Authentication Endpoints

```bash
# Force a new login
POST /checkcle-auth/login

# Get token info with expiration
GET /checkcle-auth/token
```

**Response example:**
```json
{
  "message": "Token retrieved successfully",
  "tokenExists": true,
  "tokenLength": 234,
  "expiresAt": "2025-09-07T10:30:00.000Z",
  "expiresAtUTC": "Thu, 07 Sep 2025 10:30:00 GMT"
}
```

### Proxy Endpoints for CheckCle API

```bash
# GET requests
GET /checkcle-auth/call/collections/services/records
GET /checkcle-auth/call/collections/alerts/records?filter=status='active'

# POST requests
POST /checkcle-auth/call/collections/services/records
Content-Type: application/json
{
  "name": "My Service",
  "url": "https://example.com"
}
```

## API Methods

### `callCheckCle(endpoint: string, method = 'GET', body = null): Promise<any>`
- **Main method** for all CheckCle API interactions
- Automatically handles authentication
- Handles 401 errors by refreshing tokens
- Supports GET, POST, PUT, DELETE methods
- Returns parsed JSON response

### `getTokenWithExpiry(): Promise<{ token: string; expiry: Date }>`
- Returns current valid token with expiration info
- Automatically refreshes if expired

### `getValidToken(): Promise<string>`
- Returns just the token string
- Automatically refreshes if expired

### `login(): Promise<void>`
- Forces a new login to CheckCle API
- Persists the new token to database

## Automatic Features

### Token Refresh
The service automatically handles expired tokens:
1. Makes API call with current token
2. If receives 401 Unauthorized, automatically logs in again
3. Retries the original request with new token
4. All this happens transparently

### Logging
```
[CheckcleAuthService] Using cached Checkcle token (expires at Thu, 07 Sep 2025 10:30:00 GMT)
[CheckcleAuthService] CheckCle API call successful: GET /collections/services/records
[CheckcleAuthService] CheckCle API returned 401. Refreshing token and retrying...
[CheckcleAuthService] New Checkcle token stored. Expires at: Thu, 07 Sep 2025 12:30:00 GMT
[CheckcleAuthService] CheckCle API call successful after token refresh: GET /collections/services/records
```

## Example Integration

```typescript
// services/my-business-service.ts
@Injectable()
export class MyBusinessService {
  constructor(private readonly checkcleAuthService: CheckcleAuthService) {}

  async getAllServices() {
    // This call is completely abstracted - no auth logic needed
    const services = await this.checkcleAuthService.callCheckCle('/collections/services/records');
    return services;
  }

  async createAlert(alertData: any) {
    // Automatic authentication and error handling
    const newAlert = await this.checkcleAuthService.callCheckCle('/collections/alerts/records', 'POST', alertData);
    return newAlert;
  }
}
```

The service is production-ready and handles all authentication complexity automatically!

## Database Model

The service uses the `CheckcleToken` model with the following fields:

- `id`: Auto-incrementing primary key
- `token`: The JWT token string
- `expiry`: Token expiration timestamp
- `createdAt`: When the token was stored
- `updatedAt`: When the token was last updated

## Logging

The service logs successful token storage with expiration information:

```
New Checkcle token stored. Expires at: Thu, 07 Sep 2025 10:30:00 GMT
```
