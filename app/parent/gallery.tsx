import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { format } from 'date-fns';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface ChildDevice {
  device_id: string;
  device_name: string;
}

interface MediaItem {
  media_id: string;
  filename: string;
  media_type: string;
  creation_time?: number;
  width?: number;
  height?: number;
  duration?: number;
  location_latitude?: number;
  location_longitude?: number;
}

export default function ParentGallery() {
  const [children, setChildren] = useState<ChildDevice[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildDevice | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'location'>('date');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      loadMedia(selectedChild.device_id);
    }
  }, [selectedChild]);

  const loadData = async () => {
    try {
      const deviceId = await AsyncStorage.getItem('device_id');
      if (!deviceId) return;

      const response = await axios.get(
        `${BACKEND_URL}/api/devices/parent/${deviceId}/children`
      );
      setChildren(response.data);

      if (response.data.length > 0 && !selectedChild) {
        setSelectedChild(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMedia = async (childDeviceId: string) => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/media/${childDeviceId}`
      );
      setMedia(response.data);
    } catch (error) {
      console.error('Error loading media:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    if (selectedChild) {
      await loadMedia(selectedChild.device_id);
    }
    setRefreshing(false);
  };

  const getSortedMedia = () => {
    if (sortBy === 'date') {
      return [...media].sort((a, b) => {
        const timeA = a.creation_time || 0;
        const timeB = b.creation_time || 0;
        return timeB - timeA;
      });
    } else {
      return [...media].filter(
        (item) => item.location_latitude && item.location_longitude
      );
    }
  };

  const renderMediaItem = ({ item }: { item: MediaItem }) => (
    <View style={styles.mediaCard}>
      <View style={styles.mediaIcon}>
        <Ionicons
          name={item.media_type === 'video' ? 'videocam' : 'image'}
          size={40}
          color="#007AFF"
        />
      </View>
      <View style={styles.mediaDetails}>
        <Text style={styles.mediaFilename} numberOfLines={1}>
          {item.filename}
        </Text>
        {item.creation_time && (
          <View style={styles.mediaInfo}>
            <Ionicons name="calendar" size={14} color="#666" />
            <Text style={styles.mediaInfoText}>
              {format(new Date(item.creation_time), 'PPp')}
            </Text>
          </View>
        )}
        {item.width && item.height && (
          <View style={styles.mediaInfo}>
            <Ionicons name="resize" size={14} color="#666" />
            <Text style={styles.mediaInfoText}>
              {item.width} × {item.height}
            </Text>
          </View>
        )}
        {item.duration && (
          <View style={styles.mediaInfo}>
            <Ionicons name="time" size={14} color="#666" />
            <Text style={styles.mediaInfoText}>
              {Math.round(item.duration)}s
            </Text>
          </View>
        )}
        {item.location_latitude && item.location_longitude && (
          <View style={styles.mediaInfo}>
            <Ionicons name="location" size={14} color="#666" />
            <Text style={styles.mediaInfoText}>
              {item.location_latitude.toFixed(4)}, {item.location_longitude.toFixed(4)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Gallery</Text>
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
          <Text style={styles.headerTitle}>Gallery</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>No Child Devices</Text>
          <Text style={styles.emptyText}>
            Set up a child device to view gallery
          </Text>
        </View>
      </View>
    );
  }

  const sortedMedia = getSortedMedia();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gallery</Text>
      </View>

      {/* Child Selector */}
      <View style={styles.childSelector}>
        <FlatList
          horizontal
          data={children}
          keyExtractor={(item) => item.device_id}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.childChip,
                selectedChild?.device_id === item.device_id &&
                  styles.childChipSelected,
              ]}
              onPress={() => setSelectedChild(item)}
            >
              <Text
                style={[
                  styles.childChipText,
                  selectedChild?.device_id === item.device_id &&
                    styles.childChipTextSelected,
                ]}
              >
                {item.device_name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === 'date' && styles.sortButtonActive,
          ]}
          onPress={() => setSortBy('date')}
        >
          <Text
            style={[
              styles.sortButtonText,
              sortBy === 'date' && styles.sortButtonTextActive,
            ]}
          >
            Date
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === 'location' && styles.sortButtonActive,
          ]}
          onPress={() => setSortBy('location')}
        >
          <Text
            style={[
              styles.sortButtonText,
              sortBy === 'location' && styles.sortButtonTextActive,
            ]}
          >
            Location
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sortedMedia}
        keyExtractor={(item) => item.media_id}
        renderItem={renderMediaItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No Media</Text>
            <Text style={styles.emptyText}>
              {sortBy === 'location'
                ? 'No media with location data'
                : 'Pull down to refresh or wait for the child device to sync media'}
            </Text>
          </View>
        }
      />
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
  childSelector: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  childChip: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  childChipSelected: {
    backgroundColor: '#007AFF',
  },
  childChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  childChipTextSelected: {
    color: '#fff',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 12,
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#333',
  },
  sortButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  mediaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mediaIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mediaDetails: {
    flex: 1,
  },
  mediaFilename: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  mediaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  mediaInfoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
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
    paddingHorizontal: 40,
  },
});
