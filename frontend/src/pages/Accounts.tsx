import { Box, Heading } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

const Accounts = () => {
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await axios.get('/api/v1/accounts')
      return response.data
    }
  })

  return (
    <Box>
      <Heading mb={8}>Accounts</Heading>
      
      <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
        {isLoading ? (
          <Box>Loading accounts...</Box>
        ) : (
          <Box as="table" width="100%">
            <Box as="thead">
              <Box as="tr">
                <Box as="th" textAlign="left" p={4}>Account Name</Box>
                <Box as="th" textAlign="left" p={4}>Type</Box>
                <Box as="th" textAlign="right" p={4}>Balance</Box>
                <Box as="th" textAlign="left" p={4}>Status</Box>
              </Box>
            </Box>
            <Box as="tbody">
              {accounts?.map((account: any) => (
                <Box as="tr" key={account.id} _hover={{ bg: 'gray.50' }}>
                  <Box as="td" p={4}>{account.name}</Box>
                  <Box as="td" p={4}>{account.type}</Box>
                  <Box as="td" p={4} textAlign="right">${account.balance.toFixed(2)}</Box>
                  <Box as="td" p={4}>{account.status}</Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default Accounts 