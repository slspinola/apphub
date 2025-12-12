// src/react/index.ts
function hasPermission(session, permission) {
  return session?.permissions?.includes(permission) ?? false;
}
function hasAllPermissions(session, permissions) {
  if (!session?.permissions) return false;
  return permissions.every((p) => session.permissions.includes(p));
}
function hasAnyPermission(session, permissions) {
  if (!session?.permissions) return false;
  return permissions.some((p) => session.permissions.includes(p));
}
var ROLE_HIERARCHY = {
  member: 1,
  manager: 2,
  admin: 3,
  owner: 4
};
function hasRole(session, minimumRole) {
  if (!session?.role) return false;
  const userLevel = ROLE_HIERARCHY[session.role] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[minimumRole] ?? 0;
  return userLevel >= requiredLevel;
}
function isOwner(session) {
  return session?.role === "owner";
}
function isAdmin(session) {
  return hasRole(session, "admin");
}
function canPerform(session, resource, action) {
  return hasPermission(session, `${resource}:${action}`);
}
function canRead(session, resource) {
  return canPerform(session, resource, "read");
}
function canWrite(session, resource) {
  return canPerform(session, resource, "write");
}
function canDelete(session, resource) {
  return canPerform(session, resource, "delete");
}
function checkGateAccess(session, options) {
  const { permission, requireAll, role } = options;
  if (role && !hasRole(session, role)) {
    return false;
  }
  if (permission) {
    const permissions = Array.isArray(permission) ? permission : [permission];
    if (requireAll) {
      if (!hasAllPermissions(session, permissions)) {
        return false;
      }
    } else {
      if (!hasAnyPermission(session, permissions)) {
        return false;
      }
    }
  }
  return true;
}
function getResourcePermissions(session, resource) {
  if (!session?.permissions) return [];
  return session.permissions.filter((p) => p.startsWith(`${resource}:`));
}
function getAccessibleResources(session) {
  if (!session?.permissions) return [];
  const resources = /* @__PURE__ */ new Set();
  for (const permission of session.permissions) {
    const [resource] = permission.split(":");
    resources.add(resource);
  }
  return Array.from(resources);
}
function hasAnyAccess(session) {
  return (session?.permissions?.length ?? 0) > 0;
}
function toClientSession(session) {
  if (!session?.user?.entityId) return null;
  const user = session.user;
  return {
    user: {
      id: user.id ?? "",
      email: user.email ?? "",
      name: user.name ?? null,
      image: user.image ?? null
    },
    entity: {
      id: user.entityId,
      // Guaranteed by the check above
      name: user.entityName ?? "",
      slug: user.entitySlug ?? ""
    },
    role: user.role ?? "member",
    permissions: user.permissions ?? [],
    isImpersonated: false
  };
}
function filterNavItems(items, session) {
  return items.filter((item) => {
    if (item.permission && !hasPermission(session, item.permission)) {
      return false;
    }
    if (item.role && !hasRole(session, item.role)) {
      return false;
    }
    return true;
  });
}
function getUserDisplayName(session, fallback = "User") {
  return session?.user?.name || session?.user?.email || fallback;
}
function getUserInitials(session) {
  const name = session?.user?.name;
  if (name) {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  const email = session?.user?.email;
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "??";
}

export { canDelete, canPerform, canRead, canWrite, checkGateAccess, filterNavItems, getAccessibleResources, getResourcePermissions, getUserDisplayName, getUserInitials, hasAllPermissions, hasAnyAccess, hasAnyPermission, hasPermission, hasRole, isAdmin, isOwner, toClientSession };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map