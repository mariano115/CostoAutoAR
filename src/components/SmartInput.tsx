import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';

interface SmartInputProps extends TextInputProps {
  label: string;
  suffix: string;
  value: number;
  onChangeValue: (val: number) => void;
  onSearch?: () => void;
  isLoading?: boolean;
}

export const SmartInput: React.FC<SmartInputProps> = ({ label, suffix, value, onChangeValue, onSearch, isLoading, ...props }) => {
  const theme = useTheme();
  const [text, setText] = useState(value?.toString() || '');
  const isFocused = React.useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setText(value?.toString() || '');
    }
  }, [value]);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, {color: theme.textSecondary}]}>{label}</Text>
      <View style={[styles.inputWrapper, {backgroundColor: theme.inputBackground, borderColor: theme.inputBorder}]}>
        <TextInput
          {...props}
          style={[styles.input, {color: theme.text}]}
          keyboardType="numeric"
          value={text}
          placeholder="0.00"
          placeholderTextColor={theme.textSecondary}
          onChangeText={(val) => setText(val.replace(/[^0-9.]/g, ''))}
          onFocus={() => { isFocused.current = true; }}
          onBlur={() => { 
            isFocused.current = false;
            onChangeValue(parseFloat(text) || 0); 
          }}
        />
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.accent} style={styles.searchButton} />
        ) : onSearch && (
          <TouchableOpacity onPress={onSearch} style={styles.searchButton}>
            <Ionicons name="search" size={20} color={theme.accent} />
          </TouchableOpacity>
        )}
        <Text style={[styles.suffix, {color: theme.accent}]}>{suffix}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 13, marginBottom: 6, fontWeight: '600' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 16, borderWidth: 1 },
  input: { flex: 1, height: 50, fontSize: 17 },
  searchButton: { padding: 8 },
  suffix: { marginLeft: 10, fontWeight: '700' },
});
