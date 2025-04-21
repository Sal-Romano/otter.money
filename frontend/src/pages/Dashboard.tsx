import { Box, Grid, Heading, Text } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

const Dashboard = () => {
  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await axios.get('/api/v1/accounts')
      return response.data
    }
  })

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await axios.get('/api/v1/transactions')
      return response.data
    }
  })

  const totalBalance = accounts?.reduce((sum: number, account: any) => sum + account.balance, 0) || 0

  return (
    <Box>
      <Heading mb={8}>Dashboard</Heading>
      
      <Grid templateColumns="repeat(3, 1fr)" gap={6} mb={8}>
        <Box p={5} bg="white" borderRadius="lg" boxShadow="sm">
          <Text fontSize="sm" color="gray.600">Total Balance</Text>
          <Text fontSize="2xl" fontWeight="bold">${totalBalance.toFixed(2)}</Text>
          <Text fontSize="xs" color="gray.500">Across all accounts</Text>
        </Box>
        
        <Box p={5} bg="white" borderRadius="lg" boxShadow="sm">
          <Text fontSize="sm" color="gray.600">Number of Accounts</Text>
          <Text fontSize="2xl" fontWeight="bold">{accounts?.length || 0}</Text>
          <Text fontSize="xs" color="gray.500">Active accounts</Text>
        </Box>
        
        <Box p={5} bg="white" borderRadius="lg" boxShadow="sm">
          <Text fontSize="sm" color="gray.600">Recent Transactions</Text>
          <Text fontSize="2xl" fontWeight="bold">{transactions?.length || 0}</Text>
          <Text fontSize="xs" color="gray.500">Last 30 days</Text>
        </Box>
      </Grid>

      <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
        <Heading size="md" mb={4}>Recent Activity</Heading>
        {transactionsLoading ? (
          <Text>Loading transactions...</Text>
        ) : (
          <Box>
            {transactions?.slice(0, 5).map((transaction: any) => (
              <Box key={transaction.id} py={2} borderBottom="1px" borderColor="gray.100">
                <Text>{transaction.description}</Text>
                <Text color={transaction.amount >= 0 ? 'green.500' : 'red.500'}>
                  ${Math.abs(transaction.amount).toFixed(2)}
                </Text>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default Dashboard 