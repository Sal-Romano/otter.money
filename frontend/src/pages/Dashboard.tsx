import { Box, Grid, Heading, Text, VStack, useColorModeValue, Button, Spinner, Alert, AlertIcon } from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useState } from 'react'

// Type for account object
interface Account {
  balance: string;
  [key: string]: any;
}

const fetchCachedAccounts = async (userId: string): Promise<Account[] | null> => {
  const { data, error } = await supabase
    .from('user_account_cache')
    .select('accounts')
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data?.accounts || null;
};

const saveCachedAccounts = async (userId: string, accounts: Account[]) => {
  await supabase
    .from('user_account_cache')
    .upsert({ user_id: userId, accounts });
};

const fetchAccountsFromApi = async (userId: string, jwt: string): Promise<Account[]> => {
  const response = await axios.get(`/api/v1/accounts?user_id=${userId}`, {
    headers: {
      Authorization: `Bearer ${jwt}`
    }
  });
  return response.data.accounts;
};

const Dashboard = () => {
  const { user, session } = useAuth();
  const userId = user?.id;
  const jwt = session?.access_token;
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: cachedAccounts, isLoading: loadingCache } = useQuery<Account[] | null>({
    queryKey: ['cachedAccounts', userId],
    queryFn: () => userId ? fetchCachedAccounts(userId) : null,
    enabled: !!userId,
  });

  const { mutate: refreshAccounts, isPending: refreshing } = useMutation({
    mutationFn: async () => {
      setError(null);
      if (!userId || !jwt) {
        setError('No JWT found. Please log in again.');
        return;
      }
      try {
        const accounts = await fetchAccountsFromApi(userId, jwt);
        await saveCachedAccounts(userId, accounts);
        queryClient.invalidateQueries({ queryKey: ['cachedAccounts', userId] });
      } catch (err: any) {
        setError(err?.response?.data?.error || err.message || 'Failed to refresh accounts.');
      }
    }
  });

  const netWorth = cachedAccounts
    ? cachedAccounts.reduce((sum: number, account: Account) => sum + parseFloat(account.balance || '0'), 0)
    : 0;

  const cardBg = useColorModeValue('white', 'gray.700');
  const subtleText = useColorModeValue('gray.600', 'gray.400');

  if (loadingCache) {
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
            <Heading size="lg">{cachedAccounts?.length || 0}</Heading>
            <Text color={subtleText} fontSize="sm" mt={1}>Active accounts</Text>
          </Box>
        </Grid>
      </VStack>
    </Box>
  );
};

export default Dashboard; 