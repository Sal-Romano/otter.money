import { createContext, useContext, useEffect } from 'react'
import { useColorMode } from '@chakra-ui/react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const ColorModeContext = createContext<null>(null)

export const ColorModeProvider = ({ children }: { children: React.ReactNode }) => {
  const { colorMode, setColorMode } = useColorMode()
  const { user } = useAuth()

  useEffect(() => {
    const initializeColorMode = async () => {
      if (!user) return

      const { data, error } = await supabase
        .from('user_settings')
        .select('dark_mode')
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching color mode:', error)
        return
      }

      if (data) {
        if (data.dark_mode === null) {
          // System preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          setColorMode(prefersDark ? 'dark' : 'light')
        } else {
          setColorMode(data.dark_mode ? 'dark' : 'light')
        }
      }
    }

    initializeColorMode()

    // Listen for system color scheme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = async () => {
      const { data } = await supabase
        .from('user_settings')
        .select('dark_mode')
        .single()

      if (data?.dark_mode === null) {
        setColorMode(mediaQuery.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [user, setColorMode])

  return (
    <ColorModeContext.Provider value={null}>
      {children}
    </ColorModeContext.Provider>
  )
} 