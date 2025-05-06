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

  const { data: accounts, isLoading } = useQuery<Account[]>({
    queryKey: ['userAccounts', userId],
    queryFn: () => jwt ? fetchUserAccounts(jwt) : Promise.resolve([]),
    enabled: !!userId && !!jwt,
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

  const cardBg = useColorModeValue('white', 'gray.700');
  const subtleText = useColorModeValue('gray.600', 'gray.400');

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <Box w="100%">
      <VStack align="stretch" spacing={8}>
        <Box>
          <Heading size="lg">Dashboard</Heading>
          <Text color={subtleText}>Your financial overview</Text>
        </Box>
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
          <Box bg={cardBg} p={6} rounded="lg" shadow="sm">
            <Text color={subtleText} mb={2}>Net Worth</Text>
            <Heading size="lg">${netWorth.toFixed(2)}</Heading>
            <Text color={subtleText} fontSize="sm" mt={1}>Across all accounts</Text>
            <Button mt={4} onClick={() => refreshAccounts()} isLoading={refreshing}>
              Refresh
            </Button>
          </Box>
          <Box bg={cardBg} p={6} rounded="lg" shadow="sm">
            <Text color={subtleText} mb={2}>Number of Accounts</Text>
            <Heading size="lg">{accounts?.length || 0}</Heading>
            <Text color={subtleText} fontSize="sm" mt={1}>Active accounts</Text>
          </Box>
        </Grid>
      </VStack>
    </Box>
  );
};

export default Dashboard; 