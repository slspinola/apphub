'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTheme } from '@/lib/theme-provider'
import { themes } from '@/lib/themes'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ThemesPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Themes</h3>
        <p className="text-sm text-muted-foreground">
          Choose a theme that best suits your preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {themes.map((themeConfig) => {
          const isSelected = theme === themeConfig.id

          return (
            <Card
              key={themeConfig.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-lg relative overflow-hidden',
                isSelected && 'ring-2 ring-primary shadow-md'
              )}
              onClick={() => setTheme(themeConfig.id)}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 z-10">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
                    <Check className="h-4 w-4" />
                  </div>
                </div>
              )}

              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{themeConfig.name}</CardTitle>
                <CardDescription>{themeConfig.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Color Preview */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Color Palette
                  </p>
                  <div className="flex gap-2">
                    <div
                      className="w-12 h-12 rounded-md shadow-sm border"
                      style={{ backgroundColor: themeConfig.colors.primary }}
                      title="Primary"
                    />
                    <div
                      className="w-12 h-12 rounded-md shadow-sm border"
                      style={{ backgroundColor: themeConfig.colors.secondary }}
                      title="Secondary"
                    />
                    <div
                      className="w-12 h-12 rounded-md shadow-sm border border-border"
                      style={{ backgroundColor: themeConfig.colors.background }}
                      title="Background"
                    />
                    <div
                      className="w-12 h-12 rounded-md shadow-sm border"
                      style={{ backgroundColor: themeConfig.colors.accent }}
                      title="Accent"
                    />
                  </div>
                </div>

                {/* Preview UI Elements */}
                <div
                  className="space-y-2 p-4 rounded-lg border"
                  style={{
                    backgroundColor: themeConfig.colors.background,
                    color: themeConfig.colors.foreground,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Preview</span>
                    <div
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: themeConfig.colors.primary,
                        color: '#ffffff',
                      }}
                    >
                      Button
                    </div>
                  </div>
                  <div
                    className="h-2 rounded-full"
                    style={{ backgroundColor: themeConfig.colors.accent }}
                  />
                  <div
                    className="h-2 rounded-full w-2/3"
                    style={{ backgroundColor: themeConfig.colors.accent }}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">About Themes</h4>
            <p className="text-sm text-muted-foreground">
              Themes allow you to customize the look and feel of your application. Your theme
              preference is saved locally and will persist across sessions.
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
              <li>
                <strong>Red Theme:</strong> The original theme with distinctive red accents
              </li>
              <li>
                <strong>Blue Theme:</strong> A modern, professional theme with calming blue tones
              </li>
              <li>
                <strong>Green Theme:</strong> Fresh and vibrant theme inspired by the Ambiente division
              </li>
              <li>
                <strong>Dark Mode:</strong> Reduces eye strain in low-light environments
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


