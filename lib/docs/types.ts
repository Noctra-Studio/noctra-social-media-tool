export type DocSlug =
  | 'primeros-pasos'
  | 'configuracion-cuenta'
  | 'crear-publicaciones'
  | 'conectar-redes-sociales'

export interface DocStep {
  title: string
  description: string
}

export interface DocSection {
  title: string
  steps: DocStep[]
}

export interface DocCallout {
  type: 'info' | 'warning' | 'tip'
  content: string
}

export interface DocPage {
  slug: DocSlug
  title: string
  subtitle: string
  callout?: DocCallout
  sections: DocSection[]
}

export interface DocNavItem {
  slug: DocSlug
  label: string
  labelEn: string
  icon: string             // Lucide icon name
  badge?: string           // Optional badge text like "APIs"
  group: string            // Navigation group label
}
