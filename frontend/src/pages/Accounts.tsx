import { 
  Box, 
  Heading, 
  Text, 
  useColorModeValue, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  Spinner, 
  Alert, 
  AlertIcon, 
  Input, 
  Button, 
  VStack, 
  useToast, 
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Flex,
  IconButton,
  useBreakpointValue,
  Hide,
  Card,
  CardHeader,
  CardBody,
  Stack,
  Badge,
  Show,
  SimpleGrid,
  Collapse,
  Divider,
  HStack,
  ModalFooter,
  Grid,
  GridItem,
  SlideFade,
  InputGroup,
  InputRightElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Portal,
  Spacer,
  FormControl,
  Tag
} from '@chakra-ui/react'
import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  AddIcon, 
  ChevronDownIcon, 
  ChevronUpIcon, 
  EditIcon, 
  CheckIcon,
  TriangleUpIcon,
  TriangleDownIcon,
  ArrowUpDownIcon,
  CloseIcon
} from '@chakra-ui/icons'
import { supabase } from '../lib/supabase'
import ScrollableArea, { scrollbarStyle } from '../components/ScrollableArea'

// Type for account object from user_accounts table
interface Account {
  sf_account_id: string;
  sf_account_name: string;
  display_name: string | null;
  sf_name: string;
  balance: string;
  sf_balance_date: string;
  source: string;
  category?: string | null;
}

// Update types to match the new category structure
interface Category {
  name: string;
  color: string;
  subcategories?: Category[];
}

interface CategoryStructure {
  account_categories: Category[];
  transaction_categories: Category[];
}

// Change the getCategoryColor function to work with the new structure
const getCategoryColor = (categoryName: string | undefined | null, categoryStructure: CategoryStructure): string => {
  if (!categoryName) return 'red.500'; // Default for "Uncategorized"
  
  // Check in top-level account categories
  const category = categoryStructure.account_categories.find(cat => cat.name === categoryName);
  if (category) return category.color;
  
  // Check in subcategories
  for (const parentCat of categoryStructure.account_categories) {
    if (parentCat.subcategories) {
      const subcat = parentCat.subcategories.find(sub => sub.name === categoryName);
      if (subcat) return subcat.color;
    }
  }
  
  return 'red.500'; // Default fallback
};

// Currency formatter for consistent display
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Type for sorting
type SortField = 'display_name' | 'sf_name' | 'balance' | 'sf_balance_date' | 'source' | 'category';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

// Add this function to get Account name (display_name with fallback to sf_account_name)
const getAccountName = (account: Account): string => {
  return account.display_name || account.sf_account_name || 'Unnamed Account';
};

// Fetch accounts function for React Query
const fetchUserAccounts = async (jwt: string): Promise<Account[]> => {
  const response = await axios.get('/api/v1/user_accounts', {
    headers: {
      Authorization: `Bearer ${jwt}`
    }
  });
  return response.data.accounts || [];
};

