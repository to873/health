import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import {
  loadWeightLogs,
  addWeightLog,
  deleteWeightLog,
  loadProfile,
} from '../core/storage';
import { bmi } from '../core/calc';
import type { WeightLogEntry, Profile } from '../core/models';

/**
 * Screen for managing and visualising the user's weight history. Users can
 * quickly add today's weight, view their BMI and category, see trends
 * over the last 30 entries with moving averages, and delete individual
 * entries. All data is persisted locally via AsyncStorage.
 */
export default function WeightLogScreen() {
  const [logs, setLogs] = useState<WeightLogEntry[]>([]);
  const [newWeight, setNewWeight] = useState('');
  const [bmiValue, setBmiValue] = useState<number | null>(null);
  const [bmiCategory, setBmiCategory] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const prof = await loadProfile();
      setProfile(prof);
      const weightLogs = await loadWeightLogs();
      weightLogs.sort((a, b) => (a.date < b.date ? -1 : 1));
      setLogs(weightLogs);
      if (prof && weightLogs.length > 0) {
        const latest = weightLogs[weightLogs.length - 1].weightKg;
        const bmiVal = bmi(latest, prof.heightM);
        setBmiValue(bmiVal);
        setBmiCategory(getBmiCategory(bmiVal));
      }
    };
    fetchData();
  }, []);

  const handleAddWeight = async () => {
    const weightKg = parseFloat(newWeight);
    if (isNaN(weightKg) || weightKg <= 0) {
      Alert.alert('Invalid weight', 'Please enter a valid weight in kg.');
      return;
    }
    const date = new Date().toISOString().slice(0, 10);
    const entry: WeightLogEntry = { date, weightKg };
    await addWeightLog(entry);
    const updated = await loadWeightLogs();
    updated.sort((a, b) => (a.date < b.date ? -1 : 1));
    setLogs(updated);
    setNewWeight('');
    if (profile) {
      const bmiVal = bmi(weightKg, profile.heightM);
      setBmiValue(bmiVal);
      setBmiCategory(getBmiCategory(bmiVal));
    }
    Alert.alert('Saved', 'Weight entry saved.');
  };

  const handleDelete = async (date: string) => {
    await deleteWeightLog(date);
    const updated = await loadWeightLogs();
    updated.sort((a, b) => (a.date < b.date ? -1 : 1));
    setLogs(updated);
  };

  const getBmiCategory = (value: number) => {
    if (value < 18.5) return 'Underweight';
    if (value < 25) return 'Healthy';
    if (value < 30) return 'Overweight';
    return 'Obese';
  };

  // Prepare chart data for the last 30 entries
  const lastLogs = logs.slice(-30);
  const labels = lastLogs.map((e) => e.date.slice(5));
  const weightsData = lastLogs.map((e) => e.weightKg);
  const movingAvg7: number[] = [];
  const movingAvgOverall: number[] = [];
  for (let i = 0; i < lastLogs.length; i++) {
    const slice7 = lastLogs.slice(Math.max(0, i - 6), i + 1).map((e) => e.weightKg);
    const sum7 = slice7.reduce((a, b) => a + b, 0);
    movingAvg7.push(sum7 / slice7.length);
    const sliceOverall = lastLogs.slice(0, i + 1).map((e) => e.weightKg);
    const sumOverall = sliceOverall.reduce((a, b) => a + b, 0);
    movingAvgOverall.push(sumOverall / sliceOverall.length);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Weight Log</Text>
      {profile && bmiValue !== null && bmiCategory && (
        <View style={styles.bmiContainer}>
          <Text style={styles.bmiText}>
            BMI: {bmiValue.toFixed(1)} ({bmiCategory})
          </Text>
        </View>
      )}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={newWeight}
          onChangeText={setNewWeight}
          placeholder="Enter weight (kg)"
        />
        <Button title="Add weight" onPress={handleAddWeight} />
      </View>
      <View style={styles.chartContainer}>
        {lastLogs.length > 1 && (
          <LineChart
            data={{
              labels,
              datasets: [
                {
                  data: weightsData,
                  color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
                  strokeWidth: 2,
                },
                {
                  data: movingAvg7,
                  color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,
                  strokeWidth: 2,
                },
                {
                  data: movingAvgOverall,
                  color: (opacity = 1) => `rgba(0, 128, 0, ${opacity})`,
                  strokeWidth: 2,
                },
              ],
              legend: ['Weight', '7-day MA', 'Overall MA'],
            }}
            width={Dimensions.get('window').width - 32}
            height={220}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              propsForDots: {
                r: '3',
                strokeWidth: '1',
                stroke: '#333',
              },
            }}
            bezier
            style={{ marginVertical: 8 }}
          />
        )}
      </View>
      <View>
        {logs.map((log) => (
          <View key={log.date} style={styles.logRow}>
            <Text style={styles.logText}>
              {log.date}: {log.weightKg.toFixed(1)} kg
            </Text>
            <Button title="Delete" onPress={() => handleDelete(log.date)} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  bmiContainer: {
    marginBottom: 12,
    alignItems: 'center',
  },
  bmiText: {
    fontSize: 18,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
  },
  chartContainer: {
    marginVertical: 16,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  logText: {
    fontSize: 16,
  },
});