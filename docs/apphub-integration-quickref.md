# AppHub Integration Quick Reference

## 🔐 Authentication Flow

```
User → Your App → AppHub Login → Callback → JWT Token → Session
```

## 📦 Essential Environment Variables

```env
APPHUB_URL=https://hub.example.com
APPHUB_CLIENT_ID=yourapp_client_abc123
APPHUB_CLIENT_SECRET=secret_live_xyz789
APPHUB_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----..."
WEBHOOK_SECRET=whsec_abc123
APP_SLUG=yourapp
```

---

## 🎫 JWT Token Claims

```json
{
  "sub": "user_abc123",           // User ID
  "email": "user@example.com",    // Email
  "entity_id": "entity_org123",   // Current entity
  "role": "admin",                // Entity role
  "permissions": ["res:action"],  // Granted permissions
  "scopes": { "app": {...} },     // Data scopes
  "licensed_apps": ["yourapp"]    // Licensed apps
}
```

---

## 👥 Entity Roles

| Role | Manage Entity | Manage Members | Sub-Entities | Delete |
|------|:-------------:|:--------------:|:------------:|:------:|
| **owner** | ✅ | ✅ | ✅ | ✅ |
| **admin** | ✅ | ✅ | ✅ | ❌ |
| **manager** | ❌ | ❌ | 👁️ Edit | ❌ |
| **member** | ❌ | ❌ | ❌ | ❌ |

---

## 🔒 Permission Check

```typescript
// Extract context from token
const ctx = await getTenantContext(req)

// Check permission
if (!ctx.permissions.includes('resource:action')) {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}
```

---

## 🎯 Scope Filters

### Scope Types

| Type | Use Case | Value |
|------|----------|-------|
| `full_access` | See all data | `null` |
| `customer` | Single customer | `{ customer_id: "..." }` |
| `customers` | Multiple | `{ customer_ids: [...] }` |
| `region` | Geographic | `{ region: "north" }` |

### Apply Scope Filter

```typescript
// ALWAYS filter by entity + scope
let where = { entityId: ctx.entityId }
where = applyScopeFilter(where, ctx.scope, {
  customer: 'customerId',
  region: 'region'
})
```

---

## 📡 Webhook Events

| Event | When |
|-------|------|
| `user.created` | New user in entity |
| `user.updated` | User data changed |
| `membership.updated` | Role/scope changed |
| `license.activated` | License started |
| `license.suspended` | License paused |

### Verify Signature

```typescript
const isValid = verifyWebhookSignature(
  payload,
  req.headers.get('X-AppHub-Signature'),
  WEBHOOK_SECRET
)
```

---

## ✅ Security Checklist

- [ ] HTTPS everywhere
- [ ] PKCE in auth flow
- [ ] Token signature verification
- [ ] License check on every request
- [ ] Entity filter on all queries
- [ ] Scope filter applied
- [ ] Permission checks before actions
- [ ] Webhook signature verification
- [ ] No tokens in logs
- [ ] Secrets in env vars

---

## 🚨 Common Mistakes

| ❌ Don't | ✅ Do |
|---------|------|
| Query without entity filter | Always include `entityId: ctx.entityId` |
| Skip scope filters | Apply `applyScopeFilter()` to all queries |
| Check permissions after action | Check before executing |
| Trust client-provided entity ID | Use entity ID from token |
| Log access tokens | Log only user ID, actions |

---

## 📋 Required Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/auth/callback/apphub` | OAuth callback |
| `/api/v1/scope-options/{type}` | Scope options (if using scopes) |
| `/api/webhooks/apphub` | Webhook receiver |

---

## 🔗 Quick Links

- Full Spec: `docs/apphub-app-integration-specification.md`
- Apps Spec: `apphub-apps-specification.md`
- Scope Spec: `apphub-scope-specification.md`

