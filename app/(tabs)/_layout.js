import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

export default function TabLayout() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      setIsLoggedIn(!!token); 
    } catch (e) {
      console.error("탭 레이아웃 토큰 확인 에러:", e);
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabContainer,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconBox}>
              <Ionicons name={focused ? "home" : "home-outline"} size={28} color={focused ? "#3b82f6" : "#222"} />
              {focused && <View style={styles.blueDot} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="feedback"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconBox}>
              <Ionicons name={focused ? "book" : "book-outline"} size={26} color={focused ? "#3b82f6" : "#222"} />
              {focused && <View style={styles.blueDot} />}
            </View>
          ),
        }}

      />
     {}
      <Tabs.Screen
        name="camera" 
        listeners={{
          tabPress: (e) => {
            e.preventDefault(); 
            router.push('/camera_full'); 
          },
        }}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconBox}>
              <Ionicons name={focused ? "camera" : "camera-outline"} size={28} color={focused ? "#3b82f6" : "#222"} />
              {focused && <View style={styles.blueDot} />}
            </View>
          ),
        }}
      />
      
    {}
      {}
      <Tabs.Screen
        name="profile"
        listeners={{
          tabPress: async (e) => {
            
            const token = await AsyncStorage.getItem('userToken');
            
            if (!token) {
              e.preventDefault();
              router.push('/login');
            }
     
          },
        }}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconBox}>
              <Ionicons 
                name={focused ? "person" : "person-outline"} 
                size={28} 
                color={focused ? "#3b82f6" : "#222"} 
              />
              {}
              {focused && <View style={styles.blueDot} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    height: 70,
    backgroundColor: '#ffffff',
    borderRadius: 35,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    borderTopWidth: 0,
    paddingBottom: 0, 
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Platform.OS === 'ios' ? 15 : 0, 
    height: '100%',
  },
  blueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3b82f6',
    marginTop: 4,
  }
});