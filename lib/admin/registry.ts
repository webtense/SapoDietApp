export type AdminGroup =
  | "RESUMEN"
  | "CRECIMIENTO"
  | "PRODUCTO"
  | "DATOS"
  | "COMERCIO"
  | "TECNOLOGÍA"

export interface AdminScreen {
  id: string
  group: AdminGroup
  title: string
  description?: string
  path: string
  icon?: string
}

export const ADMIN_GROUP_ORDER: AdminGroup[] = [
  "RESUMEN",
  "CRECIMIENTO",
  "PRODUCTO",
  "DATOS",
  "COMERCIO",
  "TECNOLOGÍA",
]

export const ADMIN_REGISTRY: AdminScreen[] = [
  {
    id: "users",
    group: "RESUMEN",
    title: "Usuarios",
    description: "Alta, invitaciones y estado de usuarios",
    path: "/admin",
    icon: "Users",
  },
  {
    id: "dashboard",
    group: "RESUMEN",
    title: "Dashboard",
    description: "Métricas generales de la app",
    path: "/admin/dashboard",
    icon: "LayoutDashboard",
  },
  {
    id: "machines",
    group: "RESUMEN",
    title: "Máquinas",
    description: "Modelos y máquinas de gimnasio",
    path: "/admin/machines",
    icon: "Dumbbell",
  },
  {
    id: "version",
    group: "RESUMEN",
    title: "Versiones",
    description: "Control de versiones y despliegues",
    path: "/admin/version",
    icon: "GitBranch",
  },
  {
    id: "status",
    group: "RESUMEN",
    title: "Estado",
    description: "Estado de los servicios y salud del sistema",
    path: "/admin/status",
    icon: "Activity",
  },
  {
    id: "audit",
    group: "TECNOLOGÍA",
    title: "Auditoría",
    description: "Registro de acciones administrativas",
    path: "/admin/audit",
    icon: "ScrollText",
  },
]

export function getScreensByGroup(): Record<AdminGroup, AdminScreen[]> {
  const grouped = {} as Record<AdminGroup, AdminScreen[]>
  for (const group of ADMIN_GROUP_ORDER) {
    grouped[group] = ADMIN_REGISTRY.filter((screen) => screen.group === group)
  }
  return grouped
}

export function getScreenByPath(path: string): AdminScreen | undefined {
  return ADMIN_REGISTRY.find((screen) => screen.path === path)
}
