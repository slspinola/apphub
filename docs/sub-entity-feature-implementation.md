# Sub-Entity Feature Implementation

## Overview

This document describes the completed implementation of the sub-entity feature for AppHub, which enables hierarchical organization management with proper CRUD operations and permission controls.

## Implementation Date

December 3, 2025

## Features Implemented

### 1. Server Actions

#### `updateEntity` (`src/features/entities/actions.ts`)

- **Purpose**: Update entity name and slug with permission validation
- **Permissions**:
  - System admins can update any entity
  - Entity owners and admins can update their entity
  - Managers can update sub-entities of their parent entity
- **Validation**:
  - Validates input using `UpdateEntitySchema`
  - Checks for slug uniqueness
  - Revalidates relevant paths after update
- **Returns**: Updated entity or error message

#### `deleteEntity` (`src/features/entities/actions.ts`)

- **Purpose**: Delete an entity with cascade protection
- **Permissions**:
  - Only system admins and entity owners can delete
  - Managers cannot delete entities
- **Validation**:
  - Prevents deletion if entity has children (sub-entities)
  - Provides clear error message with child count
- **Cascade**: Automatically removes memberships, invites, and licenses
- **Returns**: Success message or error

### 2. UI Components

#### `EntitySettingsForm` (`src/components/entities/entity-settings-form.tsx`)

- **Purpose**: Reusable form component for editing entity details
- **Features**:
  - React Hook Form with Zod validation
  - Real-time validation feedback
  - Disabled state during submission
  - Only enables save button when form is dirty (has changes)
  - Automatic redirect on slug change
  - Shows parent entity (read-only) for sub-entities
  - Displays entity statistics (members, children, dates)
- **Props**:
  - `entity`: Entity data with counts and parent
  - `isManagerAccess`: Boolean flag for manager access notice

#### `DeleteEntityDialog` (`src/components/entities/delete-entity-dialog.tsx`)

- **Purpose**: Confirmation dialog for entity deletion
- **Features**:
  - Alert dialog with destructive styling
  - Lists data that will be deleted
  - Disabled if entity has children
  - Shows warning about child entities
  - Automatic redirect after successful deletion
  - Loading state during deletion
- **Props**:
  - `entityId`: Entity to delete
  - `entityName`: Display name for confirmation
  - `childrenCount`: Number of sub-entities (disables if > 0)
  - `redirectTo`: URL to navigate to after deletion

### 3. Page Updates

#### Entity Settings Page (`src/app/(dashboard)/entity/[slug]/settings/page.tsx`)

**Before**: Static display of entity information

**After**: 
- Integrated `EntitySettingsForm` for editing
- Added `DeleteEntityDialog` in danger zone
- Manager access notice for sub-entity editing
- Conditional delete button (only for owners/system admins)
- Shows child count warning in danger zone

#### Sub-Entities Pages

**Updated Files**:
- `src/app/(dashboard)/entity/[slug]/sub-entities/page.tsx`
- `src/app/(dashboard)/entity/sub-entities/page.tsx`

**Changes**:
- Pass `parentEntityId` prop to `CreateEntityDialog`
- Set trigger text to "Create Sub-Entity"
- Ensures sub-entities are created with correct parent relationship

#### Entity Edit Page (`src/app/(dashboard)/entity/[slug]/edit/page.tsx`)

**Before**: Duplicate non-functional edit form

**After**: Simple redirect to settings page
- Consolidates all editing functionality in one place
- Prevents code duplication
- Maintains URL compatibility

## Permission Model

### Entity Operations

| Role | View | Edit | Create Sub | Delete |
|------|------|------|------------|--------|
| **System Admin** | ✅ All | ✅ All | ✅ All | ✅ All |
| **Owner** | ✅ Entity + Subs | ✅ Entity + Subs | ✅ Yes | ✅ Yes |
| **Admin** | ✅ Entity + Subs | ✅ Entity + Subs | ✅ Yes | ❌ No |
| **Manager** | ✅ Subs only | ✅ Subs only | ❌ No | ❌ No |
| **Member** | ✅ Entity only | ❌ No | ❌ No | ❌ No |

### Permission Logic

1. **Direct Membership**: User has membership on the entity itself
   - Owner/Admin: Full CRUD on entity and sub-entities
   - Manager: View only on this entity
   - Member: View only

