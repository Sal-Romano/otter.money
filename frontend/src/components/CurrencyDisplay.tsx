import { Text, useColorModeValue } from '@chakra-ui/react'

// Currency formatter for consistent display
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

interface CurrencyDisplayProps {
  amount: number | string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fontWeight?: 'normal' | 'medium' | 'bold';
}

const CurrencyDisplay = ({ 
  amount, 
  size = 'md',
  fontWeight = 'medium'
}: CurrencyDisplayProps) => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  
  // Convert to number if it's a string
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Determine color based on value
  const color = numericAmount < 0 
    ? 'red.500' 
    : numericAmount > 0 
      ? 'green.500' 
      : textColor;
  
  return (
    <Text color={color} fontSize={size} fontWeight={fontWeight}>
      {formatCurrency(numericAmount)}
    </Text>
  );
};

export default CurrencyDisplay; 