import { 
  Card, 
  CardHeader, 
  CardBody, 
  Flex, 
  Text, 
  Stack,
  useColorModeValue
} from '@chakra-ui/react'
import { ReactNode } from 'react'

export interface CardField {
  label: string;
  value: ReactNode;
}

interface DataCardProps {
  title: string;
  fields: CardField[];
  onClick?: () => void;
}

const DataCard = ({ title, fields, onClick }: DataCardProps) => {
  const cardBg = useColorModeValue('white', 'gray.700')
  const headerBg = useColorModeValue('blue.50', 'blue.900')
  const headerColor = useColorModeValue('blue.600', 'blue.200')
  const textColor = useColorModeValue('gray.600', 'gray.300')

  return (
    <Card 
      bg={cardBg} 
      shadow="md" 
      borderRadius="lg" 
      overflow="hidden"
      onClick={onClick}
      cursor={onClick ? "pointer" : undefined}
      _hover={onClick ? { transform: 'translateY(-2px)', shadow: 'lg' } : undefined}
      transition="all 0.2s"
    >
      <CardHeader bg={headerBg} py={3} px={4}>
        <Flex justifyContent="space-between" alignItems="center">
          <Text fontWeight="bold" color={headerColor} isTruncated maxW="70%">
            {title}
          </Text>
        </Flex>
      </CardHeader>
      <CardBody py={3} px={4}>
        <Stack spacing={2}>
          {fields.map((field, index) => (
            <Flex key={index} justify="space-between">
              <Text fontSize="sm" color={textColor}>{field.label}:</Text>
              {typeof field.value === 'string' ? (
                <Text fontSize="sm" fontWeight="medium">{field.value}</Text>
              ) : (
                field.value
              )}
            </Flex>
          ))}
        </Stack>
      </CardBody>
    </Card>
  )
}

export default DataCard 