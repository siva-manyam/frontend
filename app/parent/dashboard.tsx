import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { format } from 'date-fns';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width } = Dimensions.get('window');

interface ChildDevice {
  device_id: string;
  device_name: string;
  last_active: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  speed?: number;
}

export default function ParentDashboard() {
  const [children, setChildren] = useState<ChildDevice[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildDevice | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      loadChildLocation(selectedChild.device_id);
    }
  }, [selectedChild]);

  const loadData = async () => {
    try {
      const deviceId = await AsyncStorage.getItem('device_id');
      if (!deviceId) return;

      // Get child devices
      const response = await axios.get(
        `${BACKEND_URL}/api/devices/parent/${deviceId}/children`
      );
      setChildren(response.data);

      // Select first child by default
      if (response.data.length > 0 && !selectedChild) {
        setSelectedChild(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load children devices.');
    } finally {
      setLoading(false);
    }
  };

  const loadChildLocation = async (childDeviceId: string) => {
    try {
      // Get latest location
      const latestResponse = await axios.get(
        `${BACKEND_URL}/api/locations/${childDeviceId}/latest`
      );
      setCurrentLocation(latestResponse.data);

      // Get location history
      const historyResponse = await axios.get(
        `${BACKEND_URL}/api/locations/${childDeviceId}/history?limit=50`
      );
      setLocationHistory(historyResponse.data);
    } catch (error) {
      console.error('Error loading child location:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    if (selectedChild) {
      await loadChildLocation(selectedChild.device_id);
    }
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Location Tracking</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (children.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Location Tracking</Text>
        </View>
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Ionicons name="phone-portrait-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>No Child Devices</Text>
          <Text style={styles.emptyText}>
            Set up a child device to start tracking
          </Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Location Tracking</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Child Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Child Device</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {children.map((child) => (
              <TouchableOpacity
                key={child.device_id}
                style={[
                  styles.childCard,
                  selectedChild?.device_id === child.device_id &&
                    styles.childCardSelected,
                ]}
                onPress={() => setSelectedChild(child)}
              >
                <Ionicons
                  name="phone-portrait"
                  size={32}
                  color={
                    selectedChild?.device_id === child.device_id
                      ? '#fff'
                      : '#007AFF'
                  }
                />
                <Text
                  style={[
                    styles.childName,
                    selectedChild?.device_id === child.device_id &&
                      styles.childNameSelected,
                  ]}
                >
                  {child.device_name}
                </Text>
                <Text
                  style={[
                    styles.childStatus,
                    selectedChild?.device_id === child.device_id &&
                      styles.childStatusSelected,
                  ]}
                >
                  {child.last_active
                    ? `Active ${format(
                        new Date(child.last_active),
                        'MMM d, h:mm a'
                      )}`
                    : 'Inactive'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Current Location */}
        {selectedChild && currentLocation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Location</Text>
            <View style={styles.locationCard}>
              <View style={styles.coordinatesContainer}>
                <Ionicons name="location" size={48} color="#007AFF" />
                <View style={styles.coordinates}>
                  <Text style={styles.coordinateLabel}>Latitude</Text>
                  <Text style={styles.coordinateValue}>
                    {currentLocation.latitude.toFixed(6)}
                  </Text>
                  <Text style={styles.coordinateLabel}>Longitude</Text>
                  <Text style={styles.coordinateValue}>
                    {currentLocation.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.mapLinkButton}
                onPress={() => {
                  const url = `https://www.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}`;
                  Alert.alert('Open in Maps', `View location at:\n${url}`);
                }}
              >
                <Ionicons name="map" size={20} color="#007AFF" />
                <Text style={styles.mapLinkText}>Open in Google Maps</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.locationInfo}>
              <View style={styles.locationInfoRow}>
                <Ionicons name="time" size={20} color="#666" />
                <Text style={styles.locationInfoText}>
                  {format(new Date(currentLocation.timestamp), 'PPp')}
                </Text>
              </View>
              {currentLocation.accuracy && (
                <View style={styles.locationInfoRow}>
                  <Ionicons name="locate" size={20} color="#666" />
                  <Text style={styles.locationInfoText}>
                    Accuracy: {Math.round(currentLocation.accuracy)}m
                  </Text>
                </View>
              )}
              {currentLocation.speed && (
                <View style={styles.locationInfoRow}>
                  <Ionicons name="speedometer" size={20} color="#666" />
                  <Text style={styles.locationInfoText}>
                    Speed: {Math.round(currentLocation.speed * 3.6)} km/h
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Location History */}
        {selectedChild && locationHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location History</Text>
            <View style={styles.historyContainer}>
              {locationHistory.slice(0, 10).map((loc, index) => (
                <View key={index} style={styles.historyItem}>
                  <Ionicons name="location" size={24} color="#007AFF" />
                  <View style={styles.historyDetails}>
                    <Text style={styles.historyText}>
                      {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                    </Text>
                    <Text style={styles.historyTime}>
                      {format(new Date(loc.timestamp), 'PPp')}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {selectedChild && !currentLocation && (
          <View style={styles.noDataContainer}>
            <Ionicons name="location-outline" size={60} color="#ccc" />
            <Text style={styles.noDataText}>No location data available</Text>
            <Text style={styles.noDataSubtext}>
              Pull down to refresh or wait for the child device to sync
            </Text>
          </View>
        )}
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
  scrollView: {
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
  childCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 140,
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  childCardSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  childNameSelected: {
    color: '#fff',
  },
  childStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  childStatusSelected: {
    color: '#E5E5EA',
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  coordinates: {
    flex: 1,
    marginLeft: 16,
  },
  coordinateLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginTop: 8,
  },
  coordinateValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginTop: 2,
  },
  mapLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  mapLinkText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  locationInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  locationInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationInfoText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  historyContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyDetails: {
    flex: 1,
    marginLeft: 12,
  },
  historyText: {
    fontSize: 14,
    color: '#333',
  },
  historyTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
