import { createTheme } from '@mui/material/styles';

// Drovery operator console theme — a calm, dense dashboard palette.
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0a6cff' },
    secondary: { main: '#5b6770' },
    background: { default: '#f4f6f8', paper: '#ffffff' },
  },
  shape: { borderRadius: 8 },
  typography: {
    h4: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiCard: { defaultProps: { variant: 'outlined' } },
    MuiButton: { defaultProps: { disableElevation: true } },
  },
});
