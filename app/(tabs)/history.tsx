import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { useSettings, Cotizacion } from '@/src/hooks/useSettings';
import { useTheme } from '@/src/hooks/useTheme';

export default function HistoryScreen() {
  const { getCotizaciones, loadCotizacion, deleteCotizacion } = useSettings();
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [selected, setSelected] = useState<Cotizacion | null>(null);

  const refreshHistory = useCallback(() => {
    setCotizaciones(getCotizaciones());
  }, [getCotizaciones]);

  useFocusEffect(refreshHistory);

  const handleEdit = (c: Cotizacion) => {
    const s = JSON.parse(c.settings_json);
    loadCotizacion(s);
    setSelected(null);
    router.replace('/(tabs)');
  };

  const handleDelete = (id: number) => {
    Alert.alert('Eliminar', '¿Estás seguro?', [
      { text: 'Cancelar' },
      { text: 'Borrar', onPress: () => { deleteCotizacion(id); refreshHistory(); } }
    ]);
  };

  const renderSettings = (jsonStr: string) => {
    try {
      const s = JSON.parse(jsonStr);
      const rows = [
        { label: 'Tipo', value: s.fuel_type.toUpperCase().replace('_', '/') },
        { label: 'Precio Combustible', value: `$${s.fuel_price}` },
        { label: 'Consumo', value: `${s.consumption_100km} L/100km` },
        { label: 'Seguro', value: `$${s.insurance}` },
        { label: 'Patente', value: `$${s.tax}` },
      ];
      return (
        <View style={{ gap: 10, marginTop: 15 }}>
          {rows.map((row, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.inputBorder }}>
              <Text style={{color: theme.textSecondary}}>{row.label}</Text>
              <Text style={{color: theme.text, fontWeight: '600'}}>{row.value}</Text>
            </View>
          ))}
        </View>
      );
    } catch { return <Text style={{color: theme.textSecondary}}>Error al leer datos</Text>; }
  };

  const printToPdf = async (c: Cotizacion) => {
    const s = JSON.parse(c.settings_json);
    const html = `
      <html>
        <body style="font-family: sans-serif; padding: 20px;">
          <h1>Cotización: ${c.nombre}</h1>
          <h2 style="color: #007AFF;">Total Mensual: $${c.total_monthly.toFixed(2)}</h2>
          <h3>Detalle:</h3>
          <ul>
            <li>Tipo: ${s.fuel_type.toUpperCase().replace('_', '/')}</li>
            <li>Combustible: $${s.fuel_price}</li>
            <li>Consumo: ${s.consumption_100km} L/100km</li>
            <li>Seguro: $${s.insurance}</li>
            <li>Patente: $${s.tax}</li>
          </ul>
        </body>
      </html>
    `;
    try {
      await Print.printAsync({ html });
    } catch (e) {
      Alert.alert('Error', 'No se pudo generar el PDF');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Historial</Text>
        {cotizaciones.map(c => (
          <TouchableOpacity key={c.id} style={styles.card} onPress={() => setSelected(c)}>
            <View>
              <Text style={styles.cardTitle}>{c.nombre}</Text>
              <Text style={styles.cardDate}>{c.fecha}</Text>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
              <Text style={styles.cardTotal}>${c.total_monthly.toFixed(2)}</Text>
              <TouchableOpacity onPress={() => handleDelete(c.id)}>
                <Ionicons name="trash-outline" size={20} color="red" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={!!selected} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeader}>{selected?.nombre}</Text>
            <Text style={{color: theme.accent, fontSize: 18, fontWeight: '700'}}>Total Mensual: ${selected?.total_monthly.toFixed(2)}</Text>
            {selected && renderSettings(selected.settings_json)}
            
            <View style={{marginTop: 25, gap: 10}}>
              <TouchableOpacity onPress={() => printToPdf(selected!)} style={[styles.modalButton, {backgroundColor: theme.accent}]}>
                <Text style={{color: '#fff', fontWeight: 'bold'}}>Exportar a PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleEdit(selected!)} style={[styles.modalButton, {backgroundColor: theme.inputBorder}]}>
                <Text style={{color: theme.text, fontWeight: 'bold'}}>Editar y Reutilizar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSelected(null)} style={styles.modalButton}><Text style={{color: theme.text}}>Cerrar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scrollContent: { padding: 20 },
  title: { fontSize: 32, fontWeight: '900', color: theme.text, marginBottom: 20 },
  card: { padding: 20, backgroundColor: theme.card, borderRadius: 20, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
  cardDate: { fontSize: 12, color: theme.textSecondary },
  cardTotal: { fontSize: 20, fontWeight: '800', color: theme.accent },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: theme.card, borderRadius: 24, padding: 30 },
  modalHeader: { fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 5 },
  modalButton: { padding: 15, alignItems: 'center', borderRadius: 12 }
});
