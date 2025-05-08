import { Box, Grid, Heading, Text, VStack, useColorModeValue, Button, Spinner, Alert, AlertIcon } from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'

// Type for account object from user_accounts table
interface Account {
  sf_account_id: string;
  sf_account_name: string;
  sf_name: string;
  balance: string;
  sf_balance_date: string;
  source: string;
}

// Currency formatter for consistent display
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

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
  
  // Color scheme consistent with Accounts page
  const cardBg = useColorModeValue('white', 'gray.700');
  const subtleText = useColorModeValue('gray.600', 'gray.400');
  const headerColor = useColorModeValue('blue.600', 'blue.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const tileBg = useColorModeValue('white', 'gray.800');

  const { data: accounts, isLoading } = useQuery<Account[]>({
    queryKey: ['userAccounts', userId],
    queryFn: () => jwt ? fetchUserAccounts(jwt) : Promise.resolve([]),
    enabled: !!userId && !!jwt,
    staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
    refetchOnWindowFocus: false, // Prevent refetch when window gets focus
    refetchOnMount: false, // Prevent refetch on component mount if data exists
  });

  const { mutate: refreshAccounts, isPending: refreshing } = useMutation({
    mutationFn: async () => {
      setError(null);
      if (!userId || !jwt) {
        setError('No JWT found. Please log in again.');
        return;
      }
      try {
        // Fetch fresh data from API
        await axios.get('/api/v1/accounts', {
          headers: {
            Authorization: `Bearer ${jwt}`
          }
        });
        // Invalidate query to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['userAccounts', userId] });
      } catch (err: any) {
        setError(err?.response?.data?.error || err.message || 'Failed to refresh accounts.');
      }
    }
  });

  const netWorth = accounts
    ? accounts.reduce((sum: number, account: Account) => {
        const balance = parseFloat(account.balance || '0');
        return sum + balance;
      }, 0)
    : 0;

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
        
        <Grid 
          templateColumns={{ 
            base: "1fr",
            md: "repeat(2, 1fr)", 
            lg: "repeat(3, 1fr)" 
          }}
          gap={6}
        >
          <Box bg={tileBg} p={6} rounded="lg" shadow="md" borderWidth="1px" borderColor={borderColor}>
            <Text color={subtleText} mb={2} fontWeight="medium">Net Worth</Text>
            <Heading size="lg" color={netWorth >= 0 ? "green.500" : "red.500"}>
              {formatCurrency(netWorth)}
            </Heading>
            <Text color={subtleText} fontSize="sm" mt={1}>Across all accounts</Text>
            <Button mt={4} onClick={() => refreshAccounts()} isLoading={refreshing} colorScheme="blue" size="sm">
              Refresh
            </Button>
          </Box>
          
          <Box bg={tileBg} p={6} rounded="lg" shadow="md" borderWidth="1px" borderColor={borderColor}>
            <Text color={subtleText} mb={2} fontWeight="medium">Number of Accounts</Text>
            <Heading size="lg">{accounts?.length || 0}</Heading>
            <Text color={subtleText} fontSize="sm" mt={1}>Active accounts</Text>
          </Box>
        </Grid>
      </VStack>
    </Box>
  );
};

export default Dashboard; 