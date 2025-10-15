import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ParentSettings() {
  const [deviceName, setDeviceName] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const name = await AsyncStorage.getItem('device_name');
    setDeviceName(name || 'Parent Device');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace('/');
          },
        },
      ]
    );
  };

  const clearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will remove all tracking data from the server. This action cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            Alert.alert('Info', 'Data clearing feature will be implemented.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Device Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Information</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Ionicons name="phone-portrait" size={24} color="#007AFF" />
              <Text style={styles.infoText}>{deviceName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark" size={24} color="#34C759" />
              <Text style={styles.infoText}>Parent Mode</Text>
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications" size={24} color="#007AFF" />
                <Text style={styles.settingText}>Enable Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              />
            </View>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle" size={24} color="#666" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoText}>Family Safety Tracker</Text>
                <Text style={styles.infoSubtext}>Version 1.0.0</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Device Pairing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Management</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/parent/pair-device')}
          >
            <Ionicons name="link-outline" size={24} color="#007AFF" />
            <Text style={[styles.actionText, { color: '#007AFF' }]}>
              Pair New Child Device
            </Text>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.actionButton} onPress={clearData}>
            <Ionicons name="trash-outline" size={24} color="#FF9500" />
            <Text style={[styles.actionText, { color: '#FF9500' }]}>
              Clear All Data
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            <Text style={[styles.actionText, { color: '#FF3B30' }]}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Ionicons name="lock-closed" size={20} color="#666" />
          <Text style={styles.privacyText}>
            This app is designed for family safety purposes. All tracking requires
            explicit consent from monitored devices.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  infoTextContainer: {
    marginLeft: 16,
  },
  infoSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 16,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    marginTop: 0,
  },
  privacyText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    lineHeight: 20,
  },
});
