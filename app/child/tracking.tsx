import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  ScrollView,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Contacts from 'expo-contacts';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const LOCATION_TASK_NAME = 'background-location-task';
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ChildTracking() {
  const [deviceName, setDeviceName] = useState('');
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadDeviceInfo();
    checkTrackingStatus();
  }, []);

  const loadDeviceInfo = async () => {
    const name = await AsyncStorage.getItem('device_name');
    setDeviceName(name || 'This Device');
  };

  const checkTrackingStatus = async () => {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    setIsTracking(isRegistered);
  };

  const requestPermissions = async () => {
    try {
      // Location Permission
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for tracking.');
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        Alert.alert(
          'Background Permission',
          'Background location permission is required for continuous tracking.'
        );
        return false;
      }

      // Contacts Permission
      const { status: contactsStatus } = await Contacts.requestPermissionsAsync();
      if (contactsStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Contacts permission is required.');
      }

      // Media Library Permission
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
      if (mediaStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Media library permission is required.');
      }

      setLocationEnabled(true);
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  const startTracking = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    try {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 60000, // Update every 1 minute
        distanceInterval: 50, // Or when moved 50 meters
        foregroundService: {
          notificationTitle: 'Family Safety Tracker',
          notificationBody: 'Location tracking is active',
          notificationColor: '#007AFF',
        },
      });

      setIsTracking(true);
      Alert.alert('Tracking Started', 'Location tracking is now active in the background.');
      
      // Initial sync
      await syncAllData();
    } catch (error) {
      console.error('Error starting tracking:', error);
      Alert.alert('Error', 'Failed to start location tracking.');
    }
  };

  const stopTracking = async () => {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
      if (isRegistered) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }
      setIsTracking(false);
      Alert.alert('Tracking Stopped', 'Location tracking has been stopped.');
    } catch (error) {
      console.error('Error stopping tracking:', error);
    }
  };

  const syncAllData = async () => {
    try {
      const deviceId = await AsyncStorage.getItem('device_id');
      if (!deviceId) return;

      // Sync Contacts
      await syncContacts(deviceId);

      // Sync Gallery Metadata
      await syncGalleryMetadata(deviceId);

      // Sync Current Location
      await syncCurrentLocation(deviceId);

      setLastSync(new Date());
      Alert.alert('Success', 'All data synced successfully!');
    } catch (error) {
      console.error('Error syncing data:', error);
      Alert.alert('Error', 'Failed to sync some data. Please try again.');
    }
  };

  const syncContacts = async (deviceId: string) => {
    try {
      const { status } = await Contacts.getPermissionsAsync();
      if (status !== 'granted') return;

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      });

      const contacts = data.map((contact) => ({
        id: contact.id,
        name: contact.name || 'Unknown',
        phoneNumbers: contact.phoneNumbers?.map((p) => p.number || '') || [],
        emails: contact.emails?.map((e) => e.email || '') || [],
      }));

      await axios.post(`${BACKEND_URL}/api/contacts/batch`, {
        device_id: deviceId,
        contacts,
      });

      console.log('Contacts synced:', contacts.length);
    } catch (error) {
      console.error('Error syncing contacts:', error);
    }
  };

  const syncGalleryMetadata = async (deviceId: string) => {
    try {
      const { status } = await MediaLibrary.getPermissionsAsync();
      if (status !== 'granted') return;

      const media = await MediaLibrary.getAssetsAsync({
        first: 1000,
        mediaType: ['photo', 'video'],
        sortBy: ['creationTime'],
      });

      const mediaItems = media.assets.map((asset) => ({
        id: asset.id,
        filename: asset.filename,
        mediaType: asset.mediaType,
        creationTime: asset.creationTime,
        modificationTime: asset.modificationTime,
        width: asset.width,
        height: asset.height,
        duration: asset.duration,
        location: asset.location
          ? {
              latitude: asset.location.latitude,
              longitude: asset.location.longitude,
            }
          : null,
      }));

      await axios.post(`${BACKEND_URL}/api/media/batch`, {
        device_id: deviceId,
        media_items: mediaItems,
      });

      console.log('Media metadata synced:', mediaItems.length);
    } catch (error) {
      console.error('Error syncing gallery metadata:', error);
    }
  };

  const syncCurrentLocation = async (deviceId: string) => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      await axios.post(`${BACKEND_URL}/api/locations`, {
        device_id: deviceId,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        speed: location.coords.speed,
        heading: location.coords.heading,
      });

      console.log('Location synced');
    } catch (error) {
      console.error('Error syncing location:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? This will stop tracking.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await stopTracking();
            await AsyncStorage.clear();
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="phone-portrait" size={60} color="#007AFF" />
        <Text style={styles.title}>{deviceName}</Text>
        <Text style={styles.subtitle}>Child Mode</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={isTracking ? 'checkmark-circle' : 'alert-circle'}
              size={32}
              color={isTracking ? '#34C759' : '#FF9500'}
            />
            <Text style={styles.statusTitle}>
              {isTracking ? 'Tracking Active' : 'Tracking Inactive'}
            </Text>
          </View>
          <Text style={styles.statusDescription}>
            {isTracking
              ? 'Your location is being shared with your parents'
              : 'Start tracking to share your location'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tracking Controls</Text>

          {!isTracking ? (
            <TouchableOpacity style={styles.startButton} onPress={startTracking}>
              <Ionicons name="play" size={24} color="#fff" />
              <Text style={styles.startButtonText}>Start Tracking</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.stopButton} onPress={stopTracking}>
              <Ionicons name="stop" size={24} color="#fff" />
              <Text style={styles.stopButtonText}>Stop Tracking</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manual Sync</Text>
          <TouchableOpacity style={styles.syncButton} onPress={syncAllData}>
            <Ionicons name="sync" size={24} color="#007AFF" />
            <Text style={styles.syncButtonText}>Sync All Data Now</Text>
          </TouchableOpacity>
          {lastSync && (
            <Text style={styles.lastSyncText}>
              Last synced: {lastSync.toLocaleTimeString()}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's Being Shared</Text>
          <View style={styles.infoItem}>
            <Ionicons name="location" size={24} color="#007AFF" />
            <Text style={styles.infoText}>Real-time location updates</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="people" size={24} color="#007AFF" />
            <Text style={styles.infoText}>Contact list</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="images" size={24} color="#007AFF" />
            <Text style={styles.infoText}>Gallery metadata (titles & dates)</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Background task handler
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location error:', error);
    return;
  }

  if (data) {
    const { locations } = data as any;
    const location = locations[0];

    try {
      const deviceId = await AsyncStorage.getItem('device_id');
      if (!deviceId) return;

      await axios.post(`${BACKEND_URL}/api/locations`, {
        device_id: deviceId,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        speed: location.coords.speed,
        heading: location.coords.heading,
      });

      console.log('Background location update sent');
    } catch (error) {
      console.error('Error sending background location:', error);
    }
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  content: {
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
    marginLeft: 44,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    borderRadius: 12,
    padding: 16,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 16,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  syncButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  lastSyncText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FF3B30',
    marginTop: 16,
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
