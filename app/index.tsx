import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useIsFocused } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, ImageBackground, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function WelcomeScreen({ navigation }: any) {
  const [name, setName] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputName, setInputName] = useState('');
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [isFading, setIsFading] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    (async () => {
      const storedName = await AsyncStorage.getItem('username');
      if (storedName) {
        setName(storedName);
        const storedTime = await AsyncStorage.getItem('haikuTime');
        if (!storedTime) {
          // Set the current time as the default haiku time
          const now = new Date();
          await AsyncStorage.setItem('haikuTime', now.toISOString());
          await scheduleDailyNotification(now);
        }
      } else {
        setModalVisible(true);
      }
    })();
  }, []);

  // Reset fadeAnim only when the screen is focused again
  useEffect(() => {
    if (isFocused) {
      fadeAnim.setValue(1);
      setIsFading(false);
    }
  }, [isFocused]);

  const handleSaveName = async () => {
    if (inputName.trim()) {
      await AsyncStorage.setItem('username', inputName.trim());
      setName(inputName.trim());
      setModalVisible(false);
    }
  };

  const scheduleDailyNotification = async (date: Date) => {
    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission for notifications not granted!');
      return;
    }
    // Cancel previous notification if any
    const prevId = await AsyncStorage.getItem('haikuNotifId');
    if (prevId) {
      try { await Notifications.cancelScheduledNotificationAsync(prevId); } catch {}
    }
    // Calculate trigger time
    const now = new Date();
    let trigger = new Date(now);
    trigger.setHours(date.getHours());
    trigger.setMinutes(date.getMinutes());
    trigger.setSeconds(0);
    if (trigger < now) trigger.setDate(trigger.getDate() + 1); // If time has passed today, schedule for tomorrow
    // Schedule notification
    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Your daily haiku is ready!',
        body: 'Open the app to read today\'s haiku.',
        sound: true,
      },
      trigger: {
        hour: date.getHours(),
        minute: date.getMinutes(),
        second: 0,
        repeats: true,
        type: 'calendar',
      } as any,
    });
    await AsyncStorage.setItem('haikuNotifId', notifId);
  };

  const handleTimeChange = async (event: any, date?: Date) => {
    if (date) {
      setSelectedTime(date);
      await AsyncStorage.setItem('haikuTime', date.toISOString());
      setTimeModalVisible(false);
      await scheduleDailyNotification(date);
    }
  };

  const handleGenerate = () => {
    if (isFading) return;
    setIsFading(true);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      navigation.navigate('Haiku');
    });
  };

  const handleResetHaikuTime = async () => {
    await AsyncStorage.removeItem('haikuTime');
    setTimeModalVisible(true);
  };

  const handleMenuPress = () => {
    setMenuVisible(!menuVisible);
  };

  const handleMenuItemPress = (action: 'name' | 'time') => {
    setMenuVisible(false);
    if (action === 'name') {
      setModalVisible(true);
    } else {
      setTimeModalVisible(true);
    }
  };

  return (
    <ImageBackground source={require('../assets/images/haiku_bw.png')} style={styles.background} resizeMode="cover">
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
          <Image source={require('../assets/images/menu.png')} style={styles.menuIcon} />
        </TouchableOpacity>
        
        {menuVisible && (
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleMenuItemPress('name')}
            >
              <Text style={styles.menuItemText}>Change your name</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleMenuItemPress('time')}
            >
              <Text style={styles.menuItemText}>Change time</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ width: '100%', alignItems: 'center', marginVertical: 200 }}>
          <Text style={styles.welcomeText}>Welcome,{"\n"}{name || 'User'}</Text>
          <TouchableOpacity style={styles.button} onPress={handleGenerate} disabled={isFading}>
            <Text style={styles.buttonText}>Go to my daily haiku!</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {}}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter your name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              value={inputName}
              onChangeText={setInputName}
              autoFocus
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <Pressable
                style={[styles.saveButton, { backgroundColor: '#f0f0f0', marginRight: 10 }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.saveButtonText, { color: '#000' }]}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={handleSaveName}>
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      {timeModalVisible && (
        <DateTimePicker
          value={selectedTime || new Date()}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={async (event, date) => {
            setTimeModalVisible(false);
            if (date) {
              await AsyncStorage.setItem('haikuTime', date.toISOString());
              await scheduleDailyNotification(date);
            }
          }}
        />
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.0)',
    width: '100%',
    paddingTop: '20%',
  },
  welcomeText: {
    fontSize: 30,
    marginBottom: 70,
    textAlign: 'center',
    fontFamily: 'AvenirLTStd-Light',
  },
  button: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 0,
    paddingVertical: 10,
    paddingHorizontal: 30,
    width: '90%',
  },
  buttonText: {
    fontSize: 22,
    color: '#000',
    fontFamily: 'AvenirLTStd-Light',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 20,
    fontFamily: 'AvenirLTStd-Light',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    width: '100%',
    marginBottom: 20,
    fontFamily: 'AvenirLTStd-Light',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'AvenirLTStd-Light',
  },
  menuButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
  },
  menuIcon: {
    width: 24,
    height: 24,
    tintColor: '#000',
  },
  menuContainer: {
    position: 'absolute',
    top: 80,
    right: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 0,
    zIndex: 1000,
    width: 200,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: 'AvenirLTStd-Light',
    color: '#000',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#000',
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'AvenirLTStd-Light',
    color: '#000',
  },
  confirmButtonText: {
    color: '#fff',
  },
}); 