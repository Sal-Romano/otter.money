import { useState } from 'react'
import { Box, Button, FormControl, FormLabel, Input, VStack, Text, useToast, Heading, useColorModeValue } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const cardBg = useColorModeValue('white', 'gray.700')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        await signUp(email, password)
        toast({
          title: 'Account created.',
          description: 'Please check your email for verification.',
          status: 'success',
          duration: 5000,
        })
      } else {
        await signIn(email, password)
        navigate('/')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box 
      minH="100vh" 
      minW="100vw"
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      bg={useColorModeValue('gray.50', 'gray.900')}
      position="fixed"
      top="0"
      left="0"
    >
      <Box
        w={{ base: '90%', md: '400px' }}
        p={8}
        bg={cardBg}
        rounded="lg"
        shadow="lg"
      >
        <VStack spacing={6}>
          <Heading size="lg">Otter Money</Heading>
          <Heading size="md">{isSignUp ? 'Create Account' : 'Welcome Back'}</Heading>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <VStack spacing={4} w="100%">
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                w="100%"
                isLoading={loading}
              >
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </Button>

              <Text>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <Button
                  variant="link"
                  color="blue.500"
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Button>
              </Text>
            </VStack>
          </form>
        </VStack>
      </Box>
    </Box>
  )
}

export default Login 