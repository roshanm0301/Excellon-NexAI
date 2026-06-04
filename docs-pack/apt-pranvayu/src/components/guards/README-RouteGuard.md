# Route Guard for 401 Error Handling

## How it works (Simple & Clean)

### 1. **Route Guard Pattern**
- `AuthRouteGuard` wraps all authenticated routes
- Automatically handles 401 errors for any API call within those routes
- Shows a modal when 401 occurs

### 2. **When 401 happens:**
- API interceptor sets flag: `setUnauthorizedError(true)`
- Route guard detects the flag and shows modal
- User sees "Session Expired" modal with refresh button

### 3. **User clicks refresh:**
- Calls `refreshOidcSession()` from Redux
- Shows success/error notification
- Hides the modal

## Files:

1. **`AuthRouteGuard.tsx`** - The route guard component
2. **`Content.tsx`** - Wraps routes with the guard
3. **`api.ts`** - Simple flag system (unchanged)

## Benefits of Route Guard approach:

✅ **Clean separation** - 401 handling is separate from business logic  
✅ **Automatic coverage** - All authenticated routes are protected  
✅ **Standard pattern** - Route guards are a common React pattern  
✅ **Easy to understand** - Clear responsibility boundaries  
✅ **Maintainable** - All 401 logic in one place  

## Usage:
```tsx
<AuthRouteGuard>
  <YourRoutes />
</AuthRouteGuard>
```

That's it! The route guard handles everything automatically.
