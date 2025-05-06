import { Box, Heading, Text, useColorModeValue, Table, Thead, Tbody, Tr, Th, Td, Spinner, Alert, AlertIcon } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'

interface Account {
  sf_account_id: string
  sf_account_name: string
  sf_name: string
  sf_balance: string
  sf_balance_date: number
}

const Accounts = () => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const cardBg = useColorModeValue('white', 'gray.700')
  const { user, session } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAccounts = async () => {
      if (!user || !session) return
      setLoading(true)
      setError(null)
      try {
        const resp = await axios.get('/api/v1/user_accounts', {
          params: { user_id: user.id },
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

  if (loading) return <Spinner />
  if (error) return <Alert status="error"><AlertIcon />{error}</Alert>

  return (
    <Box w="100%">
      <Heading size="lg" mb={2}>Accounts</Heading>
      {accounts.length === 0 ? (
        <Text color={textColor}>No accounts found.</Text>
      ) : (
        <Box bg={cardBg} p={4} rounded="lg" shadow="md" mt={4}>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Name</Th>
                <Th>Institution</Th>
                <Th isNumeric>Balance</Th>
                <Th>Date</Th>
              </Tr>
            </Thead>
            <Tbody>
              {accounts.map(acc => (
                <Tr key={acc.sf_account_id}>
                  <Td>{acc.sf_account_id}</Td>
                  <Td>{acc.sf_account_name}</Td>
                  <Td>{acc.sf_name}</Td>
                  <Td isNumeric>${parseFloat(acc.sf_balance).toFixed(2)}</Td>
                  <Td>{acc.sf_balance_date ? new Date(acc.sf_balance_date * 1000).toLocaleString() : ''}</Td>
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