import { Box, Grid, Heading, Text, VStack, useColorModeValue } from '@chakra-ui/react'
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

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await axios.get('/api/v1/transactions')
      return response.data
    }
  })

  const totalBalance = accounts?.reduce((sum: number, account: any) => sum + account.balance, 0) || 0
  const cardBg = useColorModeValue('white', 'gray.700')
  const subtleText = useColorModeValue('gray.600', 'gray.400')

  return (
    <Box w="100%">
      <VStack align="stretch" spacing={8}>
        <Box>
          <Heading size="lg">Dashboard</Heading>
          <Text color={subtleText}>Your financial overview</Text>
        </Box>

        <Grid 
          templateColumns={{ 
            base: "1fr",
            md: "repeat(2, 1fr)", 
            lg: "repeat(3, 1fr)" 
          }}
          gap={6}
        >
          <Box bg={cardBg} p={6} rounded="lg" shadow="sm">
            <Text color={subtleText} mb={2}>Total Balance</Text>
            <Heading size="lg">${totalBalance.toFixed(2)}</Heading>
            <Text color={subtleText} fontSize="sm" mt={1}>Across all accounts</Text>
          </Box>

          <Box bg={cardBg} p={6} rounded="lg" shadow="sm">
            <Text color={subtleText} mb={2}>Number of Accounts</Text>
            <Heading size="lg">{accounts?.length || 0}</Heading>
            <Text color={subtleText} fontSize="sm" mt={1}>Active accounts</Text>
          </Box>

          <Box bg={cardBg} p={6} rounded="lg" shadow="sm">
            <Text color={subtleText} mb={2}>Recent Transactions</Text>
            <Heading size="lg">{transactions?.length || 0}</Heading>
            <Text color={subtleText} fontSize="sm" mt={1}>Last 30 days</Text>
          </Box>
        </Grid>

        <Box bg={cardBg} p={6} rounded="lg" shadow="sm">
          <Heading size="md" mb={4}>Recent Activity</Heading>
          <Text color={subtleText}>No recent activity to display</Text>
        </Box>
      </VStack>
    </Box>
  )
}

export default Dashboard 