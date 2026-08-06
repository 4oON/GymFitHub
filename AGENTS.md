# Agent Guidelines for ZenFit

## iOS Compatibility Rules (MUST FOLLOW)

When implementing features that will be used in iOS apps (via WebView/Capacitor), you MUST follow these rules:

### 1. NEVER use browser-only APIs
- ❌ `alert()` - Blocked in iOS WebView
- ❌ `confirm()` - Blocked in iOS WebView  
- ❌ `prompt()` - Blocked in iOS WebView
- ✅ Use custom React modals/components instead

### 2. localStorage handling
- iOS private mode disables localStorage
- iOS WebView may have storage restrictions
- ✅ Always wrap localStorage in try-catch
- ✅ Use safeStorage wrapper pattern
```typescript
const safeStorage = {
    getItem(key: string): string | null {
        try { return localStorage.getItem(key); } catch { return null; }
    },
    setItem(key: string, value: string): boolean {
        try { localStorage.setItem(key, value); return true; } catch { return false; }
    }
};
```

### 3. Touch and Click Events
- ✅ Add `touchAction: 'manipulation'` CSS for buttons
- ✅ Add `active:scale-95` for touch feedback
- ✅ Ensure minimum 44px touch target size
- ❌ Don't rely on hover states (no hover on iOS)

### 4. Fetch/Network Requests
- ✅ Always use AbortController with timeout
- ✅ Add `mode: 'cors'` and `credentials: 'same-origin'`
- ✅ Handle "Network request failed" error specifically
- ✅ Add proper error messages for offline/network issues

### 5. Modal/Popup Behavior
- iOS handles modals differently than desktop
- ✅ Ensure modals are portal-based (outside parent stacking context)
- ✅ Add backdrop click to close
- ✅ Test on actual iOS device or simulator

### 6. Input Elements
- ✅ Always use proper input types (`type="email"`, `type="tel"`)
- ✅ Add `autoCapitalize`, `autoCorrect`, `spellCheck` attributes
- ✅ Test form submission with iOS keyboard

### 7. Viewport and Scrolling
- ✅ Use `-webkit-overflow-scrolling: touch` for smooth scrolling
- ✅ Test with iOS safe areas (notch, home indicator)

### 8. Testing Checklist
Before marking feature complete, verify:
- [ ] Works in iOS Safari
- [ ] Works in iOS WebView (WKWebView)
- [ ] Touch targets are responsive
- [ ] No browser-only APIs used
- [ ] localStorage has fallbacks
- [ ] Network errors are handled gracefully

## Backend API Guidelines

- All AI calls MUST go through backend proxy (`/api/ai/*`)
- Never call AI APIs directly from frontend (CORS issues)
- API Keys stored in database, never exposed to client

## Database Security

- Enable RLS on all tables
- Use policies to restrict user data access
- Test with Security Advisor after schema changes
