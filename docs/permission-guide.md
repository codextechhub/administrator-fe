# Frontend Permission Guide

This document explains how the Frontend Layout Security (FLS) system works in school-fe. Any developer adding new menu items or action buttons must follow this guide. If the permission system changes, update this file at the same time.

---

## Overview

Permissions come from the backend at login. The backend uses a role-based access control (RBAC) system where each user is assigned a role, and each role has a set of permission keys. The frontend receives these keys in the login response and stores them in Redux (persisted via `redux-persist` so they survive page refresh).

**Permission key format: `module.resource.action`**

Examples:
- `school.students.view`
- `school.students.create`
- `school.branches.view`
- `academics.session.view`

The backend is the source of truth. Always verify a permission key exists in the backend registry before using it on the frontend.

---

## Permission Registry

All backend permission keys live in **one file only**: `src/permissions/index.ts`.

Nowhere else in the codebase should reference a raw `"school.x.y"` or `"academics.x.y"` string. Everything uses the opaque numeric codes exported as `P.*` constants.

```ts
import { P } from "@/permissions";

// Names describe UI capabilities — never use raw strings or codes directly
P.BROWSE_STUDENTS        // "100301"  →  "school.students.view" internally
P.ENROLL_STUDENT         // "100302"  →  "school.students.create"
P.VIEW_STUDENT_SENSITIVE // "100339"  →  "school.students.view_sensitive"
P.BROWSE_SESSIONS        // "300101"  →  "academics.session.view"
```

The `P` object is a flat map of UI-intent names to opaque numeric codes. Names describe what the user is doing in the UI — not the backend key structure. A reader of any file outside `src/permissions/index.ts` cannot infer the backend key format from the constant name alone.

To add a new permission: pick the next code in the correct range, add it to `REGISTRY` and `P` with a UI-intent name, then use `P.YOUR_CONSTANT` everywhere.

**Code format: `MM RR AA`**

| Digits | Meaning | Examples |
|--------|---------|---------|
| MM | Module | 10=school, 30=academics |
| RR | Resource within module | see the module tables below |
| AA | Action | 01=view, 02=create, 03=update, 04=delete, 08=manage, 09=suspend, 10=reactivate, 11=assign, 39=view_sensitive |

---

## How Permissions Flow

```
Login response
  └── data.permissions: string[]        ← flat array of permitted keys
        └── stored in Redux auth slice   ← persisted to localStorage
              └── rehydrated on refresh  ← PersistGate blocks render until done
```

**Key files:**
| File | Role |
|------|------|
| `src/redux/features/auth/auth-slice.ts` | Stores and exposes `permissions[]` |
| `src/redux/store.ts` | Persists `auth` slice (including permissions) |
| `src/hooks/use-permissions.ts` | Hook for checking permissions in components |
| `src/components/custom/permission-gate.tsx` | UI-level guard |
| `src/components/app-sidebar.tsx` | Sidebar filtering |

---

## The Two Enforcement Points (frontend)

> **By design, school-fe has NO route-level permission guards.** Enforcement is
> page-level (sidebar filtering + `PermissionGate`) with the **backend as the
> authoritative check** — every protected API call is validated server-side and
> returns 403 if the caller lacks the key. The frontend gates only shape the UI;
> they never protect data on their own.

### 1. Sidebar — hide menu items the user cannot access

Each nav item in `app-sidebar.tsx` has an optional `permission` field. Items are filtered before render; a group is hidden when all its items are filtered out.

```ts
{
  title: "Students",
  url: routesPath.PROTECTED.STUDENTS.INDEX,
  icon: StudentsIcon,
  permission: P.BROWSE_STUDENTS,
  permissionMode: "any",
}

// Multiple permissions — any one grants visibility
{
  title: "Academics",
  permission: [P.BROWSE_SESSIONS, P.BROWSE_CALENDAR, P.BROWSE_CLASSES],
  permissionMode: "any",   // visible if any key is present
}

// Multiple permissions — must have all
{
  title: "Roles",
  permission: [P.VIEW_ROLES, P.ASSIGN_ROLE],
  permissionMode: "all",   // visible only if both keys are present
}

// Always visible (no permission required)
{
  title: "Overview",
  permission: null,
}
```

