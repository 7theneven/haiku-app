import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export default function HaikuScreen({ navigation }: any) {
  const [haiku, setHaiku] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');

  const calculateTimeUntilNext = async () => {
    const storedTime = await AsyncStorage.getItem('haikuTime');
    if (storedTime) {
      const haikuTime = new Date(storedTime);
      const now = new Date();
      
      // Set the target time for today
      const targetTime = new Date(now);
      targetTime.setHours(haikuTime.getHours());
      targetTime.setMinutes(haikuTime.getMinutes());
      targetTime.setSeconds(0);
      
      // If the time has passed today, set it for tomorrow
      if (targetTime < now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
      // Calculate the difference
      const diff = targetTime.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeUntilNext(`Next daily haiku in ${hours}h ${minutes}m`);
    }
  };

  useEffect(() => {
    calculateTimeUntilNext();
    const interval = setInterval(calculateTimeUntilNext, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchHaiku = async () => {
        console.log('Screen focused, checking for new haiku...');
        setLoading(true);
        setError(null);
        setHaiku(null);

        // Check if we need to generate a new haiku
        const storedTime = await AsyncStorage.getItem('haikuTime');
        const lastHaikuTime = await AsyncStorage.getItem('lastHaikuTime');
        const currentHaiku = await AsyncStorage.getItem('currentHaiku');
        
        console.log('Stored time:', storedTime);
        console.log('Last haiku time:', lastHaikuTime);
        console.log('Current haiku exists:', !!currentHaiku);
        
        if (storedTime) {
          const now = new Date();
          const haikuTime = new Date(storedTime);
          
          // Set the target time for today
          const targetTime = new Date(now);
          targetTime.setHours(haikuTime.getHours());
          targetTime.setMinutes(haikuTime.getMinutes());
          targetTime.setSeconds(0);
          
          console.log('Current time:', now.toISOString());
          console.log('Target time:', targetTime.toISOString());
          
          // Generate new haiku if:
          // 1. No haiku exists yet, OR
          // 2. Target time has passed today and we haven't generated a haiku yet
          if (!currentHaiku || (targetTime <= now && (!lastHaikuTime || new Date(lastHaikuTime).getDate() !== now.getDate()))) {
            console.log('Attempting to generate new haiku...');
            try {
              console.log('Making API request to Groq...');
              const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${GROQ_API_KEY}`,
                },
                body: JSON.stringify({
                  model: 'llama-3.3-70b-versatile',
                  messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: 'Pick a random word related to nature, love, sea, forest, soul or body, and write a haiku about it. Make it beautiful, uplifting, and heartwarming. Return only the haiku, no other text.' },
                  ],
                  max_tokens: 60,
                  temperature: 2.0,
                }),
              });
              console.log('API Response status:', response.status);
              if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData);
                throw new Error(`Failed to generate haiku: ${errorData.error?.message || 'Unknown error'}`);
              }
              const data = await response.json();
              console.log('API Response data:', data);
              const text = data.choices?.[0]?.message?.content?.trim();
              if (!text) {
                console.error('No haiku content in response');
                throw new Error('No haiku content in response');
              }
              console.log('Generated haiku:', text);
              if (isActive) {
                setHaiku(text);
                // Store the current time as the last haiku generation time
                await AsyncStorage.setItem('lastHaikuTime', now.toISOString());
                await AsyncStorage.setItem('currentHaiku', text);
                console.log('Stored new haiku and generation time');
              }
            } catch (err: any) {
              console.error('Error generating haiku:', err);
              if (isActive) setError(err.message || 'Failed to generate haiku. Please try again.');
            } finally {
              if (isActive) setLoading(false);
            }
          } else {
            console.log('Loading existing haiku...');
            // Load the existing haiku
            const storedHaiku = await AsyncStorage.getItem('currentHaiku');
            console.log('Stored haiku:', storedHaiku);
            if (isActive) {
              setHaiku(storedHaiku || 'No haiku available.');
              setLoading(false);
            }
          }
        } else {
          console.log('No stored time found');
          setLoading(false);
        }
      };
      fetchHaiku();
      return () => {
        isActive = false;
      };
    }, [])
  );

  // Add a refresh interval
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    
    const checkForNewHaiku = async () => {
      const storedTime = await AsyncStorage.getItem('haikuTime');
      const lastHaikuTime = await AsyncStorage.getItem('lastHaikuTime');
      
      if (storedTime) {
        const now = new Date();
        const haikuTime = new Date(storedTime);
        const targetTime = new Date(now);
        targetTime.setHours(haikuTime.getHours());
        targetTime.setMinutes(haikuTime.getMinutes());
        targetTime.setSeconds(0);
        
        // Only log if we're within 2 minutes of the target time
        const timeDiff = targetTime.getTime() - now.getTime();
        if (Math.abs(timeDiff) <= 120000) { // 2 minutes in milliseconds
          console.log('Close to target time:', {
            current: now.toISOString(),
            target: targetTime.toISOString(),
            diffMinutes: Math.round(timeDiff / 60000)
          });
        }
        
        if (targetTime <= now && (!lastHaikuTime || new Date(lastHaikuTime).getDate() !== now.getDate())) {
          console.log('Time for new haiku, refreshing screen...');
          navigation.setParams({ refresh: Date.now() });
        }
      }
    };

    // Initial check
    checkForNewHaiku();
    
    // Set up interval
    intervalId = setInterval(checkForNewHaiku, 10000); // Check every 10 seconds

    // Cleanup
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [navigation]);

  return (
    <ImageBackground source={require('../assets/images/haiku.png')} style={styles.background} resizeMode="cover">
      <View style={styles.container}>
        <View style={styles.haikuBox}>
          {loading ? (
            <>
              <ActivityIndicator size="large" color="#000" />
              <Text style={styles.loadingText}>Generating your haiku…</Text>
            </>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <View style={styles.haikuContainer}>
              {haiku?.split('\n').map((line, idx, arr) => (
                <Text
                  key={idx}
                  style={[
                    styles.haikuText,
                    idx < arr.length - 1 && styles.haikuLineSpacing,
                  ]}
                >
                  {line}
                </Text>
              ))}
            </View>
          )}
        </View>
        <Text style={styles.countdownText}>{timeUntilNext}</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Welcome')}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.0)',
    paddingTop: '20%',
  },
  haikuBox: {
    width: '90%',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 70,
  },
  haikuContainer: {
    borderWidth: 2,
    borderColor: '#fea7a8',
    padding: 30,
    width: '100%',
  },
  haikuText: {
    fontSize: 32,
    fontFamily: 'CourierPrime-Bold',
    textAlign: 'left',
    width: '100%',
    lineHeight: 36,
  },
  haikuLineSpacing: {
    marginBottom: 24, // extra space between haiku lines
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    fontFamily: 'Sora',
  },
  errorText: {
    color: 'red',
    fontSize: 18,
    textAlign: 'center',
    fontFamily: 'Sora',
  },
  countdownText: {
    fontSize: 25,
    color: '#e58381',
    fontFamily: 'AvenirLTStd-Light',
    textAlign: 'center',
    marginBottom: 10,
    position: 'absolute',
    bottom: '17%',
    width: '100%',
  },
  button: {
    position: 'absolute',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#fea7a8',
    borderRadius: 0,
    paddingVertical: 10,
    paddingHorizontal: 30,
    backgroundColor: 'transparent',
    bottom: '10%',
    width: '90%',
  },
  buttonText: {
    fontSize: 22,
    color: '#e58381',
    fontFamily: 'AvenirLTStd-Light',
    textAlign: 'center',
    width: '100%',
  },
}); 