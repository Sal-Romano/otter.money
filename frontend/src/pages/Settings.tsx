import { Box, Button, ButtonGroup, Heading, Text, VStack, useColorMode, useToast, useColorModeValue } from '@chakra-ui/react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'

interface UserSettings {
  id: string
  dark_mode: boolean | null
}

type ColorModeSetting = 'light' | 'dark' | 'system'

const Settings = () => {
  const { colorMode, setColorMode } = useColorMode()
  const { user, signOut } = useAuth()
  const toast = useToast()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [colorModeSetting, setColorModeSetting] = useState<ColorModeSetting>('system')

  const boxBg = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.300')

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') {
        toast({
          title: 'Error fetching settings',
          description: error.message,
          status: 'error',
          duration: 5000,
        })
      } else if (data) {
        setSettings(data)
        setColorModeSetting(data.dark_mode === null ? 'system' : data.dark_mode ? 'dark' : 'light')
      }
    }

    if (user) {
      fetchSettings()
    }
  }, [user])

  const handleColorModeChange = async (newMode: ColorModeSetting) => {
    setColorModeSetting(newMode)

    // Update color mode
    if (newMode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setColorMode(prefersDark ? 'dark' : 'light')
    } else {
      setColorMode(newMode)
    }

    // Save to database
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        id: user?.id,
        dark_mode: newMode === 'system' ? null : newMode === 'dark',
        updated_at: new Date().toISOString()
      })

    if (error) {
      toast({
        title: 'Error saving settings',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      toast({
        title: 'Error signing out',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
      })
    }
  }

  return (
    <Box w="100%" maxW="container.md" mx="auto">
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg">Settings</Heading>
          <Text color={textColor}>Manage your account preferences</Text>
        </Box>

        <Box bg={boxBg} p={6} rounded="lg" shadow="sm">
          <VStack spacing={6} align="stretch">
            <Heading size="md">Appearance</Heading>
            <Box>
              <Text mb={4} color={textColor}>Theme</Text>
              <ButtonGroup isAttached variant="outline" w="100%">
                <Button
                  flex="1"
                  onClick={() => handleColorModeChange('light')}
                  colorScheme={colorModeSetting === 'light' ? 'blue' : undefined}
                  variant={colorModeSetting === 'light' ? 'solid' : 'outline'}
                >
                  Light
                </Button>
                <Button
                  flex="1"
                  onClick={() => handleColorModeChange('dark')}
                  colorScheme={colorModeSetting === 'dark' ? 'blue' : undefined}
                  variant={colorModeSetting === 'dark' ? 'solid' : 'outline'}
                >
                  Dark
                </Button>
                <Button
                  flex="1"
                  onClick={() => handleColorModeChange('system')}
                  colorScheme={colorModeSetting === 'system' ? 'blue' : undefined}
                  variant={colorModeSetting === 'system' ? 'solid' : 'outline'}
                >
                  System
                </Button>
              </ButtonGroup>
            </Box>
          </VStack>
        </Box>

        <Box bg={boxBg} p={6} rounded="lg" shadow="sm">
          <VStack spacing={6} align="stretch">
            <Heading size="md">Account</Heading>
            <Text color={textColor}>Email: {user?.email}</Text>
            <Button colorScheme="red" onClick={handleSignOut}>
              Sign Out
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Box>
  )
}

export default Settings 