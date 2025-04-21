import { Box, Flex, Heading, Container } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'

interface MainLayoutProps {
  children: React.ReactNode
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <Box>
      <Box as="header" bg="white" boxShadow="sm" py={4}>
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <Heading size="lg" color="blue.600">
              <RouterLink to="/" style={{ textDecoration: 'none' }}>
                Otter Money
              </RouterLink>
            </Heading>
            <Flex gap={6}>
              <RouterLink to="/" style={{ textDecoration: 'none' }}>
                Dashboard
              </RouterLink>
              <RouterLink to="/accounts" style={{ textDecoration: 'none' }}>
                Accounts
              </RouterLink>
              <RouterLink to="/transactions" style={{ textDecoration: 'none' }}>
                Transactions
              </RouterLink>
            </Flex>
          </Flex>
        </Container>
      </Box>
      <Container maxW="container.xl" py={8}>
        {children}
      </Container>
    </Box>
  )
}

export default MainLayout 