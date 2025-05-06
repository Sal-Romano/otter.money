import { Box, Heading, Text, useColorModeValue, Table, Thead, Tbody, Tr, Th, Td, Spinner, Alert, AlertIcon, Input, Button, VStack, useToast, Flex } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'

// Type for account object from user_accounts table
interface Account {
  sf_account_id: string;
  sf_account_name: string;
  sf_name: string;
  balance: string;
  sf_balance_date: string;
  source: string;
}

const Accounts = () => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const cardBg = useColorModeValue('white', 'gray.700')
  const { user, session } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    sf_account_name: '',
    sf_name: '',
    balance: '',
    sf_balance_date: ''
  })
  const [adding, setAdding] = useState(false)
  const toast = useToast()

  useEffect(() => {
    const fetchAccounts = async () => {
      if (!user || !session) return
      setLoading(true)
      setError(null)
      try {
        // Get accounts directly from the API
        const resp = await axios.get('/api/v1/user_accounts', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        setAccounts(resp.data.accounts || [])
      } catch (err: any) {
        setError(err?.response?.data?.error || err.message || 'Failed to fetch accounts.')
      } finally {
        setLoading(false)
      }
    }
    fetchAccounts()
  }, [user, session])

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
      const resp = await axios.get('/api/v1/user_accounts', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      setAccounts(resp.data.accounts || [])
      
      // Reset form
      setForm({ sf_account_name: '', sf_name: '', balance: '', sf_balance_date: '' })
      toast({ title: 'Account added!', status: 'success', duration: 3000 })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to add account.', status: 'error', duration: 5000 })
    } finally {
      setAdding(false)
    }
  }

  if (loading) return <Spinner />
  if (error) return <Alert status="error"><AlertIcon />{error}</Alert>

  return (
    <Box>
      <Heading size="lg" mb={6}>Accounts</Heading>
      
      <Box bg={cardBg} p={6} rounded="lg" shadow="md" mb={6}>
        <Heading size="md" mb={4}>Add Manual Account</Heading>
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
            
            <Button type="submit" colorScheme="blue" isLoading={adding}>
              Add Account
            </Button>
          </VStack>
        </form>
      </Box>
      
      {accounts.length === 0 ? (
        <Text color={textColor} mt={4}>No accounts found.</Text>
      ) : (
        <Box bg={cardBg} p={0} rounded="lg" shadow="md" mt={4} overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Institution</Th>
                <Th isNumeric>Balance</Th>
                <Th>Date</Th>
                <Th>Source</Th>
              </Tr>
            </Thead>
            <Tbody>
              {accounts.map((acc) => (
                <Tr key={acc.sf_account_id}>
                  <Td>{acc.sf_account_name}</Td>
                  <Td>{acc.sf_name}</Td>
                  <Td isNumeric>${parseFloat(acc.balance || '0').toFixed(2)}</Td>
                  <Td>{acc.sf_balance_date ? new Date(parseInt(acc.sf_balance_date) * 1000).toLocaleDateString() : ''}</Td>
                  <Td>{acc.source}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  )
}

export default Accounts 