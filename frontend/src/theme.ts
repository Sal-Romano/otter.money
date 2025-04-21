import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'system',
  useSystemColorMode: true,
}

const theme = extendTheme({
  config,
  styles: {
    global: (props: { colorMode: 'light' | 'dark' }) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
        color: props.colorMode === 'dark' ? 'gray.100' : 'gray.900',
      }
    }),
  },
  components: {
    Box: {
      baseStyle: (props: { colorMode: 'light' | 'dark' }) => ({
        bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
      }),
    },
    Text: {
      baseStyle: (props: { colorMode: 'light' | 'dark' }) => ({
        color: props.colorMode === 'dark' ? 'gray.100' : 'gray.900',
      }),
    },
    Heading: {
      baseStyle: (props: { colorMode: 'light' | 'dark' }) => ({
        color: props.colorMode === 'dark' ? 'white' : 'gray.900',
      }),
    }
  }
})

export default theme 