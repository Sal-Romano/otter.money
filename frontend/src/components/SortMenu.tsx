import { 
  Button, 
  Menu, 
  MenuButton, 
  MenuList, 
  MenuItem
} from '@chakra-ui/react'
import { 
  ChevronDownIcon, 
  ArrowUpDownIcon,
  TriangleUpIcon,
  TriangleDownIcon
} from '@chakra-ui/icons'

export interface SortOption {
  key: string;
  label: string;
}

interface SortMenuProps {
  options: SortOption[];
  currentSortKey: string;
  sortDirection: 'asc' | 'desc';
  onSort: (key: string) => void;
  size?: 'sm' | 'md' | 'lg';
  colorScheme?: string;
}

const SortMenu = ({ 
  options, 
  currentSortKey, 
  sortDirection, 
  onSort,
  size = 'sm',
  colorScheme = 'blue'
}: SortMenuProps) => {
  // Get current label
  const currentLabel = options.find(opt => opt.key === currentSortKey)?.label || 'Sort';
  
  return (
    <Menu>
      <MenuButton 
        as={Button} 
        rightIcon={<ChevronDownIcon />} 
        size={size} 
        colorScheme={colorScheme}
        variant="outline"
        mb={4}
        mt={1}
        leftIcon={<ArrowUpDownIcon />}
      >
        Sort: {currentLabel} {sortDirection === 'asc' ? '(A-Z)' : '(Z-A)'}
      </MenuButton>
      <MenuList>
        {options.map((option) => (
          <MenuItem 
            key={option.key} 
            onClick={() => onSort(option.key)}
          >
            {option.label} {currentSortKey === option.key && (
              sortDirection === 'asc' ? <TriangleUpIcon ml={2} /> : <TriangleDownIcon ml={2} />
            )}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

export default SortMenu; 