import { Box, Heading, Text, useColorModeValue } from '@chakra-ui/react'

const Accounts = () => {
  const textColor = useColorModeValue('gray.600', 'gray.300')

  return (
    <Box w="100%">
      <Heading size="lg" mb={2}>Accounts</Heading>
      <Text color={textColor}>Coming soon...</Text>
    </Box>
  )
}

export default Accounts 