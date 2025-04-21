import { Box, Heading, Text } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

const Transactions = () => {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await axios.get('/api/v1/transactions')
      return response.data
    }
  })

  return (
    <Box>
      <Heading mb={8}>Transactions</Heading>
      
      <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
        {isLoading ? (
          <Text>Loading transactions...</Text>
        ) : (
          <Box>
            {transactions?.map((transaction: any) => (
              <Box 
                key={transaction.id} 
                p={4} 
                borderBottom="1px" 
                borderColor="gray.100"
                _hover={{ bg: 'gray.50' }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Text fontWeight="medium">{transaction.description}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {new Date(transaction.date).toLocaleDateString()}
                    </Text>
                  </Box>
                  <Text 
                    color={transaction.amount >= 0 ? 'green.500' : 'red.500'}
                    fontWeight="medium"
                  >
                    ${Math.abs(transaction.amount).toFixed(2)}
                  </Text>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default Transactions 