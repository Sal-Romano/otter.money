import { 
  Box, 
  Grid, 
  Heading, 
  Text, 
  VStack, 
  useColorModeValue, 
  Button, 
  Spinner, 
  Alert, 
  AlertIcon,
  GridItem,
  Flex,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Tooltip,
  useToast
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import CategoryPieChart from '../components/CategoryPieChart'
import { CategoryStructure } from '../components/CategoryManager'
import CurrencyDisplay, { formatCurrency } from '../components/CurrencyDisplay'

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

// Type for user settings
interface UserSettings {
  id: string;
  dark_mode: boolean | null;
  categories?: CategoryStructure;
}

const fetchUserAccounts = async (jwt: string): Promise<Account[]> => {
  const response = await axios.get('/api/v1/user_accounts', {
    headers: {
      Authorization: `Bearer ${jwt}`
    }
  });
  return response.data.accounts || [];
};

const Dashboard = () => {
  const { user, session } = useAuth();
  const userId = user?.id;
  const jwt = session?.access_token;
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [isInCooldown, setIsInCooldown] = useState<boolean>(false);
  const toast = useToast();
  
  // Color scheme consistent with Accounts page
  const cardBg = useColorModeValue('white', 'gray.700');
  const subtleText = useColorModeValue('gray.600', 'gray.400');
  const headerColor = useColorModeValue('blue.600', 'blue.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const tileBg = useColorModeValue('white', 'gray.800');
  const positiveBg = useColorModeValue('green.50', 'green.900');
  const negativeBg = useColorModeValue('red.50', 'red.900');

  // Fetch user accounts
  const { data: accounts = [], isLoading: loadingAccounts } = useQuery<Account[]>({
    queryKey: ['userAccounts', userId],
    queryFn: () => jwt ? fetchUserAccounts(jwt) : Promise.resolve([]),
    enabled: !!userId && !!jwt,
    staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
    refetchOnWindowFocus: false, // Prevent refetch when window gets focus
    refetchOnMount: true, // Ensure fresh data on component mount
  });

  // Fetch user settings with categories
  const { data: userSettings, isLoading: loadingSettings } = useQuery<UserSettings>({
    queryKey: ['userSettings', userId],
    queryFn: async () => {
      if (!session?.access_token || !user) return { id: '', dark_mode: null };
      
      const { data, error } = await supabase
        .from('om_user_settings')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      
      // Ensure we have a valid categories structure
      if (!data.categories || typeof data.categories !== 'object') {
        data.categories = {
          account_categories: [],
          transaction_categories: []
        };
      } else if (Array.isArray(data.categories)) {
        // Handle legacy format
        data.categories = {
          account_categories: data.categories,
          transaction_categories: []
        };
      }
      
      return data;
    },
    enabled: !!user && !!session?.access_token,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Default empty category structure
  const defaultCategories: CategoryStructure = {
    account_categories: [],
    transaction_categories: []
  };

  // Get the categories from user settings or use default
  const categories = userSettings?.categories || defaultCategories;

  // Reset cooldown visual state after delay
  useEffect(() => {
    if (isInCooldown) {
      const timer = setTimeout(() => {
        setIsInCooldown(false);
      }, 30000); // Reset visual state after 30 seconds
      return () => clearTimeout(timer);
    }
  }, [isInCooldown]);

  const { mutate: refreshAccounts, isPending: refreshing } = useMutation({
    mutationFn: async () => {
      setError(null);
      if (!userId || !jwt) {
        setError('No JWT found. Please log in again.');
        return;
      }
      try {
        // Use sync endpoint instead of accounts endpoint
        const response = await axios.get('/api/v1/sync/', {
          headers: {
            Authorization: `Bearer ${jwt}`
          }
        });
        
        // Check if response indicates cooldown
        if (response.data.status === 'cooldown') {
          setIsInCooldown(true);
          toast({
            title: 'Sync Cooldown Active',
            description: response.data.message,
            status: 'warning',
            duration: 6000,
            isClosable: true,
          });
          return;
        }
        
        // If successful sync, reset cooldown state and invalidate queries
        setIsInCooldown(false);
        queryClient.invalidateQueries({ queryKey: ['userAccounts', userId] });
        toast({
          title: 'Accounts Synced',
          description: 'Successfully refreshed account data from SimpleFIN',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (err: any) {
        const errorMessage = err?.response?.data?.detail || err.message || 'Failed to refresh accounts.';
        setError(errorMessage);
        toast({
          title: 'Sync Failed',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  });

  // Calculate summary statistics
  const netWorth = accounts.reduce((sum, account) => {
    const balance = parseFloat(account.balance || '0');
    return sum + balance;
  }, 0);

  const totalAssets = accounts.reduce((sum, account) => {
    const balance = parseFloat(account.balance || '0');
    return balance > 0 ? sum + balance : sum;
  }, 0);

  const totalLiabilities = accounts.reduce((sum, account) => {
    const balance = parseFloat(account.balance || '0');
    return balance < 0 ? sum + Math.abs(balance) : sum;
  }, 0);

  // Find most recent date
  const latestDate = accounts.reduce((latest, account) => {
    if (!account.sf_balance_date) return latest;
    const date = parseInt(account.sf_balance_date);
    return date > latest ? date : latest;
  }, 0);

  const formatDate = (timestamp: number): string => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const isLoading = loadingAccounts || loadingSettings;

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <Box w="100%">
      <VStack align="stretch" spacing={8}>
        <Heading 
          size="lg" 
          mb={6} 
          color={headerColor} 
          borderBottom="2px solid" 
          borderColor={borderColor} 
          pb={2}
        >
          Dashboard
          <Text color={subtleText} fontSize="md" fontWeight="normal" mt={1}>
            Your financial overview
          </Text>
        </Heading>
        
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}
        
        {/* Financial Overview Section */}
        <Box>
          <Flex justify="space-between" align="center" mb={4}>
            <Text fontSize="lg" fontWeight="bold" color={headerColor}>Financial Overview</Text>
            <Tooltip 
              label={
                isInCooldown 
                  ? 'Recently synced. Please wait before syncing again.'
                  : refreshing 
                    ? 'Syncing accounts...'
                    : 'Sync accounts with SimpleFIN'
              }
              placement="top"
            >
              <Button 
                onClick={() => refreshAccounts()} 
                isLoading={refreshing} 
                colorScheme={isInCooldown ? "gray" : "blue"}
                size="sm"
                opacity={isInCooldown ? 0.5 : 1}
                cursor={isInCooldown ? "not-allowed" : "pointer"}
                _hover={isInCooldown ? {} : undefined}
              >
                Refresh
              </Button>
            </Tooltip>
          </Flex>
          
          <Grid 
            templateColumns={{ 
              base: "1fr",
              md: "repeat(2, 1fr)", 
              lg: "repeat(3, 1fr)" 
            }}
            gap={4}
          >
            <GridItem colSpan={{ base: 1, lg: 1 }}>
              <Box 
                bg={netWorth >= 0 ? positiveBg : negativeBg} 
                p={6} 
                rounded="lg" 
                shadow="md" 
                borderWidth="1px" 
                borderColor={borderColor}
                h="100%"
              >
                <Stat>
                  <StatLabel color={subtleText} fontWeight="medium">Net Worth</StatLabel>
                  <StatNumber fontSize="2xl">
                    <CurrencyDisplay 
                      amount={netWorth} 
                      fontWeight="bold" 
                      size="2xl"
                    />
                  </StatNumber>
                  <StatHelpText fontSize="sm">
                    Last updated: {formatDate(latestDate)}
                  </StatHelpText>
                </Stat>
              </Box>
            </GridItem>
            
            <GridItem colSpan={{ base: 1, lg: 1 }}>
              <Box 
                bg={tileBg} 
                p={6} 
                rounded="lg" 
                shadow="md" 
                borderWidth="1px" 
                borderColor={borderColor}
                h="100%"
              >
                <Stat>
                  <StatLabel color={subtleText} fontWeight="medium">Total Assets</StatLabel>
                  <StatNumber fontSize="2xl">
                    <CurrencyDisplay 
                      amount={totalAssets} 
                      fontWeight="bold" 
                      size="2xl"
                    />
                  </StatNumber>
                  <StatHelpText fontSize="sm">
                    Across {accounts.filter(a => parseFloat(a.balance) > 0).length} accounts
                  </StatHelpText>
                </Stat>
              </Box>
            </GridItem>
            
            <GridItem colSpan={{ base: 1, lg: 1 }}>
              <Box 
                bg={tileBg} 
                p={6} 
                rounded="lg" 
                shadow="md" 
                borderWidth="1px" 
                borderColor={borderColor}
                h="100%"
              >
                <Stat>
                  <StatLabel color={subtleText} fontWeight="medium">Total Liabilities</StatLabel>
                  <StatNumber fontSize="2xl">
                    <CurrencyDisplay 
                      amount={totalLiabilities} 
                      fontWeight="bold" 
                      size="2xl"
                    />
                  </StatNumber>
                  <StatHelpText fontSize="sm">
                    Across {accounts.filter(a => parseFloat(a.balance) < 0).length} accounts
                  </StatHelpText>
                </Stat>
              </Box>
            </GridItem>
          </Grid>
        </Box>

        {/* Category Distribution */}
        <Box bg={tileBg} p={6} rounded="lg" shadow="md" borderWidth="1px" borderColor={borderColor}>
          <Text fontSize="lg" fontWeight="bold" color={headerColor} mb={4}>Account Category Distribution</Text>
          <Box maxHeight="400px">
            <CategoryPieChart 
              accounts={accounts} 
              categories={categories}
              height={350}
              title=""
            />
          </Box>
        </Box>
        
        {/* Accounts Summary */}
        <Box bg={tileBg} p={6} rounded="lg" shadow="md" borderWidth="1px" borderColor={borderColor}>
          <Text fontSize="lg" fontWeight="bold" color={headerColor} mb={4}>Accounts Summary</Text>
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
            <GridItem>
              <Text fontWeight="medium" mb={2}>By Source</Text>
              <Flex wrap="wrap" gap={2}>
                {Array.from(new Set(accounts.map(a => a.source))).map(source => (
                  <Badge 
                    key={source} 
                    colorScheme={source === 'manual' ? 'purple' : 'blue'} 
                    p={2} 
                    rounded="md"
                  >
                    {source}: {accounts.filter(a => a.source === source).length}
                  </Badge>
                ))}
              </Flex>
            </GridItem>
            
            <GridItem>
              <Text fontWeight="medium" mb={2}>By Category</Text>
              <Flex wrap="wrap" gap={2}>
                {categories.account_categories.map(category => {
                  const count = accounts.filter(a => 
                    a.category === category.name || 
                    (category.subcategories?.some(sub => sub.name === a.category))
                  ).length;
                  
                  if (count === 0) return null;
                  
                  return (
                    <Badge 
                      key={category.name} 
                      colorScheme={category.color.split('.')[0]} 
                      p={2} 
                      rounded="md"
                    >
                      {category.name}: {count}
                    </Badge>
                  );
                })}
                
                {accounts.filter(a => !a.category).length > 0 && (
                  <Badge 
                    colorScheme="red" 
                    p={2} 
                    rounded="md"
                  >
                    Uncategorized: {accounts.filter(a => !a.category).length}
                  </Badge>
                )}
              </Flex>
            </GridItem>
          </Grid>
        </Box>
      </VStack>
    </Box>
  );
};

export default Dashboard; 