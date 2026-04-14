import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { SmartInput } from '@/src/components/SmartInput';
import { useSettings } from '@/src/hooks/useSettings';
import { initDatabase } from '@/src/database/db';
import { PROVINCIAS } from '@/src/constants/provincias';
import { useTheme } from '@/src/hooks/useTheme';

const COMBUSTIBLES = {
  nafta: [
    { label: 'Súper', slug: 'nafta-super' },
    { label: 'Premium', slug: 'nafta-premium' }
  ],
  diesel: [
    { label: 'Grado 2', slug: 'gasoil-grado-2' },
    { label: 'Grado 3', slug: 'gasoil-grado-3' }
  ],
  gnc: [{ label: 'GNC', slug: 'gnc' }]
};

export default function HomeScreen() {
  React.useEffect(() => { initDatabase(); }, []);
  const { settings, expenses, updateSetting, addExpense, deleteExpense, saveCotizacion } = useSettings();
  const theme = useTheme();
  const styles = createStyles(theme);
  
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [periodicity, setPeriodicity] = useState<'monthly' | 'yearly'>('monthly');
  const [modalVisible, setModalVisible] = useState(false);
  const [subModalVisible, setSubModalVisible] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [cotizacionName, setCotizacionName] = useState('');
  const [selectedSlug, setSelectedSlug] = useState('');
  const [updateTarget, setUpdateTarget] = useState<'fuel_price' | 'gnc_price'>('fuel_price');
  const [isLoading, setIsLoading] = useState(false);

  const totalMonthly = useMemo(() => {
    if (!settings) return 0;
    let costPerKm = 0;
    if (settings.fuel_type === 'nafta_gnc') {
      const pNafta = (settings.fuel_price * (1 - settings.gnc_ratio / 100));
      const pGnc = (settings.gnc_price * (settings.gnc_ratio / 100));
      costPerKm = (settings.consumption_100km / 100) * (pNafta + pGnc);
    } else {
      costPerKm = (settings.consumption_100km / 100) * settings.fuel_price;
    }
    const expensesTotal = expenses.reduce((acc, curr) => 
      acc + (curr.periodicity === 'monthly' ? curr.amount : curr.amount / 12), 0);
    return (costPerKm * settings.monthly_km) + settings.insurance + settings.tax + expensesTotal;
  }, [settings, expenses]);

  const savingsGnc = useMemo(() => {
    if (!settings || settings.fuel_type !== 'nafta_gnc') return 0;
    const costNaftaOnly = (settings.consumption_100km / 100) * settings.fuel_price * settings.monthly_km;
    const costHybrid = ((settings.consumption_100km / 100) * (settings.fuel_price * (1 - settings.gnc_ratio / 100) + settings.gnc_price * (settings.gnc_ratio / 100))) * settings.monthly_km;
    return costNaftaOnly - costHybrid;
  }, [settings]);

  const costPer100km = useMemo(() => {
    if (!settings) return 0;
    if (settings.fuel_type === 'nafta_gnc') {
       return (settings.consumption_100km) * (settings.fuel_price * (1 - settings.gnc_ratio / 100) + settings.gnc_price * (settings.gnc_ratio / 100));
    }
    return settings.consumption_100km * settings.fuel_price;
  }, [settings]);

  const serviceSavings = useMemo(() => (totalMonthly * 0.1), [totalMonthly]);

  const handleFetchPrice = async (provincia: string, tipo: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://api.argly.com.ar/api/combustibles/promedio/${provincia}/${tipo}`);
      const json = await response.json();
      if (json?.data?.precio_promedio) {
        updateSetting(updateTarget, parseFloat(json.data.precio_promedio));
      }
    } catch (error) { console.error(error); }
    setIsLoading(false);
    setModalVisible(false);
    setSubModalVisible(false);
  };

  if (!settings) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Costo Auto AR</Text>
          <Text style={styles.subtitle}>Gestión de gastos vehiculares</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.subHeader}>Tipo de Combustible</Text>
          <View style={styles.row}>
            {['nafta', 'nafta_gnc', 'diesel'].map(t => (
              <TouchableOpacity key={t} style={[styles.typeButton, settings.fuel_type === t && {backgroundColor: theme.accent, borderColor: theme.accent}]} onPress={() => updateSetting('fuel_type', t)}>
                <Text style={settings.fuel_type === t ? {color: '#fff', fontWeight: 'bold'} : {color: theme.text}}>{t.toUpperCase().replace('_', '/')}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.typeSelector}>
            {['nafta-super', 'nafta-premium', 'gasoil-grado-2', 'gasoil-grado-3'].filter(s => 
              (settings.fuel_type === 'nafta' && s.includes('nafta')) || 
              (settings.fuel_type === 'nafta_gnc' && s.includes('nafta')) ||
              (settings.fuel_type === 'diesel' && s.includes('gasoil'))
            ).map(s => (
              <TouchableOpacity key={s} style={[styles.subTypeButton, selectedSlug === s && {backgroundColor: theme.accent, borderColor: theme.accent}]} onPress={() => setSelectedSlug(s)}>
                <Text style={{color: selectedSlug === s ? '#fff' : theme.text}}>{s.replace('-', ' ').toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <SmartInput label="Precio Combustible" suffix="$/L" value={settings.fuel_price} onChangeValue={(v) => updateSetting('fuel_price', v)} onSearch={() => { setUpdateTarget('fuel_price'); setSubModalVisible(true); }} isLoading={isLoading && updateTarget === 'fuel_price'} />
          
          {settings.fuel_type === 'nafta_gnc' && (
            <View>
              <SmartInput label="Precio GNC" suffix="$/m3" value={settings.gnc_price} onChangeValue={(v) => updateSetting('gnc_price', v)} onSearch={() => { setUpdateTarget('gnc_price'); setSelectedSlug('gnc'); setModalVisible(true); }} isLoading={isLoading && updateTarget === 'gnc_price'} />
              <Text style={{color: theme.text, marginTop: 10}}>Uso GNC: {settings.gnc_ratio}%</Text>
              <Slider minimumValue={0} maximumValue={100} step={5} value={settings.gnc_ratio} onValueChange={(v) => updateSetting('gnc_ratio', v)} thumbTintColor={theme.accent} />
            </View>
          )}
          <SmartInput label="Consumo" suffix="L/100km" value={settings.consumption_100km} onChangeValue={(v) => updateSetting('consumption_100km', v)} />
          <SmartInput label="KM Mensuales" suffix="KM" value={settings.monthly_km} onChangeValue={(v) => updateSetting('monthly_km', v)} />
          <SmartInput label="Seguro" suffix="$" value={settings.insurance} onChangeValue={(v) => updateSetting('insurance', v)} />
          <SmartInput label="Patente" suffix="$" value={settings.tax} onChangeValue={(v) => updateSetting('tax', v)} />
        </View>

        <View style={styles.card}>
          <Text style={styles.subHeader}>Gastos Extras</Text>
          {expenses.map(e => (
            <View key={e.id} style={styles.expenseItem}>
              <View>
                <Text style={[styles.expenseText, {fontWeight: '600'}]}>{e.name}</Text>
                <Text style={{color: theme.textSecondary, fontSize: 12}}>{e.periodicity === 'monthly' ? 'Mensual' : 'Anual'}</Text>
              </View>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 15}}>
                <Text style={[styles.expenseText, {fontWeight: '700', color: theme.accent}]}>${e.amount}</Text>
                <TouchableOpacity onPress={() => deleteExpense(e.id)}><Ionicons name="trash-outline" size={18} color={theme.textSecondary} /></TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={styles.row}>
            <TextInput style={[styles.input, {flex: 2}]} placeholder="Concepto" value={newName} onChangeText={setNewName} placeholderTextColor={theme.textSecondary} />
            <TextInput style={[styles.input, {flex: 1}]} placeholder="$" value={newAmount} onChangeText={setNewAmount} keyboardType="numeric" placeholderTextColor={theme.textSecondary} />
          </View>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.typeButton, periodicity === 'monthly' && {backgroundColor: theme.accent}]} onPress={() => setPeriodicity('monthly')}><Text style={{color: periodicity === 'monthly' ? '#fff' : theme.text}}>Mensual</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.typeButton, periodicity === 'yearly' && {backgroundColor: theme.accent}]} onPress={() => setPeriodicity('yearly')}><Text style={{color: periodicity === 'yearly' ? '#fff' : theme.text}}>Anual</Text></TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={() => { if(newName && newAmount) { addExpense(newName, parseFloat(newAmount), periodicity); setNewName(''); setNewAmount(''); } }}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
          </View>
        </View>

        <Modal visible={saveModalVisible} transparent>
          <View style={styles.modalView}>
            <Text style={styles.modalHeader}>Guardar Cotización</Text>
            <TextInput 
              style={[styles.input, {marginBottom: 15}]} 
              placeholder="Nombre de la cotización" 
              value={cotizacionName} 
              onChangeText={setCotizacionName}
            />
            <View style={{flexDirection: 'row', gap: 10, height: 50}}>
              <TouchableOpacity onPress={() => setSaveModalVisible(false)} style={[styles.closeButton, {flex: 1, margin: 0, justifyContent: 'center'}]}><Text style={{color: theme.text, textAlign: 'center'}}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { if(cotizacionName) { saveCotizacion(cotizacionName, totalMonthly, settings!); setSaveModalVisible(false); setCotizacionName(''); } }} style={[styles.addButton, {flex: 1, margin: 0, justifyContent: 'center'}]}><Text style={{color: '#fff', textAlign: 'center', fontWeight: 'bold'}}>Guardar</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={subModalVisible} transparent>
          <View style={styles.modalView}>
            <Text style={styles.modalHeader}>Elegir tipo</Text>
            {COMBUSTIBLES[settings.fuel_type === 'nafta_gnc' ? 'nafta' : (settings.fuel_type as keyof typeof COMBUSTIBLES)]?.map((c) => (
              <TouchableOpacity key={c.slug} style={styles.provinciaItem} onPress={() => { setSelectedSlug(c.slug); setSubModalVisible(false); setModalVisible(true); }}>
                <Text style={{color: theme.text}}>{c.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setSubModalVisible(false)} style={styles.closeButton}><Text style={{color: theme.text}}>Cerrar</Text></TouchableOpacity>
          </View>
        </Modal>

        <Modal visible={modalVisible} transparent>
          <View style={styles.modalView}>
            <Text style={styles.modalHeader}>Provincia</Text>
            <FlatList 
              data={PROVINCIAS}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.provinciaItem} onPress={() => handleFetchPrice(item.slug, selectedSlug || (settings.fuel_type === 'nafta' ? 'nafta-super' : 'gasoil-grado-2'))}>
                  <Text style={{color: theme.text}}>{item.nombre}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}><Text style={{color: theme.text}}>Cerrar</Text></TouchableOpacity>
          </View>
        </Modal>
        
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Gasto Total Mensual</Text>
          <Text style={styles.totalResult}>${totalMonthly.toFixed(2)}</Text>
          <View style={{marginTop: 20, width: '100%', gap: 5}}>
            <Text style={{color: theme.resultLabel, fontSize: 13}}>Costo cada 100km: ${costPer100km.toFixed(0)}</Text>
            <Text style={{color: theme.resultLabel, fontSize: 13}}>Ahorro sugerido para Service: ${serviceSavings.toFixed(0)}</Text>
            {savingsGnc > 0 && <Text style={{color: '#4ADE80', fontSize: 13, fontWeight: 'bold'}}>Ahorro con GNC: ${savingsGnc.toFixed(0)}</Text>}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scrollContent: { padding: 20 },
  headerContainer: { marginBottom: 24, paddingHorizontal: 4 },
  title: { fontSize: 32, fontWeight: '900', color: theme.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: theme.textSecondary, marginTop: 4, fontWeight: '500' },
  subHeader: { fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 15 },
  card: { padding: 20, backgroundColor: theme.card, borderRadius: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  resultCard: { padding: 25, backgroundColor: theme.resultCard, borderRadius: 20, alignItems: 'center' },
  resultLabel: { color: theme.resultLabel, fontSize: 14, fontWeight: '500' },
  totalResult: { color: theme.resultText, fontSize: 36, fontWeight: '800', marginTop: 5 },
  expenseItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  expenseText: { fontSize: 16, color: theme.text },
  row: { flexDirection: 'row', gap: 10, marginTop: 10, alignItems: 'center' },
  typeButton: { padding: 10, borderRadius: 10, borderWidth: 1, flex: 1, alignItems: 'center' },
  typeSelector: { flexDirection: 'row', gap: 5, marginTop: 10 },
  subTypeButton: { padding: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.inputBorder, flex: 1, alignItems: 'center' },
  addButton: { backgroundColor: theme.accent, padding: 12, borderRadius: 10, justifyContent: 'center' },
  modalView: { flex: 1, backgroundColor: theme.card, padding: 40 },
  modalHeader: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 20 },
  provinciaItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: theme.inputBorder },
  closeButton: { padding: 15, alignItems: 'center', backgroundColor: theme.inputBorder, borderRadius: 10 },
  input: { backgroundColor: theme.inputBackground, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.inputBorder, color: theme.text }
});
