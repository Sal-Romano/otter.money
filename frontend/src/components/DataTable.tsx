import { 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  Flex,
  Box,
  useColorModeValue,
  Badge,
  Text,
  IconButton,
  Collapse,
  SlideFade
} from '@chakra-ui/react'
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  TriangleUpIcon,
  TriangleDownIcon,
  ArrowUpDownIcon
} from '@chakra-ui/icons'
import { ReactNode } from 'react'

interface Column<T> {
  key: keyof T;
  label: string;
  isNumeric?: boolean;
  render?: (item: T) => ReactNode;
  disableSort?: boolean;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T> {
  field: keyof T;
  direction: SortDirection;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  sortConfig: SortConfig<T>;
  onSort: (field: keyof T) => void;
  onRowClick?: (item: T) => void;
  expandedRow?: string | null;
  renderExpandedContent?: (item: T) => ReactNode;
  addItemRow?: ReactNode;
}

function DataTable<T>({ 
  data, 
  columns, 
  keyField, 
  sortConfig, 
  onSort,
  onRowClick,
  expandedRow,
  renderExpandedContent,
  addItemRow
}: DataTableProps<T>) {
  const headerBg = useColorModeValue('blue.50', 'blue.900')
  const headerColor = useColorModeValue('blue.600', 'blue.200')
  const hoverBg = useColorModeValue('gray.100', 'gray.700')
  const expandedBg = useColorModeValue('gray.50', 'gray.750')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // Sort indicator component
  const SortIndicator = ({ field }: { field: keyof T }) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDownIcon ml={1} boxSize={3} opacity={0.5} />;
    }
    
    return sortConfig.direction === 'asc' 
      ? <TriangleUpIcon ml={1} boxSize={3} /> 
      : <TriangleDownIcon ml={1} boxSize={3} />;
  };

  return (
    <Box overflow="hidden" borderWidth="1px" borderColor={borderColor} rounded="lg" shadow="md">
      <Table variant="simple">
        <Thead bg={headerBg}>
          <Tr>
            {columns.map((column) => (
              <Th 
                key={String(column.key)}
                color={headerColor} 
                fontWeight="bold" 
                fontSize="md"
                isNumeric={column.isNumeric}
                cursor={column.disableSort ? undefined : "pointer"}
                onClick={column.disableSort ? undefined : () => onSort(column.key)}
              >
                <Flex align="center" justify={column.isNumeric ? "flex-end" : "flex-start"}>
                  {column.label} 
                  {!column.disableSort && <SortIndicator field={column.key} />}
                </Flex>
              </Th>
            ))}
            {!!renderExpandedContent && <Th width="40px"></Th>}
          </Tr>
        </Thead>
        <Tbody>
          {data.map((item) => (
            <>
              <Tr 
                key={String(item[keyField])}
                _hover={{ bg: hoverBg }}
                transition="background-color 0.2s"
                cursor={onRowClick ? "pointer" : undefined}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                {columns.map((column) => (
                  <Td 
                    key={`${String(item[keyField])}-${String(column.key)}`}
                    isNumeric={column.isNumeric}
                  >
                    {column.render ? column.render(item) : String(item[column.key] || '')}
                  </Td>
                ))}
                {!!renderExpandedContent && (
                  <Td>
                    {expandedRow === String(item[keyField]) ? 
                      <ChevronUpIcon /> : 
                      <ChevronDownIcon />
                    }
                  </Td>
                )}
              </Tr>
              {renderExpandedContent && (
                <Tr>
                  <Td colSpan={columns.length + 1} p={0}>
                    <Collapse in={expandedRow === String(item[keyField])} animateOpacity>
                      <SlideFade in={expandedRow === String(item[keyField])} offsetY="20px">
                        <Box 
                          bg={expandedBg} 
                          p={4} 
                          borderTop="1px solid" 
                          borderColor={borderColor}
                        >
                          {renderExpandedContent(item)}
                        </Box>
                      </SlideFade>
                    </Collapse>
                  </Td>
                </Tr>
              )}
            </>
          ))}
          {addItemRow && (
            <Tr 
              _hover={{ bg: hoverBg, cursor: 'pointer' }}
              bg={useColorModeValue('gray.50', 'gray.700')}
            >
              <Td colSpan={columns.length + (renderExpandedContent ? 1 : 0)}>
                {addItemRow}
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>
    </Box>
  )
}

export default DataTable 