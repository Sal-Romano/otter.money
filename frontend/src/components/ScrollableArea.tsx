import { Box, BoxProps } from '@chakra-ui/react';

// Custom scrollbar styling
export const scrollbarStyle = {
  '&::-webkit-scrollbar': {
    width: '8px',
    borderRadius: '8px',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
  },
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.05)',
};

interface ScrollableAreaProps extends BoxProps {
  maxHeight?: string | number;
}

// ScrollableArea component with nice scrollbars
const ScrollableArea = ({ children, maxHeight = '300px', ...props }: ScrollableAreaProps) => {
  return (
    <Box
      maxHeight={maxHeight}
      overflowY="auto"
      sx={scrollbarStyle}
      borderRadius="md"
      {...props}
    >
      {children}
    </Box>
  );
};

export default ScrollableArea; 