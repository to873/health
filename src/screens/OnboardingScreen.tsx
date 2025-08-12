import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import { estimateStepLengthM } from '../core/calc';
import { saveProfile } from '../core/storage';
import type { Profile, BmrFormula } from '../core/models';
import type { HealthService } from '../services/health/HealthService';

/**
 * Props for the onboarding screen. The parent component must provide a
 * `healthService` implementation for requesting permissions. An optional
 * callback `onDone` can be used to navigate away once onboarding is
 * complete.
 */
interface OnboardingProps {
  healthService: HealthService;
  onDone?: () => void;
}

/**
 * OnboardingScreen collects the user's anthropometric data and preferences.
 * It estimates step length based on height and sex, allows overriding via
 * slider, and requests Health permissions. Upon completion, the profile is
 * persisted and the optional `onDone` callback is invoked.
 */
export default function OnboardingScreen({ healthService, onDone }: OnboardingProps) {
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | 'other'>('male');
  const [bmrFormula, setBmrFormula] = useState<BmrFormula>('mifflin');
  const [height, setHeight] = useState(''); // metres
  const [weight, setWeight] = useState(''); // kg
  const [stepGoal, setStepGoal] = useState('10000');
  const [stepLength, setStepLength] = useState(0.7); // default metres
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  // Update estimated step length when height or sex changes
  useEffect(() => {
    const h = parseFloat(height);
    if (!isNaN(h) && h > 0) {
      const est = estimateStepLengthM(h, sex === 'male' ? 'male' : 'female');
      setStepLength(est);
    }
  }, [height, sex]);

  const handleRequestPermissions = async () => {
    try {
      const granted = await healthService.requestPermissions();
      setPermissionGranted(granted);
      if (!granted) {
        Alert.alert(
          'Permission required',
          'Step count permissions are needed to compute your daily calories.',
        );
      }
    } catch (e) {
      setPermissionGranted(false);
      Alert.alert('Error', 'Failed to request permissions.');
    }
  };

  const handleComplete = async () => {
    // Simple validation
    const heightM = parseFloat(height);
    const weightKg = parseFloat(weight);
    const ageYears = parseInt(age, 10);
    const goalSteps = parseInt(stepGoal, 10);
    if (
      isNaN(heightM) ||
      isNaN(weightKg) ||
      isNaN(ageYears) ||
      isNaN(goalSteps) ||
      heightM <= 0 ||
      weightKg <= 0 ||
      ageYears <= 0
    ) {
      Alert.alert('Invalid input', 'Please enter valid values for all fields.');
      return;
    }
    const profile: Profile = {
      id: Date.now().toString(),
      dateOfBirth: undefined,
      sex,
      heightM,
      weightKg,
      stepLengthM: stepLength,
      bmrFormula,
      stepGoal: goalSteps,
    };
    await saveProfile(profile);
    if (onDone) onDone();
    Alert.alert('Welcome!', 'Your profile has been saved.');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tell us about yourself</Text>
      <Text style={styles.label}>Age (years)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={age}
        onChangeText={setAge}
        placeholder="e.g. 30"
      />
      <Text style={styles.label}>Sex</Text>
      <Picker selectedValue={sex} onValueChange={(val) => setSex(val as any)}>
        <Picker.Item label="Male" value="male" />
        <Picker.Item label="Female" value="female" />
        <Picker.Item label="Other / Prefer not to say" value="other" />
      </Picker>
      <Text style={styles.label}>Height (metres)</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        value={height}
        onChangeText={setHeight}
        placeholder="e.g. 1.75"
      />
      <Text style={styles.label}>Weight (kg)</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        value={weight}
        onChangeText={setWeight}
        placeholder="e.g. 70"
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
      <Picker
        selectedValue={bmrFormula}
        onValueChange={(val) => setBmrFormula(val as BmrFormula)}
      >
        <Picker.Item label="Mifflin–St Jeor" value="mifflin" />
        {/* Future formulas can be added here */}
      </Picker>
      <View style={styles.buttonContainer}>
        <Button title="Request Step Permissions" onPress={handleRequestPermissions} />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Complete" onPress={handleComplete} />
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
