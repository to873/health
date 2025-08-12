import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import { estimateStepLengthM } from '../core/calc';
import {
  loadProfile,
  saveProfile,
  clearAllData,
  exportDataAsCsv,
} from '../core/storage';
import type { Profile, BmrFormula } from '../core/models';

/**
 * SettingsScreen allows users to edit their stored profile, update goals,
 * export their data, and reset all stored information. It handles loading
 * existing data from AsyncStorage and writes changes back to storage.
 */
export default function SettingsScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | 'other'>('male');
  const [bmrFormula, setBmrFormula] = useState<BmrFormula>('mifflin');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [stepGoal, setStepGoal] = useState('10000');
  const [stepLength, setStepLength] = useState(0.7);

  useEffect(() => {
    // Load profile on mount
    (async () => {
      const p = await loadProfile();
      if (p) {
        setProfile(p);
        // Populate fields
        setSex(p.sex);
        setBmrFormula(p.bmrFormula);
        setHeight(p.heightM.toString());
        setWeight(p.weightKg.toString());
        setStepLength(p.stepLengthM);
        setStepGoal(p.stepGoal ? p.stepGoal.toString() : '');
      }
    })();
  }, []);

  // Update estimated step length when height or sex changes for new users without override
  useEffect(() => {
    const h = parseFloat(height);
    if (!isNaN(h) && h > 0 && !profile) {
      const est = estimateStepLengthM(h, sex === 'male' ? 'male' : 'female');
      setStepLength(est);
    }
  }, [height, sex, profile]);

  const handleSave = async () => {
    if (!profile) {
      Alert.alert('No profile', 'No existing profile found to update.');
      return;
    }
    const heightM = parseFloat(height);
    const weightKg = parseFloat(weight);
    const goalSteps = parseInt(stepGoal, 10);
    if (isNaN(heightM) || isNaN(weightKg) || (stepGoal !== '' && isNaN(goalSteps))) {
      Alert.alert('Invalid input', 'Please enter valid values for all fields.');
      return;
    }
    const updated: Profile = {
      ...profile,
      sex,
      bmrFormula,
      heightM,
      weightKg,
      stepLengthM: stepLength,
      stepGoal: stepGoal !== '' ? goalSteps : undefined,
    };
    await saveProfile(updated);
    setProfile(updated);
    Alert.alert('Saved', 'Your settings have been updated.');
  };

  const handleExport = async () => {
    const csv = await exportDataAsCsv();
    if (!csv) {
      Alert.alert('No data', 'There is no data to export yet.');
      return;
    }
    try {
      await Share.share({ message: csv });
    } catch (e) {
      Alert.alert('Error', 'Failed to share data.');
    }
  };

  const handleReset = async () => {
    await clearAllData();
    setProfile(null);
    setAge('');
    setHeight('');
    setWeight('');
    setStepGoal('');
    setStepLength(0.7);
    setSex('male');
    setBmrFormula('mifflin');
    Alert.alert('Reset', 'All data has been deleted.');
  };

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Settings</Text>
        <Text>No profile found. Please complete onboarding.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Settings</Text>
      {/* Sex selection */}
      <Text style={styles.label}>Sex</Text>
      <Picker selectedValue={sex} onValueChange={(val) => setSex(val as any)}>
        <Picker.Item label="Male" value="male" />
        <Picker.Item label="Female" value="female" />
        <Picker.Item label="Other / Prefer not to say" value="other" />
      </Picker>
      <Text style={styles.label}>Height (m)</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        value={height}
        onChangeText={setHeight}
      />
      <Text style={styles.label}>Weight (kg)</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        value={weight}
        onChangeText={setWeight}
      />
      <Text style={styles.label}>Daily step goal</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={stepGoal}
        onChangeText={setStepGoal}
        placeholder="e.g. 10000"
      />
      <Text style={styles.label}>Step length (m)</Text>
      <Slider
        minimumValue={0.4}
        maximumValue={1.0}
        value={stepLength}
        onValueChange={setStepLength}
        step={0.01}
      />
      <Text style={styles.stepLengthValue}>{stepLength.toFixed(2)} m</Text>
      <Text style={styles.label}>BMR formula</Text>
      <Picker selectedValue={bmrFormula} onValueChange={(val) => setBmrFormula(val as BmrFormula)}>
        <Picker.Item label="Mifflin–St Jeor" value="mifflin" />
      </Picker>
      <View style={styles.buttonContainer}>
        <Button title="Save" onPress={handleSave} />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Export data (CSV)" onPress={handleExport} />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Reset all data" onPress={handleReset} />
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    marginTop: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
  },
  buttonContainer: {
    marginTop: 16,
  },
  stepLengthValue: {
    textAlign: 'center',
    marginVertical: 8,
  },
});
