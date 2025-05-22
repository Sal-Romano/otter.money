import { 
  Box, 
  VStack, 
  Button, 
  Divider, 
  Tag, 
  FormControl,
  useColorModeValue
} from '@chakra-ui/react'
import ScrollableArea from './ScrollableArea'

// Types for categories
export interface Category {
  name: string;
  color: string;
  subcategories?: Category[];
}

export interface CategoryStructure {
  account_categories: Category[];
  transaction_categories: Category[];
}

// Function to get category color from structure
export const getCategoryColor = (categoryName: string | undefined | null, categoryStructure: CategoryStructure): string => {
  if (!categoryName) return 'red.500'; // Default for "Uncategorized"
  
  // Check in top-level account categories
  const category = categoryStructure.account_categories.find(cat => cat.name === categoryName);
  if (category) return category.color;
  
  // Check in subcategories
  for (const parentCat of categoryStructure.account_categories) {
    if (parentCat.subcategories) {
      const subcat = parentCat.subcategories.find(sub => sub.name === categoryName);
      if (subcat) return subcat.color;
    }
  }
  
  return 'red.500'; // Default fallback
};

interface CategoryDisplayProps {
  categoryName?: string | null;
  categoryStructure: CategoryStructure;
  size?: 'sm' | 'md' | 'lg';
}

interface CategorySelectorProps {
  categoryStructure: CategoryStructure;
  selectedCategory?: string | null;
  onSelectCategory: (categoryName: string | null) => void;
  categoryType?: 'account' | 'transaction';
  maxHeight?: string;
}

// Component to display a category tag
const CategoryDisplay = ({ 
  categoryName, 
  categoryStructure, 
  size = 'sm' 
}: CategoryDisplayProps) => {
  const displayName = categoryName || 'Uncategorized';
  const colorScheme = getCategoryColor(categoryName, categoryStructure).split('.')[0];
  
  return (
    <Tag colorScheme={colorScheme} size={size}>
      {displayName}
    </Tag>
  );
};

// Component to select a category
const CategorySelector = ({
  categoryStructure,
  selectedCategory,
  onSelectCategory,
  categoryType = 'account',
  maxHeight = '300px'
}: CategorySelectorProps) => {
  const categoryList = categoryType === 'account' 
    ? categoryStructure.account_categories 
    : categoryStructure.transaction_categories;

  return (
    <Box mt={2}>
      <FormControl>
        <ScrollableArea maxHeight={maxHeight} pr={1}>
          <VStack align="stretch" spacing={2} p={1}>
            <Button 
              variant={!selectedCategory ? "solid" : "outline"}
              colorScheme="red"
              size="sm"
              onClick={() => onSelectCategory(null)}
              justifyContent="flex-start"
              px={3}
            >
              Uncategorized
            </Button>
            
            <Divider />
            
            {/* Render top-level categories */}
            {categoryList.map((category, index) => (
              <Box key={index}>
                <Button 
                  variant={selectedCategory === category.name ? "solid" : "outline"}
                  colorScheme={category.color.split('.')[0]}
                  size="sm"
                  onClick={() => onSelectCategory(category.name)}
                  justifyContent="flex-start"
                  width="100%"
                  mb={category.subcategories && category.subcategories.length > 0 ? 1 : 2}
                >
                  {category.name}
                </Button>
                
                {/* Render subcategories if any */}
                {category.subcategories && category.subcategories.length > 0 && (
                  <VStack align="stretch" pl={4} spacing={1} mb={2}>
                    {category.subcategories.map((subcat, subIndex) => (
                      <Button 
                        key={`${category.name}-${subcat.name}-${subIndex}`}
                        variant={selectedCategory === subcat.name ? "solid" : "outline"}
                        colorScheme={category.color.split('.')[0]}
                        size="xs"
                        onClick={() => onSelectCategory(subcat.name)}
                        justifyContent="flex-start"
                      >
                        └ {subcat.name}
                      </Button>
                    ))}
                  </VStack>
                )}
              </Box>
            ))}
          </VStack>
        </ScrollableArea>
      </FormControl>
    </Box>
  );
};

// Export all components
export { CategorySelector, CategoryDisplay }; 