const Accounts = () => {
  const queryClient = useQueryClient();
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const cardBg = useColorModeValue('white', 'gray.700')
  const tableBg = useColorModeValue('white', 'gray.800')
  const headerBg = useColorModeValue('blue.50', 'blue.900')
  const headerColor = useColorModeValue('blue.600', 'blue.200')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBg = useColorModeValue('gray.100', 'gray.700')
  const expandedBg = useColorModeValue('gray.50', 'gray.750')
  const sectionBg = useColorModeValue('gray.100', 'gray.700')
  
  const { user, session } = useAuth()
  const [form, setForm] = useState({
    sf_account_name: '',
    sf_name: '',
    balance: '',
    sf_balance_date: ''
  })
  const [adding, setAdding] = useState(false)
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const isMobile = useBreakpointValue({ base: true, md: false })
  
  // State for expanded rows (desktop)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  
  // State for detail modal (mobile)
  const {
    isOpen: isDetailModalOpen,
    onOpen: onOpenDetailModal,
    onClose: onCloseDetailModal
  } = useDisclosure()
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  
  // State for editing
  const [isEditing, setIsEditing] = useState(false)
  const [editedDisplayName, setEditedDisplayName] = useState('')

  // State for sorting - Default to Balance Z-A
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'balance',
    direction: 'desc'
  })

  // Add state for categories
  const [categories, setCategories] = useState<CategoryStructure>({
    account_categories: [],
    transaction_categories: []
  })
  
  // Fix the React Query linter error by removing the callback and using useEffect
  const { data: userSettings } = useQuery({
    queryKey: ['userSettings', user?.id],
    queryFn: async () => {
      if (!session?.access_token || !user) return null;
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!session?.access_token,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  // Use useEffect to process the categories when userSettings changes
  useEffect(() => {
    if (userSettings?.categories) {
      if (typeof userSettings.categories === 'object' && 
          'account_categories' in userSettings.categories &&
          'transaction_categories' in userSettings.categories) {
        // New structure
        setCategories(userSettings.categories as CategoryStructure);
      } else if (Array.isArray(userSettings.categories)) {
        // Legacy structure
        setCategories({
          account_categories: userSettings.categories as Category[],
          transaction_categories: []
        });
      }
    }
  }, [userSettings]);

  // Fix the handleCategoryChange function to update React Query cache directly
  const handleCategoryChange = async (accountId: string, categoryName: string | null) => {
    if (!user || !session) return;
    
    try {
      // Update the database
      const { error } = await supabase
        .from('user_accounts')
        .update({ 
          category: categoryName 
        })
        .eq('sf_account_id', accountId);
          
      if (error) throw error;
      
      // Update selected account in state immediately
      if (selectedAccount && selectedAccount.sf_account_id === accountId) {
        setSelectedAccount({
          ...selectedAccount,
          category: categoryName
        });
      }
      
      // Update the React Query cache directly for immediate UI updates
      queryClient.setQueryData<Account[]>(['userAccounts', user.id], (oldData = []) => {
        return oldData.map(acc => {
          if (acc.sf_account_id === accountId) {
            return {
              ...acc,
              category: categoryName
            };
          }
          return acc;
        });
      });
      
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

  // Use React Query for data fetching with caching
  const { data: accounts = [], isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['userAccounts', user?.id],
    queryFn: () => session?.access_token ? fetchUserAccounts(session.access_token) : Promise.resolve([]),
    enabled: !!user && !!session?.access_token,
    staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes (previously called cacheTime)
    refetchOnWindowFocus: false, 
    refetchOnMount: true,  // Ensure fresh data when component mounts
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // In the handleAddAccount function, add display_name and set sf_account_name to null for manual accounts
  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !session) return
    setAdding(true)
    try {
      // Add account directly via API
      const newAccount = {
        sf_account_id: `manual-${Date.now()}-${Math.floor(Math.random() * 10000)}`, // Generate a unique ID
        sf_account_name: null, // Set to null for manual accounts
        display_name: form.sf_account_name, // Use the form input as display_name
        sf_name: form.sf_name,
        balance: form.balance || '0',
        sf_balance_date: form.sf_balance_date ? Math.floor(new Date(form.sf_balance_date).getTime() / 1000) : Math.floor(Date.now() / 1000),
        source: 'manual'
      }
      
      await axios.post(`/api/v1/user_accounts?user_id=${user.id}`, newAccount, {
        headers: { 
          Authorization: `Bearer ${session.access_token}` 
        }
      })
      
      // Refresh accounts list
      refetch();
      
      // Reset form
      setForm({ sf_account_name: '', sf_name: '', balance: '', sf_balance_date: '' })
      toast({ title: 'Account added!', status: 'success', duration: 3000 })
      onClose()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to add account.', status: 'error', duration: 5000 })
    } finally {
      setAdding(false)
    }
  }

  // Fix the handleUpdateDisplayName function to update React Query cache directly
  const handleUpdateDisplayName = async (accountId: string, newDisplayName: string) => {
    if (!user || !session) return;
    
    try {
      // Update the database
      const { error } = await supabase
        .from('user_accounts')
        .update({ 
          display_name: newDisplayName 
        })
        .eq('sf_account_id', accountId);
        
      if (error) throw error;
      
      // Update selected account in state immediately
      if (selectedAccount && selectedAccount.sf_account_id === accountId) {
        setSelectedAccount({
          ...selectedAccount,
          display_name: newDisplayName
        });
      }
      
      // Update the React Query cache directly for immediate UI updates
      queryClient.setQueryData<Account[]>(['userAccounts', user.id], (oldData = []) => {
        return oldData.map(acc => {
          if (acc.sf_account_id === accountId) {
            return {
              ...acc,
              display_name: newDisplayName
            };
          }
          return acc;
        });
      });
      
      toast({
        title: 'Account name updated',
        status: 'success',
        duration: 3000,
      });
      
      // Exit edit mode
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: 'Error updating account name',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  // Toggle edit mode and set initial value
  const toggleEditMode = () => {
    if (isEditing && selectedAccount) {
      // Save changes
      handleUpdateDisplayName(selectedAccount.sf_account_id, editedDisplayName);
    } else if (!isEditing && selectedAccount) {
      // Set the current value when entering edit mode
      setEditedDisplayName(getAccountName(selectedAccount));
    }
    
    // Toggle edit mode
    setIsEditing(!isEditing);
  };

  // Sorting function - update to use display_name and add category
  const sortAccounts = (accounts: Account[]): Account[] => {
    const { field, direction } = sortConfig;
    return [...accounts].sort((a, b) => {
      // Special case for balance which needs to be parsed as a number
      if (field === 'balance') {
        const aVal = parseFloat(a[field] || '0');
        const bVal = parseFloat(b[field] || '0');
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      // Special case for date which needs to be parsed from UNIX timestamp
      if (field === 'sf_balance_date') {
        const aVal = parseInt(a[field] || '0');
        const bVal = parseInt(b[field] || '0');
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      // Special case for display_name with fallback
      if (field === 'display_name') {
        const aVal = getAccountName(a);
        const bVal = getAccountName(b);
        return direction === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      // Special case for category which might be undefined or null
      if (field === 'category') {
        const aVal = a[field] || 'Uncategorized';
        const bVal = b[field] || 'Uncategorized';
        return direction === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      // General case for string fields
      const aVal = a[field] || '';
      const bVal = b[field] || '';
      return direction === 'asc' 
        ? aVal.localeCompare(bVal) 
        : bVal.localeCompare(aVal);
    });
  };

  // Handle sorting
  const handleSort = (field: SortField) => {
    setSortConfig(prevConfig => {
      if (prevConfig.field === field) {
        // Toggle direction if same field
        return {
          ...prevConfig,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        };
      } else {
        // New field, default to ascending
        return {
          field,
          direction: 'asc'
        };
      }
    });
  };

  // Sort indicator component
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDownIcon ml={1} boxSize={3} opacity={0.5} />;
    }
    
    return sortConfig.direction === 'asc' 
      ? <TriangleUpIcon ml={1} boxSize={3} /> 
      : <TriangleDownIcon ml={1} boxSize={3} />;
  };

  // Add Account Modal Form
  const AddAccountModal = () => (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Manual Account</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <form onSubmit={handleAddAccount}>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text mb={1}>Account Name</Text>
                <Input 
                  name="sf_account_name" 
                  value={form.sf_account_name} 
                  onChange={handleInputChange} 
                  placeholder="Checking Account" 
                  required
                />
              </Box>
              
              <Box>
                <Text mb={1}>Bank / Institution</Text>
                <Input 
                  name="sf_name" 
                  value={form.sf_name} 
                  onChange={handleInputChange} 
                  placeholder="My Bank" 
                  required
                />
              </Box>
              
              <Box>
                <Text mb={1}>Balance</Text>
                <Input 
                  name="balance" 
                  value={form.balance} 
                  onChange={handleInputChange} 
                  placeholder="1000.00" 
                  type="number" 
                  step="0.01"
                  required
                />
              </Box>
              
              <Box>
                <Text mb={1}>Date (Optional)</Text>
                <Input 
                  name="sf_balance_date" 
                  value={form.sf_balance_date} 
                  onChange={handleInputChange} 
                  type="date"
                />
              </Box>
              
              <Button type="submit" colorScheme="blue" isLoading={adding} width="full">
                Add Account
              </Button>
            </VStack>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  )

  // Update the renderCategoryTree function to use our ScrollableArea component
  const renderCategoryTree = () => {
    return (
      <Box mt={2}>
        <FormControl>
          <ScrollableArea maxHeight="300px" pr={1}>
            <VStack align="stretch" spacing={2} p={1}>
              <Button 
                variant={!selectedAccount?.category ? "solid" : "outline"}
                colorScheme="red"
                size="sm"
                onClick={() => selectedAccount && handleCategoryChange(selectedAccount.sf_account_id, null)}
                justifyContent="flex-start"
                px={3}
              >
                Uncategorized
              </Button>
              
              <Divider />
              
              {/* Render top-level account categories */}
              {categories.account_categories.map((category, index) => (
                <Box key={index}>
                  <Button 
                    variant={selectedAccount?.category === category.name ? "solid" : "outline"}
                    colorScheme={category.color.split('.')[0]}
                    size="sm"
                    onClick={() => selectedAccount && handleCategoryChange(selectedAccount.sf_account_id, category.name)}
                    justifyContent="flex-start"
                    width="100%"
                    mb={category.subcategories && category.subcategories.length > 0 ? 1 : 2}
                  >
                    {category.name}
                  </Button>
                  
                  {/* Render subcategories if any */}
                  {category.subcategories && category.subcategories.length > 0 && (
                    <VStack align="stretch" pl={4} spacing={1} mb={2}>
                      {category.subcategories.map((subcat, subIndex) => (
                        <Button 
                          key={`${category.name}-${subcat.name}-${subIndex}`}
                          variant={selectedAccount?.category === subcat.name ? "solid" : "outline"}
                          colorScheme={category.color.split('.')[0]}
                          size="xs"
                          onClick={() => selectedAccount && handleCategoryChange(selectedAccount.sf_account_id, subcat.name)}
                          justifyContent="flex-start"
                        >
                          └ {subcat.name}
                        </Button>
                      ))}
                    </VStack>
                  )}
                </Box>
              ))}
            </VStack>
          </ScrollableArea>
        </FormControl>
      </Box>
    );
  };

  // Update AccountDetailModal to use tree display for categories and edit display_name
  const AccountDetailModal = () => {
    if (!selectedAccount) return null;
    
    const amount = parseFloat(selectedAccount.balance || '0');
    const color = amount < 0 ? 'red.500' : amount > 0 ? 'green.500' : textColor;
    const lastUpdated = selectedAccount.sf_balance_date 
      ? new Date(parseInt(selectedAccount.sf_balance_date) * 1000)
      : null;
    
    // Get the category color
    const categoryName = selectedAccount.category || 'Uncategorized';
    const categoryColor = getCategoryColor(selectedAccount.category, categories);
    
    // Render category tree for selection in edit mode - use the shared renderCategoryTree function
    
    return (
      <Modal 
        isOpen={isDetailModalOpen} 
        onClose={() => {
          setIsEditing(false);
          onCloseDetailModal();
        }} 
        size="full"
        motionPreset="slideInBottom"
      >
        <ModalOverlay />
        <ModalContent marginTop="60px">
          <ModalHeader 
            bg={headerBg} 
            color={headerColor}
            borderBottom="1px solid"
            borderColor={borderColor}
            pr={12} // Add padding for the close button
          >
            <Flex justifyContent="space-between" alignItems="center">
              Account Details
              <IconButton
                aria-label="Close modal"
                icon={<CloseIcon />}
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  onCloseDetailModal();
                }}
              />
            </Flex>
          </ModalHeader>
          <ModalBody>
            <VStack spacing={6} align="stretch" p={2}>
              <Box>
                <Text fontSize="sm" color={textColor}>Account Name</Text>
                {isEditing ? (
                  <InputGroup size="lg">
                    <Input 
                      value={editedDisplayName}
                      onChange={(e) => setEditedDisplayName(e.target.value)}
                      fontWeight="bold"
                      variant="flushed"
                      pl={0}
                      autoFocus
                    />
                    <InputRightElement>
                      <CheckIcon color="green.500" />
                    </InputRightElement>
                  </InputGroup>
                ) : (
                  <Text fontSize="xl" fontWeight="bold">{getAccountName(selectedAccount)}</Text>
                )}
              </Box>
              
              <Box>
                <Text fontSize="sm" color={textColor}>Institution</Text>
                <Text fontSize="lg">{selectedAccount.sf_name}</Text>
              </Box>
              
              <Box>
                <Text fontSize="sm" color={textColor}>Balance</Text>
                <Text fontSize="2xl" fontWeight="bold" color={color}>
                  {formatCurrency(amount)}
                </Text>
              </Box>
              
              <Box>
                <Text fontSize="sm" color={textColor}>Category</Text>
                {isEditing ? renderCategoryTree() : (
                  <Tag colorScheme={categoryColor.split('.')[0]} size="md" mt={1}>
                    {categoryName}
                  </Tag>
                )}
              </Box>
              
              <Box>
                <Text fontSize="sm" color={textColor}>Source</Text>
                <Badge colorScheme={selectedAccount.source === 'manual' ? 'purple' : 'blue'}>
                  {selectedAccount.source}
                </Badge>
              </Box>
              
              {lastUpdated && (
                <Box>
                  <Text fontSize="sm" color={textColor}>Last Updated</Text>
                  <Text>
                    {lastUpdated.toLocaleDateString()} {lastUpdated.toLocaleTimeString()}
                  </Text>
                </Box>
              )}
              
              <Divider />
              
              <Box 
                p={3} 
                bg={sectionBg} 
                borderRadius="md"
              >
                <Text fontSize="sm" fontWeight="bold" color={textColor} mb={2}>Technical Details</Text>
                <VStack align="stretch" spacing={2} fontSize="xs" color={textColor}>
                  <HStack>
                    <Text>ID:</Text>
                    <Text fontFamily="monospace">{selectedAccount.sf_account_id}</Text>
                  </HStack>
                  
                  {selectedAccount.sf_account_name && (
                    <HStack>
                      <Text>Original Name:</Text>
                      <Text fontFamily="monospace">{selectedAccount.sf_account_name}</Text>
                    </HStack>
                  )}
                  
                  {selectedAccount.sf_balance_date && (
                    <HStack>
                      <Text>Timestamp:</Text>
                      <Text fontFamily="monospace">{selectedAccount.sf_balance_date}</Text>
                    </HStack>
                  )}
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
        </ModalContent>

        {/* Edit floating button - Note increased zIndex and portal usage */}
        <Portal>
          <IconButton
            aria-label="Edit account"
            icon={isEditing ? <CheckIcon /> : <EditIcon />}
            size="lg"
            colorScheme={isEditing ? "green" : "blue"}
            borderRadius="full"
            position="fixed"
            bottom="4"
            right="4"
            shadow="lg"
            onClick={toggleEditMode}
            zIndex={2000} // Higher than modal's zIndex
          />
        </Portal>
      </Modal>
    );
  };

  // Format date with time
  const formatDateTime = (unixTimestamp: string) => {
    if (!unixTimestamp) return '';
    const date = new Date(parseInt(unixTimestamp) * 1000);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  // Balance display with positive/negative color
  const BalanceDisplay = ({ balance }: { balance: string }) => {
    const amount = parseFloat(balance || '0')
    const color = amount < 0 ? 'red.500' : amount > 0 ? 'green.500' : textColor
    return <Text color={color} fontWeight="medium">{formatCurrency(amount)}</Text>
  }

  // Handle row click for desktop
  const handleRowClick = (accountId: string) => {
    if (expandedRow === accountId) {
      setExpandedRow(null);
    } else {
      setExpandedRow(accountId);
    }
  };

  // Handle card click for mobile
  const handleCardClick = (account: Account) => {
    setSelectedAccount(account);
    setIsEditing(false);  // Reset editing state
    onOpenDetailModal();
  };

  // Mobile sort menu
  const MobileSortMenu = () => (
    <Menu>
      <MenuButton 
        as={Button} 
        rightIcon={<ChevronDownIcon />} 
        size="sm" 
        colorScheme="blue"
        variant="outline"
        mb={4}
        mt={1}
        leftIcon={<ArrowUpDownIcon />}
      >
        Sort: {sortConfig.field === 'display_name' ? 'Name' : 
               sortConfig.field === 'sf_name' ? 'Institution' :
               sortConfig.field === 'balance' ? 'Balance' :
               sortConfig.field === 'sf_balance_date' ? 'Date' :
               sortConfig.field === 'category' ? 'Category' : 'Source'}
        {' '}
        {sortConfig.direction === 'asc' ? '(A-Z)' : '(Z-A)'}
      </MenuButton>
      <MenuList>
        <MenuItem onClick={() => handleSort('display_name')}>
          Name {sortConfig.field === 'display_name' && (
            sortConfig.direction === 'asc' ? <TriangleUpIcon ml={2} /> : <TriangleDownIcon ml={2} />
          )}
        </MenuItem>
        <MenuItem onClick={() => handleSort('sf_name')}>
          Institution {sortConfig.field === 'sf_name' && (
            sortConfig.direction === 'asc' ? <TriangleUpIcon ml={2} /> : <TriangleDownIcon ml={2} />
          )}
        </MenuItem>
        <MenuItem onClick={() => handleSort('balance')}>
          Balance {sortConfig.field === 'balance' && (
            sortConfig.direction === 'asc' ? <TriangleUpIcon ml={2} /> : <TriangleDownIcon ml={2} />
          )}
        </MenuItem>
        <MenuItem onClick={() => handleSort('sf_balance_date')}>
          Date {sortConfig.field === 'sf_balance_date' && (
            sortConfig.direction === 'asc' ? <TriangleUpIcon ml={2} /> : <TriangleDownIcon ml={2} />
          )}
        </MenuItem>
        <MenuItem onClick={() => handleSort('category')}>
          Category {sortConfig.field === 'category' && (
            sortConfig.direction === 'asc' ? <TriangleUpIcon ml={2} /> : <TriangleDownIcon ml={2} />
          )}
        </MenuItem>
        <MenuItem onClick={() => handleSort('source')}>
          Source {sortConfig.field === 'source' && (
            sortConfig.direction === 'asc' ? <TriangleUpIcon ml={2} /> : <TriangleDownIcon ml={2} />
          )}
        </MenuItem>
      </MenuList>
    </Menu>
  );

  // Get sorted accounts
  const sortedAccounts = sortAccounts(accounts);

  // Add a CategoryDisplay component to render in the table
  const CategoryDisplay = ({ category }: { category?: string | null }) => {
    const categoryName = category || 'Uncategorized';
    const categoryColor = getCategoryColor(category, categories).split('.')[0];
    
    return (
      <Tag colorScheme={categoryColor} size="sm">
        {categoryName}
      </Tag>
    );
  };

  if (isLoading) return <Spinner />
  if (queryError) return <Alert status="error"><AlertIcon />{queryError.message}</Alert>

  return (
    <Box position="relative" pb={16}>
      <Heading size="lg" mb={6} color={headerColor} borderBottom="2px solid" borderColor={borderColor} pb={2}>
        Accounts
      </Heading>
      
      {accounts.length === 0 ? (
        <Box>
          <Text color={textColor} mt={4}>No accounts found.</Text>
          <Button mt={4} colorScheme="blue" onClick={onOpen}>Add Your First Account</Button>
        </Box>
      ) : (
        <>
          {/* Mobile Sort Menu */}
          <Show below="md">
            <MobileSortMenu />
          </Show>

          {/* Desktop Table View */}
          <Hide below="md">
            <Box bg={tableBg} rounded="lg" shadow="md" mt={4} overflow="hidden" borderWidth="1px" borderColor={borderColor}>
              <Table variant="simple">
                <Thead bg={headerBg}>
                  <Tr>
                    <Th 
                      color={headerColor} 
                      fontWeight="bold" 
                      fontSize="md"
                      cursor="pointer"
                      onClick={() => handleSort('display_name')}
                    >
                      <Flex align="center">
                        Name <SortIndicator field="display_name" />
                      </Flex>
                    </Th>
                    <Th 
                      color={headerColor} 
                      fontWeight="bold" 
                      fontSize="md"
                      cursor="pointer"
                      onClick={() => handleSort('sf_name')}
                    >
                      <Flex align="center">
                        Institution <SortIndicator field="sf_name" />
                      </Flex>
                    </Th>
                    <Th 
                      color={headerColor} 
                      fontWeight="bold" 
                      fontSize="md" 
                      isNumeric
                      cursor="pointer"
                      onClick={() => handleSort('balance')}
                    >
                      <Flex justify="flex-end" align="center">
                        Balance <SortIndicator field="balance" />
                      </Flex>
                    </Th>
                    <Th 
                      color={headerColor} 
                      fontWeight="bold" 
                      fontSize="md"
                      cursor="pointer"
                      onClick={() => handleSort('category')}
                    >
                      <Flex align="center">
                        Category <SortIndicator field="category" />
                      </Flex>
                    </Th>
                    <Th 
                      color={headerColor} 
                      fontWeight="bold" 
                      fontSize="md"
                      cursor="pointer"
                      onClick={() => handleSort('sf_balance_date')}
                    >
                      <Flex align="center">
                        Date <SortIndicator field="sf_balance_date" />
                      </Flex>
                    </Th>
                    <Th 
                      color={headerColor} 
                      fontWeight="bold" 
                      fontSize="md"
                      cursor="pointer"
                      onClick={() => handleSort('source')}
                    >
                      <Flex align="center">
                        Source <SortIndicator field="source" />
                      </Flex>
                    </Th>
                    <Th width="40px"></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {sortedAccounts.map((acc) => (
                    <>
                      <Tr 
                        key={acc.sf_account_id}
                        _hover={{ bg: hoverBg }}
                        transition="background-color 0.2s"
                        cursor="pointer"
                        onClick={() => handleRowClick(acc.sf_account_id)}
                      >
                        <Td fontWeight="medium">{getAccountName(acc)}</Td>
                        <Td>{acc.sf_name}</Td>
                        <Td isNumeric>
                          <BalanceDisplay balance={acc.balance} />
                        </Td>
                        <Td>
                          <CategoryDisplay category={acc.category} />
                        </Td>
                        <Td>{acc.sf_balance_date ? new Date(parseInt(acc.sf_balance_date) * 1000).toLocaleDateString() : ''}</Td>
                        <Td>
                          <Badge colorScheme={acc.source === 'manual' ? 'purple' : 'blue'}>
                            {acc.source}
                          </Badge>
                        </Td>
                        <Td>
                          {expandedRow === acc.sf_account_id ? 
                            <ChevronUpIcon /> : 
                            <ChevronDownIcon />
                          }
                        </Td>
                      </Tr>
                      <Tr>
                        <Td colSpan={7} p={0}>
                          <Collapse in={expandedRow === acc.sf_account_id} animateOpacity>
                            <SlideFade in={expandedRow === acc.sf_account_id} offsetY="20px">
                              <Box 
                                bg={expandedBg} 
                                p={4} 
                                borderTop="1px solid" 
                                borderColor={borderColor}
                                position="relative"
                              >
                                <Grid 
                                  templateColumns="repeat(12, 1fr)" 
                                  gap={4}
                                >
                                  <GridItem colSpan={{ base: 12, lg: 4 }}>
                                    <Stack spacing={3}>
                                      <Box>
                                        <Text fontSize="sm" color={textColor}>Account Name</Text>
                                        {expandedRow === acc.sf_account_id && isEditing ? (
                                          <InputGroup>
                                            <Input 
                                              value={editedDisplayName}
                                              onChange={(e) => setEditedDisplayName(e.target.value)}
                                              fontWeight="bold"
                                              size="md"
                                              autoFocus
                                            />
                                            <InputRightElement>
                                              <CheckIcon color="green.500" />
                                            </InputRightElement>
                                          </InputGroup>
                                        ) : (
                                          <Text fontWeight="bold">{getAccountName(acc)}</Text>
                                        )}
                                      </Box>
                                      
                                      <Box>
                                        <Text fontSize="sm" color={textColor}>Institution</Text>
                                        <Text>{acc.sf_name}</Text>
                                      </Box>
                                    </Stack>
                                  </GridItem>
                                  
                                  <GridItem colSpan={{ base: 12, lg: 4 }}>
                                    <Stack spacing={3}>
                                      <Box>
                                        <Text fontSize="sm" color={textColor}>Balance</Text>
                                        <Text fontSize="xl" fontWeight="bold" color={
                                          parseFloat(acc.balance) < 0 ? 'red.500' : 
                                          parseFloat(acc.balance) > 0 ? 'green.500' : textColor
                                        }>
                                          {formatCurrency(parseFloat(acc.balance))}
                                        </Text>
                                      </Box>
                                      
                                      <Box>
                                        <Text fontSize="sm" color={textColor}>Category</Text>
                                        {expandedRow === acc.sf_account_id && isEditing ? (
                                          renderCategoryTree()
                                        ) : (
                                          <CategoryDisplay category={acc.category} />
                                        )}
                                      </Box>
                                    </Stack>
                                  </GridItem>
                                  
                                  <GridItem colSpan={{ base: 12, lg: 4 }}>
                                    <Box p={3} bg={sectionBg} borderRadius="md" height="100%">
                                      <Text fontSize="sm" fontWeight="bold" color={textColor} mb={2}>
                                        Technical Details
                                      </Text>
                                      <Stack spacing={2}>
                                        <Box>
                                          <Text fontSize="xs" color={textColor}>ID:</Text>
                                          <Text fontSize="xs" fontFamily="monospace" overflowX="auto">
                                            {acc.sf_account_id}
                                          </Text>
                                        </Box>
                                        
                                        {acc.sf_account_name && (
                                          <Box>
                                            <Text fontSize="xs" color={textColor}>Original Name:</Text>
                                            <Text fontSize="xs" fontFamily="monospace" overflowX="auto">
                                              {acc.sf_account_name}
                                            </Text>
                                          </Box>
                                        )}
                                        
                                        <Box>
                                          <Text fontSize="xs" color={textColor}>Source:</Text>
                                          <Badge colorScheme={acc.source === 'manual' ? 'purple' : 'blue'} fontSize="xs">
                                            {acc.source}
                                          </Badge>
                                        </Box>
                                        
                                        <Box>
                                          <Text fontSize="xs" color={textColor}>Unix Timestamp:</Text>
                                          <Text fontSize="xs" fontFamily="monospace">
                                            {acc.sf_balance_date || 'N/A'}
                                          </Text>
                                        </Box>
                                      </Stack>
                                    </Box>
                                  </GridItem>
                                </Grid>
                                
                                {/* Edit button for desktop moved to bottom left */}
                                <Flex mt={4} borderTop="1px dashed" borderColor={borderColor} pt={3}>
                                  <IconButton
                                    aria-label="Edit account"
                                    icon={isEditing ? <CheckIcon /> : <EditIcon />}
                                    size="sm"
                                    colorScheme={isEditing ? "green" : "blue"}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (expandedRow === acc.sf_account_id) {
                                        setSelectedAccount(acc);
                                        setEditedDisplayName(getAccountName(acc));
                                        toggleEditMode();
                                      }
                                    }}
                                  />
                                  <Spacer />
                                </Flex>
                              </Box>
                            </SlideFade>
                          </Collapse>
                        </Td>
                      </Tr>
                    </>
                  ))}
                  <Tr 
                    _hover={{ bg: hoverBg, cursor: 'pointer' }}
                    onClick={onOpen}
                    bg={useColorModeValue('gray.50', 'gray.700')}
                  >
                    <Td colSpan={7}>
                      <Flex alignItems="center" justifyContent="center" py={2}>
                        <AddIcon mr={2} />
                        <Text fontWeight="medium">Add New Account</Text>
                      </Flex>
                    </Td>
                  </Tr>
                </Tbody>
              </Table>
            </Box>
          </Hide>

          {/* Mobile Card View */}
          <Show below="md">
            <SimpleGrid columns={1} spacing={4} mt={4}>
              {sortedAccounts.map((acc) => (
                <Card 
                  key={acc.sf_account_id} 
                  bg={cardBg} 
                  shadow="md" 
                  borderRadius="lg" 
                  overflow="hidden"
                  onClick={() => handleCardClick(acc)}
                  cursor="pointer"
                  _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                  transition="all 0.2s"
                >
                  <CardHeader bg={headerBg} py={3} px={4}>
                    <Flex justifyContent="space-between" alignItems="center">
                      <Text fontWeight="bold" color={headerColor} isTruncated maxW="70%">
                        {getAccountName(acc)}
                      </Text>
                    </Flex>
                  </CardHeader>
                  <CardBody py={3} px={4}>
                    <Stack spacing={2}>
                      <Flex justify="space-between">
                        <Text fontSize="sm" color={textColor}>Institution:</Text>
                        <Text fontSize="sm" fontWeight="medium">{acc.sf_name}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontSize="sm" color={textColor}>Balance:</Text>
                        <BalanceDisplay balance={acc.balance} />
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontSize="sm" color={textColor}>Date:</Text>
                        <Text fontSize="sm">
                          {acc.sf_balance_date ? new Date(parseInt(acc.sf_balance_date) * 1000).toLocaleDateString() : ''}
                        </Text>
                      </Flex>
                    </Stack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </Show>
        </>
      )}

      {/* Floating action button for mobile */}
      {isMobile && (
        <IconButton
          aria-label="Add account"
          icon={<AddIcon />}
          size="lg"
          colorScheme="blue"
          borderRadius="full"
          position="fixed"
          bottom="4"
          right="4"
          shadow="lg"
          onClick={onOpen}
          zIndex={1000}
        />
      )}

      <AddAccountModal />
      <AccountDetailModal />
    </Box>
  )
}

export default Accounts 