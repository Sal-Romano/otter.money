import { Box, Heading, Text, useColorModeValue } from '@chakra-ui/react'

const Transactions = () => {
  const textColor = useColorModeValue('gray.600', 'gray.300')

  return (
    <Box w="100%">
      <Heading size="lg" mb={2}>Transactions</Heading>
      <Text color={textColor}>Coming soon...</Text>
    </Box>
  )
}

export default Transactions 