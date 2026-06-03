export const ROLES = {
  USER: 'user',
  TEACHER: 'teacher',
  STUDENT: 'student',
  STAFF: 'staff',
  ADMIN: 'admin',
} as const;

export const ROLE_LABELS = {
  [ROLES.USER]: 'User',
  [ROLES.TEACHER]: 'Teacher',
  [ROLES.STUDENT]: 'Student',
  [ROLES.STAFF]: 'Staff',
  [ROLES.ADMIN]: 'Admin',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
