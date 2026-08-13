export function isResourceOwner(user, ownerId) {
  return Boolean(user) && Number(ownerId) === Number(user.id);
}

export function canAccessPrivateResource(user, ownerId) {
  return isResourceOwner(user, ownerId) || user?.is_admin === true;
}
