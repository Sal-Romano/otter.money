import { 
  Box, 
  Button, 
  ButtonGroup, 
  Heading, 
  Text, 
  VStack, 
  useColorMode, 
  useToast, 
  useColorModeValue
} from '@chakra-ui/react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'
import CategoryEditor from '../components/categories/CategoryEditor'

interface UserSettings {
  id: string
  dark_mode: boolean | null
  categories?: CategoryStructure
}

type ColorModeSetting = 'light' | 'dark' | 'system'

interface Category {
  name: string;
  color: string;
  subcategories?: Category[];
}

interface CategoryStructure {
  account_categories: Category[];
  transaction_categories: Category[];
}

const Settings = () => {
  const { colorMode, setColorMode } = useColorMode()
  const { user, session, signOut } = useAuth()
  const toast = useToast()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [colorModeSetting, setColorModeSetting] = useState<ColorModeSetting>('system')
  const [categories, setCategories] = useState<CategoryStructure>({
    account_categories: [],
    transaction_categories: []
  })

  const boxBg = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const headerColor = useColorModeValue('blue.600', 'blue.200')

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user || !session) return;

      try {
        const { data, error } = await supabase
          .from('om_user_settings')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          throw error;
        } 
        
        if (data) {
          setSettings(data)
          setColorModeSetting(data.dark_mode === null ? 'system' : data.dark_mode ? 'dark' : 'light')
          
          // Handle the new categories structure
          if (data.categories) {
            if (typeof data.categories === 'object' && 
                'account_categories' in data.categories && 
                'transaction_categories' in data.categories) {
              // New structure already exists
              setCategories(data.categories as CategoryStructure);
            } else if (Array.isArray(data.categories)) {
              // Old structure, convert to new
              setCategories({
                account_categories: data.categories as Category[],
                transaction_categories: []
              });
            } else {
              // Initialize empty structure
              setCategories({
                account_categories: [],
                transaction_categories: []
              });
            }
          } else {
            // Initialize with default categories
            const defaultCategories: CategoryStructure = {
              account_categories: [
                { name: "Checking", color: "green.500" },
                { name: "Savings", color: "blue.500" },
                { name: "Investment", color: "purple.500" },
                { name: "Credit Card", color: "red.500" }
              ],
              transaction_categories: [
                { name: "Food", color: "green.500" },
                { name: "Bills", color: "red.500" },
                { name: "Transportation", color: "blue.500" },
                { name: "Entertainment", color: "purple.500" }
              ]
            };
            
            setCategories(defaultCategories);
            
            // Save default categories
            const { error: upsertError } = await supabase
              .from('om_user_settings')
              .upsert({
                id: user.id,
                dark_mode: data?.dark_mode ?? null,
                categories: defaultCategories,
                updated_at: new Date().toISOString()
              })
              
            if (upsertError) throw upsertError;
          }
        } else {
          // Create default settings if none exist
          const defaultCategories: CategoryStructure = {
            account_categories: [
              { name: "Checking", color: "green.500" },
              { name: "Savings", color: "blue.500" },
              { name: "Investment", color: "purple.500" },
              { name: "Credit Card", color: "red.500" }
            ],
            transaction_categories: [
              { name: "Food", color: "green.500" },
              { name: "Bills", color: "red.500" },
              { name: "Transportation", color: "blue.500" },
              { name: "Entertainment", color: "purple.500" }
            ]
          };
          
          const { error: upsertError } = await supabase
            .from('om_user_settings')
            .upsert({
              id: user.id,
              dark_mode: null,
              categories: defaultCategories,
              updated_at: new Date().toISOString()
            })
            
          if (upsertError) throw upsertError;
          
          setSettings({
            id: user.id,
            dark_mode: null,
            categories: defaultCategories
          })
          setCategories(defaultCategories);
        }
      } catch (error: any) {
        toast({
          title: 'Error fetching settings',
          description: error.message,
          status: 'error',
          duration: 5000,
        })
      }
    }

    if (user) {
      fetchSettings()
    }
  }, [user, session])

  const handleColorModeChange = async (newMode: ColorModeSetting) => {
    if (!user) return;
    
    setColorModeSetting(newMode)

    // Update color mode
    if (newMode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setColorMode(prefersDark ? 'dark' : 'light')
    } else {
      setColorMode(newMode)
    }

    // Save to database
    try {
      const { error } = await supabase
        .from('om_user_settings')
        .upsert({
          id: user.id,
          dark_mode: newMode === 'system' ? null : newMode === 'dark',
          categories: categories,
          updated_at: new Date().toISOString()
        })

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: 'Error saving settings',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
    }
  }

  const handleCategoriesChange = (updatedCategories: CategoryStructure) => {
    setCategories(updatedCategories);
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
        <Heading 
          size="lg" 
          mb={6} 
          color={headerColor} 
          borderBottom="2px solid" 
          borderColor={borderColor} 
          pb={2}
        >
          Settings
          <Text color={textColor} fontSize="md" fontWeight="normal" mt={1}>
            Manage your account preferences
          </Text>
        </Heading>

        <Box bg={boxBg} p={6} rounded="lg" shadow="md" borderWidth="1px" borderColor={borderColor}>
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

        <CategoryEditor 
          categories={categories} 
          onCategoriesChange={handleCategoriesChange} 
        />

        <Box bg={boxBg} p={6} rounded="lg" shadow="md" borderWidth="1px" borderColor={borderColor}>
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