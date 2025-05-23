import { 
  Box, 
  Heading, 
  Text, 
  useColorModeValue, 
  Button,
  useBreakpointValue,
  Flex,
  IconButton,
  Show,
  SimpleGrid,
  Hide,
  Spinner,
  Alert,
  AlertIcon
} from '@chakra-ui/react'
import { AddIcon } from '@chakra-ui/icons'
import { useState } from 'react'
// import { useAuth } from '../contexts/AuthContext' // Will be needed when implementing actual transactions
import { useQuery } from '@tanstack/react-query'
import DataTable from '../components/DataTable'
import DataCard from '../components/DataCard'
import CurrencyDisplay from '../components/CurrencyDisplay'
import SortMenu from '../components/SortMenu'
import { CategoryDisplay } from '../components/categories/CategorySetter'

// Placeholder for transactions data type
interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: string;
  category?: string | null;
}

const Transactions = () => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const headerColor = useColorModeValue('blue.600', 'blue.200')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const isMobile = useBreakpointValue({ base: true, md: false })
  
  // const { user, session } = useAuth() // Will be needed when implementing actual transactions
  
  // State for sorting
  const [sortConfig, setSortConfig] = useState({
    field: 'date' as keyof Transaction,
    direction: 'desc' as 'asc' | 'desc'
  })
  
  // Placeholder for data
  const transactions: Transaction[] = []
  
  // Placeholder for query - will be implemented when building out transactions
  // const { isLoading, error } = useQuery({
  //   queryKey: ['transactions'],
  //   queryFn: async () => {
  //     // This will be implemented later
  //     return []
  //   },
  //   enabled: false // Disable for now
  // })
  
  // Handle sorting
  const handleSort = (field: keyof Transaction) => {
    setSortConfig(prevConfig => {
      if (prevConfig.field === field) {
        // Toggle direction if same field
        return {
          ...prevConfig,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        };
      } else {
        // New field, default to descending for dates, ascending for others
        return {
          field,
          direction: field === 'date' ? 'desc' : 'asc'
        };
      }
    });
  };
  
  // Define table columns
  const columns = [
    {
      key: 'date' as keyof Transaction,
      label: 'Date'
    },
    {
      key: 'description' as keyof Transaction,
      label: 'Description'
    },
    {
      key: 'amount' as keyof Transaction,
      label: 'Amount',
      isNumeric: true,
      render: (transaction: Transaction) => (
        <CurrencyDisplay amount={transaction.amount} />
      )
    },
    {
      key: 'category' as keyof Transaction,
      label: 'Category',
      render: (transaction: Transaction) => (
        <CategoryDisplay 
          categoryName={transaction.category} 
          categoryStructure={{ 
            account_categories: [], 
            transaction_categories: [] 
          }}
          categoryType="transaction"
        />
      )
    }
  ]
  
  // Define sort options for mobile
  const sortOptions = [
    { key: 'date', label: 'Date' },
    { key: 'description', label: 'Description' },
    { key: 'amount', label: 'Amount' },
    { key: 'category', label: 'Category' }
  ]

  // if (isLoading) return <Spinner />
  // if (error) return <Alert status="error"><AlertIcon />{(error as Error).message}</Alert>

  return (
    <Box position="relative" pb={16}>
      <Heading size="lg" mb={6} color={headerColor} borderBottom="2px solid" borderColor={borderColor} pb={2}>
        Transactions
      </Heading>
      
      {transactions.length === 0 ? (
        <Box>
          <Text color={textColor} mt={4}>No transactions found.</Text>
          <Button mt={4} colorScheme="blue">Add Transaction</Button>
        </Box>
      ) : (
        <>
          {/* Mobile Sort Menu */}
          <Show below="md">
            <SortMenu 
              options={sortOptions}
              currentSortKey={sortConfig.field as string}
              sortDirection={sortConfig.direction}
              onSort={(key) => handleSort(key as keyof Transaction)}
            />
          </Show>

          {/* Desktop Table View */}
          <Hide below="md">
            <DataTable 
              data={transactions}
              columns={columns}
              keyField="id"
              sortConfig={sortConfig}
              onSort={handleSort}
              addItemRow={
                <Flex alignItems="center" justifyContent="center" py={2}>
                  <AddIcon mr={2} />
                  <Text fontWeight="medium">Add New Transaction</Text>
                </Flex>
              }
            />
          </Hide>

          {/* Mobile Card View */}
          <Show below="md">
            <SimpleGrid columns={1} spacing={4} mt={4}>
              {transactions.map(transaction => (
                <DataCard
                  key={transaction.id}
                  title={transaction.description}
                  fields={[
                    { 
                      label: 'Date', 
                      value: new Date(transaction.date).toLocaleDateString() 
                    },
                    { 
                      label: 'Amount', 
                      value: <CurrencyDisplay amount={transaction.amount} /> 
                    },
                    { 
                      label: 'Category', 
                      value: (
                        <CategoryDisplay 
                          categoryName={transaction.category} 
                          categoryStructure={{ 
                            account_categories: [], 
                            transaction_categories: [] 
                          }}
                          categoryType="transaction"
                        />
                      ) 
                    }
                  ]}
                />
              ))}
            </SimpleGrid>
          </Show>
        </>
      )}

      {/* Floating action button for mobile */}
      {isMobile && (
        <IconButton
          aria-label="Add transaction"
          icon={<AddIcon />}
          size="lg"
          colorScheme="blue"
          borderRadius="full"
          position="fixed"
          bottom="4"
          right="4"
          shadow="lg"
          zIndex={1000}
        />
      )}
    </Box>
  )
}

export default Transactions 