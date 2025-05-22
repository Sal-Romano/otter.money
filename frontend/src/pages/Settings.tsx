import { 
  Box, 
  Button, 
  ButtonGroup, 
  Heading, 
  Text, 
  VStack, 
  useColorMode, 
  useToast, 
  useColorModeValue, 
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Input,
  HStack,
  FormControl,
  FormLabel,
  Tag,
  Flex,
  Divider,
  SimpleGrid,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
  Alert,
  AlertIcon,
  Badge,
  InputGroup,
  InputRightElement
} from '@chakra-ui/react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'
import { AddIcon, DeleteIcon, EditIcon, WarningIcon } from '@chakra-ui/icons'

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

// Predefined color options
const colorOptions = [
  { name: "Red", value: "red.500" },
  { name: "Orange", value: "orange.500" },
  { name: "Yellow", value: "yellow.500" },
  { name: "Green", value: "green.500" },
  { name: "Teal", value: "teal.500" },
  { name: "Blue", value: "blue.500" },
  { name: "Cyan", value: "cyan.500" },
  { name: "Purple", value: "purple.500" },
  { name: "Pink", value: "pink.500" },
  { name: "Gray", value: "gray.500" }
];

type CategoryType = 'account' | 'transaction';

const Settings = () => {
  const { colorMode, setColorMode } = useColorMode()
  const { user, session, signOut } = useAuth()
  const toast = useToast()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [colorModeSetting, setColorModeSetting] = useState<ColorModeSetting>('system')
  const [categoryType, setCategoryType] = useState<CategoryType>('account')
  const [categories, setCategories] = useState<CategoryStructure>({
    account_categories: [],
    transaction_categories: []
  })
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [newCategory, setNewCategory] = useState<Category>({ name: '', color: 'blue.500' })
  const [parentCategory, setParentCategory] = useState<string | null>(null)

  const boxBg = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const headerColor = useColorModeValue('blue.600', 'blue.200')

  const { 
    isOpen: isCategoryEditorOpen, 
    onOpen: onCategoryEditorOpen, 
    onClose: onCategoryEditorClose 
  } = useDisclosure()

  const { 
    isOpen: isNewCategoryModalOpen, 
    onOpen: onNewCategoryModalOpen, 
    onClose: onNewCategoryModalClose 
  } = useDisclosure()

  const { 
    isOpen: isEditCategoryModalOpen, 
    onOpen: onEditCategoryModalOpen, 
    onClose: onEditCategoryModalClose 
  } = useDisclosure()

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

  const validateCategory = (categoryName: string, type: CategoryType, parentCat: string | null = null, currentIndex: number | null = null): string | null => {
    if (!categoryName.trim()) {
      return 'Category name cannot be empty';
    }
    
    if (categoryName.length > 100) {
      return 'Category name cannot exceed 100 characters';
    }
    
    const categoryList = type === 'account' 
      ? categories.account_categories 
      : categories.transaction_categories;
    
    // Check if we're at the limit (only for new categories, not edits)
    if (currentIndex === null && !parentCat && categoryList.length >= 100) {
      return `You can have a maximum of 100 ${type} categories`;
    }
    
    // Check for duplicate name
    if (parentCat) {
      // Check for duplicate subcategory name
      const parent = categoryList.find(cat => cat.name === parentCat);
      if (parent && parent.subcategories) {
        // When editing, exclude the current subcategory from duplicate check
        const hasDuplicate = parent.subcategories.some((subcat, idx) => 
          subcat.name.toLowerCase() === categoryName.toLowerCase() && 
          (currentIndex === null || idx !== currentIndex)
        );
        
        if (hasDuplicate) {
          return 'A subcategory with this name already exists';
        }
      }
    } else {
      // Check for duplicate top-level category
      const hasDuplicate = categoryList.some((cat, idx) => 
        cat.name.toLowerCase() === categoryName.toLowerCase() && 
        (currentIndex === null || idx !== currentIndex)
      );
      
      if (hasDuplicate) {
        return 'A category with this name already exists';
      }
    }
    
    return null;
  };

  const handleAddCategory = async () => {
    if (!user) return;
    
    const validationError = validateCategory(newCategory.name, categoryType, parentCategory, null);
    if (validationError) {
      toast({
        title: 'Invalid category',
        description: validationError,
        status: 'error',
        duration: 3000,
      });
      return;
    }

    let updatedCategories = { ...categories };

    if (parentCategory) {
      // Adding a subcategory
      const targetList = categoryType === 'account' 
        ? updatedCategories.account_categories 
        : updatedCategories.transaction_categories;
      
      const parentIndex = targetList.findIndex(cat => cat.name === parentCategory);
      
      if (parentIndex !== -1) {
        const parentColor = targetList[parentIndex].color;
        
        if (!targetList[parentIndex].subcategories) {
          targetList[parentIndex].subcategories = [];
        }
        
        targetList[parentIndex].subcategories!.push({
          name: newCategory.name,
          color: parentColor // Use parent's color for subcategory
        });
      }
    } else {
      // Adding a top-level category
      const targetList = categoryType === 'account' 
        ? 'account_categories' 
        : 'transaction_categories';
        
      updatedCategories[targetList].push(newCategory);
    }

    try {
      const { error } = await supabase
        .from('om_user_settings')
        .update({
          categories: updatedCategories,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setCategories(updatedCategories);
      setNewCategory({ name: '', color: 'blue.500' });
      setParentCategory(null);
      onNewCategoryModalClose();

      toast({
        title: 'Category added',
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: 'Error adding category',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleEditCategory = (category: Category, index: number, isSubcategory = false, parentCatName: string | null = null) => {
    setEditingCategory({ ...category });
    setEditIndex(index);
    setParentCategory(parentCatName);
    onEditCategoryModalOpen();
  };

  const handleSaveEdit = async () => {
    if (!user || editIndex === null || !editingCategory) return;
    
    // Check if the category being edited has subcategories (for parent reassignment restriction)
    const categoryList = categoryType === 'account' 
      ? categories.account_categories 
      : categories.transaction_categories;
    
    // Only do this check if we're changing from a top-level category to a subcategory
    if (!parentCategory && editingCategory.subcategories && editingCategory.subcategories.length > 0) {
      // We're trying to reassign a parent with children
      const newParentCategory = document.getElementById('edit-parent-select') as HTMLSelectElement;
      if (newParentCategory && newParentCategory.value) {
        toast({
          title: 'Cannot reassign category',
          description: 'Remove all subcategories before assigning this category to a parent',
          status: 'error',
          duration: 3000,
        });
        return;
      }
    }
    
    const validationError = validateCategory(
      editingCategory.name, 
      categoryType, 
      parentCategory,
      editIndex
    );
    
    if (validationError) {
      toast({
        title: 'Invalid category',
        description: validationError,
        status: 'error',
        duration: 3000,
      });
      return;
    }

    let updatedCategories = { ...categories };
    const targetList = categoryType === 'account' 
      ? 'account_categories' 
      : 'transaction_categories';
    
    // Get the selected parent from dropdown (could be different from current parent)
    const newParentSelect = document.getElementById('edit-parent-select') as HTMLSelectElement;
    const newParentValue = newParentSelect ? newParentSelect.value : '';
    const newParent = newParentValue || null;
    
    // Handle the case where we're changing the parent
    if (newParent !== parentCategory) {
      if (parentCategory) {
        // We're moving from one parent to another (or to top-level)
        
        // 1. Remove from old parent
        const oldParentIndex = updatedCategories[targetList].findIndex(
          cat => cat.name === parentCategory
        );
        
        if (oldParentIndex !== -1 && updatedCategories[targetList][oldParentIndex].subcategories) {
          updatedCategories[targetList][oldParentIndex].subcategories = 
            updatedCategories[targetList][oldParentIndex].subcategories!.filter((_, idx) => idx !== editIndex);
        }
        
        // 2. Add to new parent or make top-level
        if (newParent) {
          // Moving to a new parent
          const newParentIndex = updatedCategories[targetList].findIndex(
            cat => cat.name === newParent
          );
          
          if (newParentIndex !== -1) {
            // Inherit the new parent's color
            editingCategory.color = updatedCategories[targetList][newParentIndex].color;
            
            if (!updatedCategories[targetList][newParentIndex].subcategories) {
              updatedCategories[targetList][newParentIndex].subcategories = [];
            }
            
            updatedCategories[targetList][newParentIndex].subcategories!.push(editingCategory);
          }
        } else {
          // Moving to top-level
          updatedCategories[targetList].push(editingCategory);
        }
      } else if (newParent) {
        // We're moving from top-level to a parent
        
        // 1. Remove from top-level
        updatedCategories[targetList] = updatedCategories[targetList].filter((_, idx) => idx !== editIndex);
        
        // 2. Add to new parent
        const newParentIndex = updatedCategories[targetList].findIndex(
          cat => cat.name === newParent
        );
        
        if (newParentIndex !== -1) {
          // Inherit the new parent's color
          editingCategory.color = updatedCategories[targetList][newParentIndex].color;
          
          if (!updatedCategories[targetList][newParentIndex].subcategories) {
            updatedCategories[targetList][newParentIndex].subcategories = [];
          }
          
          // Remove subcategories when moving under a parent
          delete editingCategory.subcategories;
          
          updatedCategories[targetList][newParentIndex].subcategories!.push(editingCategory);
        }
      } else {
        // Staying as top-level but changing other properties
        updatedCategories[targetList][editIndex] = editingCategory;
      }
    } else {
      // Not changing parent, just updating properties
      if (parentCategory) {
        // Editing a subcategory - ensure it uses parent's color
        const parentIndex = updatedCategories[targetList].findIndex(
          cat => cat.name === parentCategory
        );
        
        if (parentIndex !== -1) {
          // Inherit parent's color
          editingCategory.color = updatedCategories[targetList][parentIndex].color;
          
          if (updatedCategories[targetList][parentIndex].subcategories) {
            updatedCategories[targetList][parentIndex].subcategories![editIndex] = editingCategory;
          }
        }
      } else {
        // Editing a top-level category
        updatedCategories[targetList][editIndex] = editingCategory;
      }
    }

    try {
      const { error } = await supabase
        .from('om_user_settings')
        .update({
          categories: updatedCategories,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setCategories(updatedCategories);
      setEditingCategory(null);
      setEditIndex(null);
      setParentCategory(null);
      onEditCategoryModalClose();

      toast({
        title: 'Category updated',
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: 'Error updating category',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleDeleteCategory = async (index: number, isSubcategory = false, parentCatName: string | null = null) => {
    if (!user) return;
    
    // Ask for confirmation
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    let updatedCategories = { ...categories };
    const targetList = categoryType === 'account' 
      ? 'account_categories' 
      : 'transaction_categories';

    if (parentCatName) {
      // Deleting a subcategory
      const parentIndex = updatedCategories[targetList].findIndex(
        cat => cat.name === parentCatName
      );
      
      if (parentIndex !== -1 && updatedCategories[targetList][parentIndex].subcategories) {
        updatedCategories[targetList][parentIndex].subcategories = 
          updatedCategories[targetList][parentIndex].subcategories!.filter((_, idx) => idx !== index);
      }
    } else {
      // Deleting a top-level category
      updatedCategories[targetList] = updatedCategories[targetList].filter((_, idx) => idx !== index);
    }

    try {
      const { error } = await supabase
        .from('om_user_settings')
        .update({
          categories: updatedCategories,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setCategories(updatedCategories);
      toast({
        title: 'Category deleted',
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: 'Error deleting category',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };

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

  // Render the category list for the editor modal
  const renderCategoryList = () => {
    const categoryList = categoryType === 'account' 
      ? categories.account_categories 
      : categories.transaction_categories;
    
    if (categoryList.length === 0) {
      return (
        <Text color={textColor}>No categories added yet. Add your first category to get started.</Text>
      );
    }
    
    return (
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>Category</Th>
            <Th>Color</Th>
            <Th width="100px">Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {categoryList.map((category, index) => (
            <>
              <Tr key={`${category.name}-${index}`}>
                <Td>
                  <HStack>
                    <Tag colorScheme={category.color.split('.')[0]} size="sm">
                      {category.name}
                    </Tag>
                    {category.subcategories && category.subcategories.length > 0 && (
                      <Badge ml={2}>{category.subcategories.length}</Badge>
                    )}
                  </HStack>
                </Td>
                <Td>
                  <Box 
                    bg={category.color} 
                    w="24px" 
                    h="24px" 
                    borderRadius="sm"
                  />
                </Td>
                <Td>
                  <HStack spacing={2}>
                    <IconButton
                      aria-label="Edit category"
                      icon={<EditIcon />}
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditCategory(category, index)}
                    />
                    <IconButton
                      aria-label="Delete category"
                      icon={<DeleteIcon />}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => handleDeleteCategory(index)}
                    />
                  </HStack>
                </Td>
              </Tr>
              {/* Render subcategories if any */}
              {category.subcategories && category.subcategories.map((subcat, subIndex) => (
                <Tr key={`${category.name}-${subcat.name}-${subIndex}`} bg={useColorModeValue('gray.50', 'gray.700')}>
                  <Td pl={8}>
                    <Text fontSize="sm">└ {subcat.name}</Text>
                  </Td>
                  <Td>
                    <Box 
                      bg={category.color} 
                      w="24px" 
                      h="24px" 
                      borderRadius="sm"
                      opacity={0.7}
                    />
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Edit subcategory"
                        icon={<EditIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditCategory(subcat, subIndex, true, category.name)}
                      />
                      <IconButton
                        aria-label="Delete subcategory"
                        icon={<DeleteIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => handleDeleteCategory(subIndex, true, category.name)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </>
          ))}
        </Tbody>
      </Table>
    );
  };

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

        <Box bg={boxBg} p={6} rounded="lg" shadow="md" borderWidth="1px" borderColor={borderColor}>
          <VStack spacing={6} align="stretch">
            <Flex justifyContent="space-between" alignItems="center">
              <Heading size="md">Categories</Heading>
              <Button 
                colorScheme="blue" 
                size="sm" 
                onClick={onCategoryEditorOpen}
              >
                Manage Categories
              </Button>
            </Flex>
            <Divider />
            
            <Text color={textColor}>
              Manage your account and transaction categories to organize your finances.
              You can create up to 100 categories of each type.
            </Text>
            
            <HStack spacing={4}>
              <Box>
                <Text fontWeight="bold" mb={1}>Account Categories</Text>
                <Tag colorScheme="blue" size="sm">
                  {categories.account_categories.length} categories
                </Tag>
              </Box>
              
              <Box>
                <Text fontWeight="bold" mb={1}>Transaction Categories</Text>
                <Tag colorScheme="green" size="sm">
                  {categories.transaction_categories.length} categories
                </Tag>
              </Box>
            </HStack>
          </VStack>
        </Box>

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

      {/* Category Editor Modal */}
      <Modal 
        isOpen={isCategoryEditorOpen} 
        onClose={onCategoryEditorClose} 
        size="xl"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Category Manager</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Tabs isFitted variant="enclosed" onChange={(index) => setCategoryType(index === 0 ? 'account' : 'transaction')}>
              <TabList mb="1em">
                <Tab>Account Categories</Tab>
                <Tab>Transaction Categories</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <Flex justifyContent="space-between" alignItems="center">
                      <Text fontWeight="bold">Account Categories</Text>
                      <Button 
                        leftIcon={<AddIcon />} 
                        colorScheme="blue" 
                        size="sm" 
                        onClick={() => {
                          setNewCategory({ name: '', color: 'blue.500' });
                          setParentCategory(null);
                          setCategoryType('account');
                          onNewCategoryModalOpen();
                        }}
                        isDisabled={categories.account_categories.length >= 100}
                      >
                        Add Category
                      </Button>
                    </Flex>
                    {categories.account_categories.length >= 100 && (
                      <Alert status="warning">
                        <AlertIcon />
                        You've reached the maximum of 100 account categories.
                      </Alert>
                    )}
                    {renderCategoryList()}
                  </VStack>
                </TabPanel>
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <Flex justifyContent="space-between" alignItems="center">
                      <Text fontWeight="bold">Transaction Categories</Text>
                      <Button 
                        leftIcon={<AddIcon />} 
                        colorScheme="blue" 
                        size="sm" 
                        onClick={() => {
                          setNewCategory({ name: '', color: 'green.500' });
                          setParentCategory(null);
                          setCategoryType('transaction');
                          onNewCategoryModalOpen();
                        }}
                        isDisabled={categories.transaction_categories.length >= 100}
                      >
                        Add Category
                      </Button>
                    </Flex>
                    {categories.transaction_categories.length >= 100 && (
                      <Alert status="warning">
                        <AlertIcon />
                        You've reached the maximum of 100 transaction categories.
                      </Alert>
                    )}
                    {renderCategoryList()}
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onCategoryEditorClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add New Category Modal */}
      <Modal isOpen={isNewCategoryModalOpen} onClose={onNewCategoryModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Add New {categoryType === 'account' ? 'Account' : 'Transaction'} Category
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4}>
              <FormLabel>Category Name</FormLabel>
              <InputGroup>
                <Input 
                  value={newCategory.name} 
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  placeholder="e.g., Groceries, Utilities, etc."
                  maxLength={100}
                />
                <InputRightElement>
                  <Text fontSize="xs" color={textColor}>
                    {newCategory.name.length}/100
                  </Text>
                </InputRightElement>
              </InputGroup>
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Parent Category (Optional)</FormLabel>
              <Select 
                placeholder="No parent (top-level category)" 
                value={parentCategory || ''}
                onChange={(e) => setParentCategory(e.target.value || null)}
              >
                {(categoryType === 'account' ? categories.account_categories : categories.transaction_categories)
                  .filter(cat => !cat.subcategories || cat.subcategories.length < 10) // Limit nesting depth
                  .map((cat, index) => (
                    <option key={index} value={cat.name}>{cat.name}</option>
                  ))
                }
              </Select>
            </FormControl>
            
            {!parentCategory && (
              <FormControl>
                <FormLabel>Color</FormLabel>
                <SimpleGrid columns={5} spacing={2}>
                  {colorOptions.map((color) => (
                    <Box 
                      key={color.value}
                      bg={color.value}
                      w="100%"
                      h="30px"
                      borderRadius="md"
                      cursor="pointer"
                      onClick={() => setNewCategory({...newCategory, color: color.value})}
                      border={newCategory.color === color.value ? "3px solid white" : "1px solid transparent"}
                      boxShadow={newCategory.color === color.value ? "0 0 0 1px #4299E1" : "none"}
                    />
                  ))}
                </SimpleGrid>
              </FormControl>
            )}
            
            {parentCategory && (
              <Alert status="info" mt={2} mb={4}>
                <AlertIcon />
                Subcategories inherit their parent's color
              </Alert>
            )}
            
            <Box mt={4} p={2} border="1px dashed" borderColor={borderColor} borderRadius="md">
              <Text fontWeight="bold" mb={2}>Preview</Text>
              {parentCategory ? (
                // Preview for subcategory with parent's color
                <HStack>
                  <Text>└</Text>
                  <Tag 
                    colorScheme={
                      (categoryType === 'account' 
                        ? categories.account_categories 
                        : categories.transaction_categories)
                        .find(cat => cat.name === parentCategory)?.color.split('.')[0] || 'blue'
                    } 
                    size="md"
                  >
                    {newCategory.name || 'Subcategory Name'}
                  </Tag>
                </HStack>
              ) : (
                // Preview for top-level category with selected color
                <Tag colorScheme={newCategory.color.split('.')[0]} size="md">
                  {newCategory.name || 'Category Name'}
                </Tag>
              )}
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onNewCategoryModalClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleAddCategory}>
              Add Category
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Category Modal */}
      <Modal isOpen={isEditCategoryModalOpen} onClose={onEditCategoryModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Edit {categoryType === 'account' ? 'Account' : 'Transaction'} Category
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editingCategory && (
              <>
                <FormControl mb={4}>
                  <FormLabel>Category Name</FormLabel>
                  <InputGroup>
                    <Input 
                      value={editingCategory.name} 
                      onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                      placeholder="e.g., Groceries, Utilities, etc."
                      maxLength={100}
                    />
                    <InputRightElement>
                      <Text fontSize="xs" color={textColor}>
                        {editingCategory.name.length}/100
                      </Text>
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
                
                <FormControl mb={4}>
                  <FormLabel>Parent Category</FormLabel>
                  <Select 
                    id="edit-parent-select"
                    placeholder="No parent (top-level category)" 
                    defaultValue={parentCategory || ''}
                    isDisabled={!parentCategory && editingCategory.subcategories && editingCategory.subcategories.length > 0}
                  >
                    {(categoryType === 'account' 
                      ? categories.account_categories 
                      : categories.transaction_categories)
                      .filter(cat => 
                        cat.name !== editingCategory.name && // Can't be its own parent
                        (!cat.subcategories || cat.subcategories.length < 10) // Limit nesting depth
                      )
                      .map((cat, index) => (
                        <option key={index} value={cat.name}>{cat.name}</option>
                      ))
                    }
                  </Select>
                  {!parentCategory && editingCategory.subcategories && editingCategory.subcategories.length > 0 && (
                    <Text fontSize="xs" color="red.500" mt={1}>
                      Categories with subcategories cannot be reassigned until all subcategories are removed
                    </Text>
                  )}
                </FormControl>
                
                {!parentCategory && (
                  <FormControl>
                    <FormLabel>Color</FormLabel>
                    <SimpleGrid columns={5} spacing={2}>
                      {colorOptions.map((color) => (
                        <Box 
                          key={color.value}
                          bg={color.value}
                          w="100%"
                          h="30px"
                          borderRadius="md"
                          cursor="pointer"
                          onClick={() => setEditingCategory({...editingCategory, color: color.value})}
                          border={editingCategory.color === color.value ? "3px solid white" : "1px solid transparent"}
                          boxShadow={editingCategory.color === color.value ? "0 0 0 1px #4299E1" : "none"}
                        />
                      ))}
                    </SimpleGrid>
                  </FormControl>
                )}
                
                {parentCategory && (
                  <Alert status="info" mt={2} mb={4}>
                    <AlertIcon />
                    Subcategories inherit their parent's color
                  </Alert>
                )}
                
                <Box mt={4} p={2} border="1px dashed" borderColor={borderColor} borderRadius="md">
                  <Text fontWeight="bold" mb={2}>Preview</Text>
                  {parentCategory ? (
                    // Preview for subcategory with parent's color
                    <HStack>
                      <Text>└</Text>
                      <Tag 
                        colorScheme={
                          (categoryType === 'account' 
                            ? categories.account_categories 
                            : categories.transaction_categories)
                            .find(cat => cat.name === parentCategory)?.color.split('.')[0] || 'blue'
                        } 
                        size="md"
                      >
                        {editingCategory.name || 'Subcategory Name'}
                      </Tag>
                    </HStack>
                  ) : (
                    // Preview for top-level category with selected color
                    <Tag colorScheme={editingCategory.color.split('.')[0]} size="md">
                      {editingCategory.name || 'Category Name'}
                    </Tag>
                  )}
                </Box>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditCategoryModalClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default Settings 