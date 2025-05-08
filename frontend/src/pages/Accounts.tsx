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
  Spacer
} from '@chakra-ui/react'
import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import { useQuery } from '@tanstack/react-query'
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

// Type for account object from user_accounts table
interface Account {
  sf_account_id: string;
  sf_account_name: string;
  sf_name: string;
  balance: string;
  sf_balance_date: string;
  source: string;
}

// Type for sorting
type SortField = 'sf_account_name' | 'sf_name' | 'balance' | 'sf_balance_date' | 'source';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

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
  const [editedAccountName, setEditedAccountName] = useState('')

  // State for sorting - Default to Balance Z-A
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'balance',
    direction: 'desc'
  })

  // Use React Query for data fetching with caching
  const { data: accounts = [], isLoading, error, refetch } = useQuery({
    queryKey: ['userAccounts', user?.id],
    queryFn: () => session?.access_token ? fetchUserAccounts(session.access_token) : Promise.resolve([]),
    enabled: !!user && !!session?.access_token,
    staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
    refetchOnWindowFocus: false, // Prevent refetch when window gets focus
    refetchOnMount: false, // Prevent refetch on component mount if data exists
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !session) return
    setAdding(true)
    try {
      // Add account directly via API
      const newAccount = {
        sf_account_id: `manual-${Date.now()}-${Math.floor(Math.random() * 10000)}`, // Generate a unique ID
        sf_account_name: form.sf_account_name,
        sf_name: form.sf_name,
        balance: form.balance || '0',
        sf_balance_date: form.sf_balance_date ? Math.floor(new Date(form.sf_balance_date).getTime() / 1000) : Math.floor(Date.now() / 1000)
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

  // Toggle edit mode and set initial value
  const toggleEditMode = () => {
    if (isEditing && selectedAccount) {
      // Here you would handle the actual update - not implemented yet
      // For now just show a toast to indicate it would save
      toast({
        title: "Edit mode",
        description: "This would save the changes (not implemented yet)",
        status: "info",
        duration: 3000
      });
    }
    
    if (!isEditing && selectedAccount) {
      setEditedAccountName(selectedAccount.sf_account_name);
    }
    
    setIsEditing(!isEditing);
  };

  // Sorting function
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

  // Detail modal for mobile view
  const AccountDetailModal = () => {
    if (!selectedAccount) return null;
    
    const amount = parseFloat(selectedAccount.balance || '0');
    const color = amount < 0 ? 'red.500' : amount > 0 ? 'green.500' : textColor;
    const lastUpdated = selectedAccount.sf_balance_date 
      ? new Date(parseInt(selectedAccount.sf_balance_date) * 1000)
      : null;
    
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
                      value={editedAccountName}
                      onChange={(e) => setEditedAccountName(e.target.value)}
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
                  <Text fontSize="xl" fontWeight="bold">{selectedAccount.sf_account_name}</Text>
                )}
              </Box>
              
              <Box>
                <Text fontSize="sm" color={textColor}>Institution</Text>
                <Text fontSize="lg">{selectedAccount.sf_name}</Text>
              </Box>
              
              <Box>
                <Text fontSize="sm" color={textColor}>Balance</Text>
                <Text fontSize="2xl" fontWeight="bold" color={color}>
                  ${amount.toFixed(2)}
                </Text>
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
                <HStack fontSize="xs" color={textColor}>
                  <Text>ID:</Text>
                  <Text fontFamily="monospace">{selectedAccount.sf_account_id}</Text>
                </HStack>
                {selectedAccount.sf_balance_date && (
                  <HStack fontSize="xs" color={textColor} mt={1}>
                    <Text>Timestamp:</Text>
                    <Text fontFamily="monospace">{selectedAccount.sf_balance_date}</Text>
                  </HStack>
                )}
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
    return <Text color={color} fontWeight="medium">${amount.toFixed(2)}</Text>
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
        Sort: {sortConfig.field === 'sf_account_name' ? 'Name' : 
               sortConfig.field === 'sf_name' ? 'Institution' :
               sortConfig.field === 'balance' ? 'Balance' :
               sortConfig.field === 'sf_balance_date' ? 'Date' : 'Source'}
        {' '}
        {sortConfig.direction === 'asc' ? '(A-Z)' : '(Z-A)'}
      </MenuButton>
      <MenuList>
        <MenuItem onClick={() => handleSort('sf_account_name')}>
          Name {sortConfig.field === 'sf_account_name' && (
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

  if (isLoading) return <Spinner />
  if (error) return <Alert status="error"><AlertIcon />{error}</Alert>

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
                      onClick={() => handleSort('sf_account_name')}
                    >
                      <Flex align="center">
                        Name <SortIndicator field="sf_account_name" />
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
                        <Td fontWeight="medium">{acc.sf_account_name}</Td>
                        <Td>{acc.sf_name}</Td>
                        <Td isNumeric>
                          <BalanceDisplay balance={acc.balance} />
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
                        <Td colSpan={6} p={0}>
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
                                              value={editedAccountName}
                                              onChange={(e) => setEditedAccountName(e.target.value)}
                                              fontWeight="bold"
                                              size="md"
                                              autoFocus
                                            />
                                            <InputRightElement>
                                              <CheckIcon color="green.500" />
                                            </InputRightElement>
                                          </InputGroup>
                                        ) : (
                                          <Text fontWeight="bold">{acc.sf_account_name}</Text>
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
                                          ${parseFloat(acc.balance).toFixed(2)}
                                        </Text>
                                      </Box>
                                      
                                      <Box>
                                        <Text fontSize="sm" color={textColor}>Last Updated</Text>
                                        <Text>{formatDateTime(acc.sf_balance_date)}</Text>
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
                                        setEditedAccountName(acc.sf_account_name);
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
                    <Td colSpan={6}>
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
                        {acc.sf_account_name}
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