2. **Parent Membership** (for sub-entities):
   - Owner/Admin of parent: Full CRUD on sub-entity
   - Manager of parent: View and edit sub-entity (no create/delete)

3. **System Admin**: Unrestricted access to all entities

## Data Flow

### Update Entity Flow

```
User submits form
    ↓
EntitySettingsForm validates input
    ↓
Calls updateEntity server action
    ↓
Server validates permissions
    ↓
Checks slug uniqueness
    ↓
Updates database
    ↓
Revalidates paths
    ↓
Redirects if slug changed
    ↓
Shows success toast
```

### Delete Entity Flow

```
User clicks delete button
    ↓
DeleteEntityDialog opens
    ↓
Shows confirmation with warnings
    ↓
User confirms deletion
    ↓
Calls deleteEntity server action
    ↓
Server validates permissions
    ↓
Checks for child entities
    ↓
Deletes entity (cascade)
    ↓
Revalidates paths
    ↓
Redirects to parent or entities list
    ↓
Shows success toast
```

### Create Sub-Entity Flow

```
User on sub-entities page
    ↓
Clicks "Create Sub-Entity"
    ↓
CreateEntityDialog opens with parentEntityId
    ↓
User fills form
    ↓
Calls createEntity with parentId
    ↓
Creates entity with parent relationship
    ↓
Refreshes page
    ↓
New sub-entity appears in list
```

## Technical Details

### Schema Validation

Uses existing Zod schemas from `src/features/entities/schemas.ts`:

```typescript
UpdateEntitySchema = {
  id: string (required)
  name: string (min 2 chars, optional)
  slug: string (lowercase, alphanumeric + hyphens, optional)
  parentId: string (nullable, optional)
}
```

### Database Operations

- **Update**: Uses Prisma `update` with conditional field updates
- **Delete**: Uses Prisma `delete` with automatic cascade via schema relations
- **Validation**: Queries for existing slugs and child counts before operations

### Error Handling

All server actions follow consistent error response pattern:

```typescript
type ActionResponse<T> = 
  | { success: true; data: T; message?: string }
  | { success: false; error: string }
```

Client components handle errors with toast notifications.

## Testing Checklist

- [x] System admin can update any entity
- [x] Owner can update and delete their entity
- [x] Admin can update but not delete entity
- [x] Manager can update sub-entities only
- [x] Member cannot edit anything
- [x] Slug uniqueness validation works
- [x] Cannot delete entity with children
- [x] Sub-entity creation includes parentId
- [x] Form validation provides clear feedback
- [x] Redirects work after slug change
- [x] Redirects work after deletion
- [x] Loading states prevent double submission
- [x] Edit page redirects to settings

## Files Modified

### New Files
1. `src/components/entities/entity-settings-form.tsx` - Form component
2. `src/components/entities/delete-entity-dialog.tsx` - Delete confirmation
3. `docs/designs/sub-entity-feature-implementation.md` - This document

### Modified Files
1. `src/features/entities/actions.ts` - Added updateEntity, deleteEntity
2. `src/app/(dashboard)/entity/[slug]/settings/page.tsx` - Integrated form and delete
3. `src/app/(dashboard)/entity/[slug]/sub-entities/page.tsx` - Fixed create flow
4. `src/app/(dashboard)/entity/sub-entities/page.tsx` - Fixed create flow
5. `src/app/(dashboard)/entity/[slug]/edit/page.tsx` - Redirect to settings

## Future Enhancements

Potential improvements for future iterations:

1. **Bulk Operations**: Delete multiple sub-entities at once
2. **Move Entity**: Change parent entity relationship
3. **Entity Templates**: Quick setup for common structures
4. **Audit Log**: Track all entity modifications
5. **Soft Delete**: Archive entities instead of permanent deletion
6. **Entity Import/Export**: Backup and restore entity hierarchies

## Related Documentation

- [Entity Management Menu Design](./entity-management-menu-design.md)
- [Entity Details Tabs Design](./entity-details-tabs-design.md)
- Database Schema: `prisma/schema.prisma` (Entity model)
- Type Definitions: `src/types/entities.ts`
- Authorization: `src/lib/authorization.ts`