> **Sidebar alone is not enough.** A user can type the URL directly. The page
> still renders, but every API call it makes is checked server-side, so no
> protected data is exposed. Guard sensitive affordances inside the page with
> `PermissionGate` (below), and rely on the backend 403 as the real boundary.

---

### 2. `PermissionGate` — hide or replace UI elements inside a page

Use this for buttons, sections, or any element inside a page the user can already visit.

```tsx
import PermissionGate from "@/components/custom/permission-gate";
import { P } from "@/permissions";

// Hide entirely when permission is missing
<PermissionGate permission={P.ENROLL_STUDENT}>
  <Button>Enroll Student</Button>
</PermissionGate>

// Show a fallback instead
<PermissionGate
  permission={P.MODIFY_STUDENT}
  fallback={<span className="text-gray-01 text-sm">View only</span>}
>
  <Button>Edit Student</Button>
</PermissionGate>

// Render disabled button instead of hiding
<PermissionGate
  permission={P.MANAGE_FEES}
  fallback={<Button disabled>Manage Fees</Button>}
>
  <Button>Manage Fees</Button>
</PermissionGate>

// Multiple permissions — any one
<PermissionGate permission={[P.ADD_BRANCH, P.MODIFY_BRANCH]}>
  <Button>Save</Button>
</PermissionGate>

// Multiple permissions — all required
<PermissionGate
  permission={[P.BROWSE_STUDENTS, P.MODIFY_STUDENT]}
  mode="all"
>
  <Button>Edit</Button>
</PermissionGate>
```

**For dropdown action lists** (plain object arrays, not JSX), use `usePermissions()` directly:

```tsx
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";

const { hasPermission } = usePermissions();

dropDownList={(row) => [
  {
    label: "View Details",
    onActionClick: () => navigate(routesPath.VIEW(row._slug)),
  },
  ...(hasPermission(P.MODIFY_STUDENT) ? [{
    label: "Edit Student",
    onActionClick: () => navigate(routesPath.EDIT(row._slug)),
  }] : []),
  ...(hasPermission(P.MANAGE_STUDENTS) ? [{
    label: "Withdraw",
    className: "text-destructive",
    onActionClick: () => handleWithdraw(row._slug),
  }] : []),
]}
```

---

## Checklist: Adding a New Protected Feature

When adding a new section to the app, work through this checklist:

- [ ] **Verify the permission keys exist** in the backend registry (`vs_rbac` app / `seed_school_permissions`). Don't invent keys — a typo silently denies access to everyone.
- [ ] **Add the key** to `REGISTRY` and a UI-intent `P.*` constant in `src/permissions/index.ts` — nowhere else references the raw string.
- [ ] **Add a sidebar item** in `app-sidebar.tsx` with the correct `permission` and `permissionMode`.
- [ ] **Add `PermissionGate`** around action buttons inside the page (Add, Edit, Manage).
- [ ] **Use `hasPermission()` directly** to filter dropdown action items.
- [ ] **Trust the backend** — the protected endpoint must enforce the same key server-side. The frontend gate is presentation only.
- [ ] **Test both paths**: (a) a user with the permission sees the affordance, (b) a user without does not — and the API returns 403 if they force the request.

---

## The `usePermissions` Hook

```ts
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";

const { hasPermission, hasAnyPermission, hasAllPermissions, hasModuleAccess } = usePermissions();

hasPermission(P.BROWSE_STUDENTS)                               // single key
hasAnyPermission(P.BROWSE_STUDENTS, P.BROWSE_TEACHERS)         // at least one
hasAllPermissions(P.BROWSE_STUDENTS, P.MODIFY_STUDENT)         // all required
hasModuleAccess("school.", "academics.")                      // any key under a module prefix
```

---

## Known Edge Cases

### 1. Permissions sync on mount and token refresh

Permissions are loaded at login. Two mechanisms keep them in sync after that:

