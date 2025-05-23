import { 
  Box, 
  Text, 
  Flex, 
  useColorModeValue, 
  Box as ChakraBox
} from '@chakra-ui/react'
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip
} from 'recharts'
import { CategoryStructure, getCategoryColor } from './categories/CategorySetter'

// Define interface for account objects
interface Account {
  sf_account_id: string;
  balance: string;
  category?: string | null;
}

// Interface for the CategoryPieChart component props
interface CategoryPieChartProps {
  accounts: Account[];
  categories: CategoryStructure;
  title?: string;
  height?: number;
  showLegend?: boolean;
}

// Interface for the data used in the pie chart
interface ChartData {
  name: string;
  value: number;
  color: string;
  rawColor: string;
}

const CategoryPieChart = ({ 
  accounts, 
  categories, 
  title = 'Accounts by Category',
  height = 300,
  showLegend = true
}: CategoryPieChartProps) => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const emptyMessageColor = useColorModeValue('gray.500', 'gray.400')
  
  // Group accounts by their parent category and sum their balances
  const groupAccountsByCategory = (): ChartData[] => {
    // Initialize with 'Uncategorized' as a default category
    const categoryGroups: Record<string, number> = {
      'Uncategorized': 0
    }
    
    // Process each account
    accounts.forEach(account => {
      const balance = parseFloat(account.balance || '0')
      
      if (!account.category) {
        // If no category is assigned, add to 'Uncategorized'
        categoryGroups['Uncategorized'] += balance
        return
      }
      
      // Find the parent category for this account's category
      let parentCategory = account.category
      let isSubcategory = false
      
      // Check all parent categories to see if this is a subcategory
      for (const parent of categories.account_categories) {
        if (parent.subcategories) {
          const matchingSubcategory = parent.subcategories.find(
            sub => sub.name === account.category
          )
          
          if (matchingSubcategory) {
            parentCategory = parent.name
            isSubcategory = true
            break
          }
        }
      }
      
      // Initialize the parent category if it doesn't exist
      if (!categoryGroups[parentCategory]) {
        categoryGroups[parentCategory] = 0
      }
      
      // Add the balance to the appropriate category
      categoryGroups[parentCategory] += balance
    })
    
    // Filter out categories with zero or negative balance and convert to chart data
    return Object.entries(categoryGroups)
      .filter(([_, value]) => value > 0)
      .map(([category, balance]) => {
        const rawColor = getCategoryColor(category === 'Uncategorized' ? null : category, categories)
        return {
          name: category,
          value: balance,
          rawColor,
          // For the pie chart, we'll use the base color without the shade
          color: rawColor.split('.')[0]
        }
      })
  }
  
  const chartData = groupAccountsByCategory()
  
  // Format currency values for tooltips and legends
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }
  
  // Calculate the total value for percentage calculations
  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0)
  
  // Custom tooltip for the pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = ((data.value / totalValue) * 100).toFixed(1)
      
      return (
        <ChakraBox 
          bg="white" 
          color="black" 
          p={2} 
          shadow="md" 
          rounded="md" 
          border="1px" 
          borderColor="gray.200"
        >
          <Text fontWeight="bold">{data.name}</Text>
          <Text>{formatCurrency(data.value)}</Text>
          <Text>{percentage}% of total</Text>
        </ChakraBox>
      )
    }
    
    return null
  }
  
  // Custom legend renderer
  const renderLegend = (props: any) => {
    const { payload } = props
    
    return (
      <Box mt={4}>
        <Flex flexWrap="wrap" justify="center">
          {payload.map((entry: any, index: number) => (
            <Flex 
              key={`legend-${index}`}
              align="center" 
              mr={4} 
              mb={2}
            >
              <Box 
                w="12px" 
                h="12px" 
                bg={entry.color} 
                mr={2} 
                borderRadius="sm"
              />
              <Text fontSize="sm" color={textColor}>
                {entry.value} ({((entry.payload.value / totalValue) * 100).toFixed(1)}%)
              </Text>
            </Flex>
          ))}
        </Flex>
      </Box>
    )
  }
  
  // If there's no valid data, show an empty state
  if (chartData.length === 0) {
    return (
      <Box height={height}>
        <Text color={emptyMessageColor} textAlign="center" mt={height / 2 - 20}>
          No categorized accounts with positive balances
        </Text>
      </Box>
    )
  }
  
  return (
    <Box textAlign="center">
      {title && <Text fontSize="lg" fontWeight="medium" mb={2}>{title}</Text>}
      <Box height={height}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              innerRadius={height * 0.15}
              outerRadius={height * 0.3}
              dataKey="value"
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend 
              content={renderLegend} 
              verticalAlign="bottom" 
              align="center"
            />}
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  )
}

export default CategoryPieChart 