import { Box, Container, Flex, IconButton, Menu, MenuButton, MenuItem, MenuList, useBreakpointValue, useColorModeValue, Image } from '@chakra-ui/react'
import { HamburgerIcon, SettingsIcon } from '@chakra-ui/icons'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface MainLayoutProps {
  children: React.ReactNode
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { signOut } = useAuth()
  const isMobile = useBreakpointValue({ base: true, md: false })
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  return (
    <Box minH="100vh" w="100vw" bg={useColorModeValue('gray.50', 'gray.900')}>
      <Flex
        as="header"
        position="sticky"
        top={0}
        bg={bg}
        borderBottom="1px"
        borderColor={borderColor}
        w="100%"
        h="16"
        alignItems="center"
        px={{ base: 4, md: 8 }}
        zIndex="sticky"
      >
        <Container maxW="container.xl" display="flex" alignItems="center" justifyContent="space-between">
          <Link to="/">
            <Flex alignItems="center">
              <Image src="/logo.png" alt="Otter Money Logo" boxSize="45px" mr={2} />
              <Box fontSize="xl" fontWeight="bold" color="blue.500">
                Otter Money
              </Box>
            </Flex>
          </Link>

          {isMobile ? (
            <Menu>
              <MenuButton
                as={IconButton}
                aria-label="Navigation menu"
                icon={<HamburgerIcon />}
                variant="ghost"
              />
              <MenuList>
                <MenuItem as={Link} to="/">Dashboard</MenuItem>
                <MenuItem as={Link} to="/accounts">Accounts</MenuItem>
                <MenuItem as={Link} to="/transactions">Transactions</MenuItem>
                <MenuItem as={Link} to="/settings">Settings</MenuItem>
                <MenuItem onClick={() => signOut()}>Sign Out</MenuItem>
              </MenuList>
            </Menu>
          ) : (
            <Flex gap={6}>
              <Link to="/">Dashboard</Link>
              <Link to="/accounts">Accounts</Link>
              <Link to="/transactions">Transactions</Link>
              <Link to="/settings">Settings</Link>
            </Flex>
          )}
        </Container>
      </Flex>

      <Container 
        as="main" 
        maxW="container.xl" 
        py={{ base: 4, md: 8 }}
        px={{ base: 4, md: 8 }}
      >
        {children}
      </Container>
    </Box>
  )
}

export default MainLayout 