- **On app mount** — `authenticated.tsx` calls `GET /user/auth/me/` via `useGetMeQuery`. The `onQueryStarted` handler dispatches `updatePermissions` with the fresh list. This catches any role changes that happened while the token was still valid.
- **On token refresh** — `base-api.ts` calls `fetchFreshPermissions()` immediately after a successful token refresh and dispatches `updatePermissions`. This covers the silent re-authentication path.

**Remaining gap:** If a user's permissions are revoked and their token has not yet expired, there is a window (up to the token's lifespan) before the next app mount triggers a sync. The backend will still return 403 on any API call that requires the revoked permission, so the user cannot actually perform the action even if the UI briefly shows the button.

### 2. Adding a wrong code fails silently

A code that doesn't exist in `REGISTRY` (e.g. a typo or a code that was never added) resolves to `""` via `resolvePermissionKey`, which will never match any backend permission. The guard **fails closed** — it denies everyone, including admins. TypeScript will catch a code that isn't a valid `PermissionCode` value, but it won't catch a valid code that was mapped to the wrong backend key. Always cross-reference with the backend's `seed_school_permissions` table before committing.

### 3. Routes with `permission: null` (always-visible) are unguarded

The Overview route is intentionally accessible to all authenticated users (`permission: null` in the sidebar). If sensitive data is ever added to the Overview page, guard those affordances with `PermissionGate` and confirm the backend enforces the key at that time.

### 4. No permission bypass for superusers on the frontend

The frontend checks the flat `permissions[]` array. If a school_admin's login response includes all their permission keys (as `get_effective_permissions()` returns), everything works. If a user somehow gets an empty permissions array from the login response, they will be blocked by every gate. Verify the backend returns the full set.

---

## Field-Level Security (FLS) — Hiding Stripped Response Fields

The backend serializer mixin (`FieldSecurityMixin` in `vs_rbac/fls.py`) can strip individual fields from an API response when the requesting user lacks the required read permission. Instead of sending the field at all, the backend appends a `_stripped_fields` array to the response listing every field it removed.

```json
{
  "name": "John Doe",
  "email": "john@school.com",
  "_stripped_fields": ["medical_notes", "guardian_contacts"]
}
```

This lets the frontend distinguish two different states:

| State | What it means | What to show |
|-------|--------------|-------------|
| Field in `_stripped_fields` | User has no permission to see it | Hide the element entirely |
| Field absent / null / empty, not stripped | Field exists, no data yet | Render `"—"` |

School users have four admin-metadata fields (`password_changed_at`, `last_login_at`, `invited_by_id`, `invited_by_name`) stripped from their own user payload; the sensitive-student fields are gated behind `P.VIEW_STUDENT_SENSITIVE` (`school.students.view_sensitive`).

### Usage

Import from `@/utils/fls`:

```tsx
import { isStripped, strippedFields } from "@/utils/fls";

// Single field check
{!isStripped(student, "medical_notes") && (
  <Row label="Medical Notes" value={student.medical_notes ?? "—"} />
)}

// Multiple fields — build a Set once to avoid repeated .includes() calls
const stripped = strippedFields(student);

<Row label="Medical Notes"        hidden={stripped.has("medical_notes")}        value={student.medical_notes ?? "—"} />
<Row label="Guardian Contacts"    hidden={stripped.has("guardian_contacts")}    value={student.guardian_contacts ?? "—"} />
```

### Typing API responses

Wrap any RTK Query response type with `WithFls<T>` to make `_stripped_fields` visible to TypeScript:

```ts
import type { WithFls } from "@/utils/fls";

type StudentDetail = WithFls<{
  name: string;
  email: string;
  medical_notes?: string | null;
  guardian_contacts?: string | null;
}>;
```

### Rule: backend and frontend must be updated in the same PR

Whenever a serializer gains a `read_permissions` entry, the corresponding frontend page **must** be updated in the same PR to guard those fields with `isStripped` / `strippedFields`. `_stripped_fields` is the contract between them; one side without the other is a bug.

---

## Architecture Diagram

