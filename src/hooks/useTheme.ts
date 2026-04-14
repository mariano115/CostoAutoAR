import { useColorScheme } from 'react-native';

const Colors = {
  light: {
    background: '#F4F6F8',
    card: '#FFFFFF',
    text: '#1A1D21',
    textSecondary: '#6B7280',
    accent: '#007AFF',
    inputBackground: '#F9FAFB',
    inputBorder: '#E5E7EB',
    resultCard: '#1A1D21',
    resultText: '#FFFFFF',
    resultLabel: '#9CA3AF'
  },
  dark: {
    background: '#121212',
    card: '#1E1E1E',
    text: '#E5E7EB',
    textSecondary: '#A0AEC0',
    accent: '#3B82F6',
    inputBackground: '#2D2D2D',
    inputBorder: '#404040',
    resultCard: '#3B82F6',
    resultText: '#FFFFFF',
    resultLabel: '#E0E7FF'
  }
};

export const useTheme = () => {
  const scheme = useColorScheme() ?? 'light';
  return Colors[scheme];
};
