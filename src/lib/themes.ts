export type ThemeId = 'bee2hive' | 'sparkiq-blue' | 'green' | 'dark'

export interface ThemeConfig {
  id: ThemeId
  name: string
  description: string
  colors: {
    primary: string
    secondary: string
    background: string
    foreground: string
    accent: string
  }
}

export const themes: ThemeConfig[] = [
  {
    id: 'bee2hive',
    name: 'Red Theme',
    description: 'The default Bee2hive theme with red accents',
    colors: {
      primary: '#f93f26',
      secondary: '#2D3436',
      background: '#ffffff',
      foreground: '#1a1a1a',
      accent: '#f5f5f5',
    },
  },
  {
    id: 'sparkiq-blue',
    name: 'Blue Theme',
    description: 'Modern blue theme inspired by industrial innovation',
    colors: {
      primary: '#2196F3',
      secondary: '#1976D2',
      background: '#ffffff',
      foreground: '#1a1a1a',
      accent: '#E3F2FD',
    },
  },
  {
    id: 'green',
    name: 'Green Theme',
    description: 'Fresh green theme inspired by Ambiente division',
    colors: {
      primary: '#2ECC71',
      secondary: '#27AE60',
      background: '#ffffff',
      foreground: '#1a1a1a',
      accent: '#E8F8F5',
    },
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    description: 'Dark theme for reduced eye strain',
    colors: {
      primary: '#f93f26',
      secondary: '#2D3436',
      background: '#0a0a0a',
      foreground: '#ededed',
      accent: '#262626',
    },
  },
]

export function getThemeById(id: ThemeId): ThemeConfig | undefined {
  return themes.find((theme) => theme.id === id)
}