```
User navigates to URL
        │
        ▼
  Authenticated         ← checks for valid access token (cookie)
  middleware            ← redirects to /accounts if missing; resyncs permissions via /me
        │
        ▼
  Page renders          ← NO route-level permission guard (by design)
        │
        ├── Sidebar     ← already filtered; matching items only shown
        │
        └── Page body
              ├── PermissionGate  ← hides/replaces buttons & sections
              └── hasPermission() ← filters dropdown action items
        │
        ▼
  API call              ← BACKEND is authoritative: 403 if the key is missing
```

---

## Current Permission Map

### `school` module (MM=10) — administration & people

| Backend key | Code | Sensitivity | UI constant |
|---|---|---|---|
| school.dashboard.view | 100101 | NORMAL | `VIEW_SCHOOL_DASHBOARD` |
| school.branches.view | 100201 | NORMAL | `BROWSE_BRANCHES` |
| school.branches.create | 100202 | SENSITIVE | `ADD_BRANCH` |
| school.branches.update | 100203 | NORMAL | `MODIFY_BRANCH` |
| school.branches.manage | 100208 | SENSITIVE | `MANAGE_BRANCH` |
| school.students.view | 100301 | NORMAL | `BROWSE_STUDENTS` |
| school.students.create | 100302 | NORMAL | `ENROLL_STUDENT` |
| school.students.update | 100303 | NORMAL | `MODIFY_STUDENT` |
| school.students.manage | 100308 | SENSITIVE | `MANAGE_STUDENTS` |
| school.students.view_sensitive | 100339 | SENSITIVE | `VIEW_STUDENT_SENSITIVE` |
| school.teachers.view | 100401 | NORMAL | `BROWSE_TEACHERS` |
| school.teachers.create | 100402 | NORMAL | `INVITE_TEACHER` |
| school.teachers.update | 100403 | NORMAL | `MODIFY_TEACHER` |
| school.teachers.manage | 100408 | SENSITIVE | `MANAGE_TEACHERS` |
| school.administrators.view | 100501 | NORMAL | `BROWSE_ADMINISTRATORS` |
| school.administrators.create | 100502 | SENSITIVE | `INVITE_ADMINISTRATOR` |
| school.administrators.update | 100503 | SENSITIVE | `MODIFY_ADMINISTRATOR` |
| school.administrators.suspend | 100509 | SENSITIVE | `SUSPEND_ADMINISTRATOR` |
| school.administrators.reactivate | 100510 | SENSITIVE | `REACTIVATE_ADMINISTRATOR` |
| school.fees.view | 100601 | NORMAL | `VIEW_FEES` |
| school.fees.manage | 100608 | SENSITIVE | `MANAGE_FEES` |
| school.settings.view | 100701 | NORMAL | `VIEW_SETTINGS` |
| school.settings.manage | 100708 | SENSITIVE | `MANAGE_SETTINGS` |
| school.roles.view | 100801 | NORMAL | `VIEW_ROLES` |
| school.roles.assign | 100811 | SENSITIVE | `ASSIGN_ROLE` |

### `academics` module (MM=30) — sessions, calendar & classes

| Backend key | Code | Sensitivity | UI constant |
|---|---|---|---|
| academics.session.view | 300101 | NORMAL | `BROWSE_SESSIONS` |
| academics.session.create | 300102 | NORMAL | `CREATE_SESSION` |
| academics.session.update | 300103 | NORMAL | `MODIFY_SESSION` |
| academics.session.manage | 300108 | SENSITIVE | `MANAGE_SESSIONS` |
| academics.calendar.view | 300201 | NORMAL | `BROWSE_CALENDAR` |
| academics.calendar.create | 300202 | NORMAL | `CREATE_CALENDAR_EVENT` |
| academics.calendar.update | 300203 | NORMAL | `MODIFY_CALENDAR_EVENT` |
| academics.calendar.manage | 300208 | SENSITIVE | `MANAGE_CALENDAR` |
| academics.classes.view | 300301 | NORMAL | `BROWSE_CLASSES` |
| academics.classes.create | 300302 | NORMAL | `CREATE_CLASS` |
| academics.classes.update | 300303 | NORMAL | `MODIFY_CLASS` |
| academics.classes.manage | 300308 | SENSITIVE | `MANAGE_CLASSES` |
| academics.classes.assign | 300311 | SENSITIVE | `ASSIGN_CLASS` |
