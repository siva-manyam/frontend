import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface ChildDevice {
  device_id: string;
  device_name: string;
}

interface Contact {
  contact_id: string;
  name: string;
  phone_numbers: string[];
  emails: string[];
  added_date: string;
}

export default function ParentContacts() {
  const [children, setChildren] = useState<ChildDevice[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildDevice | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      loadContacts(selectedChild.device_id);
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

  const loadContacts = async (childDeviceId: string) => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/contacts/${childDeviceId}`
      );
      setContacts(response.data);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    if (selectedChild) {
      await loadContacts(selectedChild.device_id);
    }
    setRefreshing(false);
  };

  const exportContacts = async () => {
    if (contacts.length === 0) {
      Alert.alert('No Contacts', 'There are no contacts to export.');
      return;
    }

    const contactsText = contacts
      .map((contact) => {
        const phones = contact.phone_numbers.join(', ');
        const emails = contact.emails.join(', ');
        return `${contact.name}\nPhones: ${phones}\nEmails: ${emails}\n`;
      })
      .join('\n---\n\n');

    try {
      await Share.share({
        message: `Contacts from ${selectedChild?.device_name}\n\n${contactsText}`,
      });
    } catch (error) {
      console.error('Error sharing contacts:', error);
    }
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <View style={styles.contactCard}>
      <View style={styles.contactIcon}>
        <Ionicons name="person-circle" size={50} color="#007AFF" />
      </View>
      <View style={styles.contactDetails}>
        <Text style={styles.contactName}>{item.name || 'Unknown'}</Text>
        {item.phone_numbers.length > 0 && (
          <View style={styles.contactInfo}>
            <Ionicons name="call" size={16} color="#666" />
            <Text style={styles.contactInfoText}>
              {item.phone_numbers.join(', ')}
            </Text>
          </View>
        )}
        {item.emails.length > 0 && (
          <View style={styles.contactInfo}>
            <Ionicons name="mail" size={16} color="#666" />
            <Text style={styles.contactInfoText}>{item.emails.join(', ')}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Contacts</Text>
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
          <Text style={styles.headerTitle}>Contacts</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>No Child Devices</Text>
          <Text style={styles.emptyText}>
            Set up a child device to view contacts
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Contacts</Text>
        {contacts.length > 0 && (
          <TouchableOpacity style={styles.exportButton} onPress={exportContacts}>
            <Ionicons name="share-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
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

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.contact_id}
        renderItem={renderContact}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No Contacts</Text>
            <Text style={styles.emptyText}>
              Pull down to refresh or wait for the child device to sync contacts
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  exportButton: {
    padding: 8,
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
  listContainer: {
    padding: 16,
  },
  contactCard: {
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
  contactIcon: {
    marginRight: 12,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  contactInfoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    flex: 1,
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
