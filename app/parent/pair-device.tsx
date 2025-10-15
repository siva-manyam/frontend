import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  Clipboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PairDevice() {
  const [pairingCode, setPairingCode] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const router = useRouter();

  useEffect(() => {
    generatePairingCode();
  }, []);

  const generatePairingCode = async () => {
    const id = await AsyncStorage.getItem('device_id');
    setDeviceId(id || '');
    // Generate a 6-digit pairing code based on device ID
    const code = id ? id.slice(-6).toUpperCase() : '000000';
    setPairingCode(code);
  };

  const copyToClipboard = () => {
    Clipboard.setString(deviceId);
    Alert.alert('Copied!', 'Parent Device ID copied to clipboard');
  };

  const shareDeviceId = async () => {
    try {
      await Share.share({
        message: `Family Safety Tracker - Parent Device\n\nPairing Code: ${pairingCode}\nDevice ID: ${deviceId}\n\nEnter this information on the child device to connect.`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pair Child Device</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="link" size={80} color="#007AFF" />
        </View>

        <Text style={styles.title}>Connect a Child Device</Text>
        <Text style={styles.description}>
          Share this pairing code with the child device to establish connection
        </Text>

        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>Pairing Code</Text>
          <View style={styles.codeBox}>
            <Text style={styles.code}>{pairingCode}</Text>
          </View>
        </View>

        <View style={styles.deviceIdContainer}>
          <Text style={styles.deviceIdLabel}>Parent Device ID</Text>
          <View style={styles.deviceIdBox}>
            <Text style={styles.deviceId} numberOfLines={1}>
              {deviceId}
            </Text>
          </View>
        </View>

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Instructions:</Text>
          <Text style={styles.instruction}>1. Open the app on child device</Text>
          <Text style={styles.instruction}>2. Select "Child Mode"</Text>
          <Text style={styles.instruction}>
            3. Enter the Parent Device ID when prompted
          </Text>
          <Text style={styles.instruction}>4. Start tracking</Text>
        </View>

        <TouchableOpacity style={styles.shareButton} onPress={shareDeviceId}>
          <Ionicons name="share-outline" size={24} color="#fff" />
          <Text style={styles.shareButtonText}>Share Pairing Info</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
          <Ionicons name="copy-outline" size={20} color="#007AFF" />
          <Text style={styles.copyButtonText}>Copy Device ID</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  codeContainer: {
    width: '100%',
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  codeBox: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  code: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 8,
  },
  deviceIdContainer: {
    width: '100%',
    marginBottom: 32,
  },
  deviceIdLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  deviceIdBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  deviceId: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
  instructionsContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 12,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  copyButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
