import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as Device from 'expo-device';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {
  const [deviceName, setDeviceName] = useState('');
  const [parentDeviceId, setParentDeviceId] = useState('');
  const [selectedMode, setSelectedMode] = useState<'parent' | 'child' | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkExistingSetup();
    setDefaultDeviceName();
  }, []);

  const setDefaultDeviceName = async () => {
    const deviceModel = Device.modelName || 'Unknown Device';
    setDeviceName(deviceModel);
  };

  const checkExistingSetup = async () => {
    try {
      const mode = await AsyncStorage.getItem('device_mode');
      const deviceId = await AsyncStorage.getItem('device_id');
      
      if (mode && deviceId) {
        // Device already set up, navigate to appropriate screen
        if (mode === 'parent') {
          router.replace('/parent/dashboard');
        } else {
          router.replace('/child/tracking');
        }
      }
    } catch (error) {
      console.error('Error checking setup:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!selectedMode) {
      Alert.alert('Error', 'Please select Parent or Child mode');
      return;
    }

    if (!deviceName.trim()) {
      Alert.alert('Error', 'Please enter a device name');
      return;
    }

    if (selectedMode === 'child' && !parentDeviceId.trim()) {
      Alert.alert('Error', 'Please enter Parent Device ID to connect');
      return;
    }

    setRegistering(true);

    try {
      // Generate a unique device ID
      let deviceId = await AsyncStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('device_id', deviceId);
      }

      // Register device with backend
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/devices/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_id: deviceId,
          device_name: deviceName,
          mode: selectedMode,
          parent_device_id: selectedMode === 'child' ? parentDeviceId.trim() : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to register device');
      }

      // Save mode and parent ID to AsyncStorage
      await AsyncStorage.setItem('device_mode', selectedMode);
      await AsyncStorage.setItem('device_name', deviceName);
      if (selectedMode === 'child') {
        await AsyncStorage.setItem('parent_device_id', parentDeviceId.trim());
      }

      // Navigate to appropriate screen
      if (selectedMode === 'parent') {
        router.replace('/parent/dashboard');
      } else {
        router.replace('/child/tracking');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Failed to register device. Please check the Parent Device ID and try again.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Ionicons name="shield-checkmark" size={60} color="#007AFF" />
          <Text style={styles.title}>Family Safety Tracker</Text>
          <Text style={styles.subtitle}>Choose your device mode</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.label}>Device Name</Text>
          <TextInput
            style={styles.input}
            value={deviceName}
            onChangeText={setDeviceName}
            placeholder="Enter device name"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Select Mode</Text>
          
          <TouchableOpacity
            style={[
              styles.modeButton,
              selectedMode === 'parent' && styles.modeButtonSelected,
            ]}
            onPress={() => setSelectedMode('parent')}
          >
            <Ionicons
              name="person"
              size={40}
              color={selectedMode === 'parent' ? '#fff' : '#007AFF'}
            />
            <View style={styles.modeTextContainer}>
              <Text
                style={[
                  styles.modeTitle,
                  selectedMode === 'parent' && styles.modeTextSelected,
                ]}
              >
                Parent Mode
              </Text>
              <Text
                style={[
                  styles.modeDescription,
                  selectedMode === 'parent' && styles.modeTextSelected,
                ]}
              >
                Monitor child devices
              </Text>
            </View>
            {selectedMode === 'parent' && (
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              selectedMode === 'child' && styles.modeButtonSelected,
            ]}
            onPress={() => setSelectedMode('child')}
          >
            <Ionicons
              name="phone-portrait"
              size={40}
              color={selectedMode === 'child' ? '#fff' : '#007AFF'}
            />
            <View style={styles.modeTextContainer}>
              <Text
                style={[
                  styles.modeTitle,
                  selectedMode === 'child' && styles.modeTextSelected,
                ]}
              >
                Child Mode
              </Text>
              <Text
                style={[
                  styles.modeDescription,
                  selectedMode === 'child' && styles.modeTextSelected,
                ]}
              >
                Share location & data with parents
              </Text>
            </View>
            {selectedMode === 'child' && (
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            )}
          </TouchableOpacity>

          {selectedMode === 'child' && (
            <View style={styles.parentIdContainer}>
              <Text style={styles.label}>Parent Device ID</Text>
              <TextInput
                style={styles.input}
                value={parentDeviceId}
                onChangeText={setParentDeviceId}
                placeholder="Enter parent device ID"
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.helpText}>
                Get this ID from the parent device's pairing screen
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.continueButton,
              (!selectedMode || registering) && styles.continueButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={!selectedMode || registering}
          >
            {registering ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.continueButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  modeButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  modeTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modeDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  modeTextSelected: {
    color: '#fff',
  },
  parentIdContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  continueButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 32,
  },
  continueButtonDisabled: {
    backgroundColor: '#ccc',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
