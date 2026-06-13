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
      setIsLoggedIn(!!token); // 토큰이 존재하면 true, 없으면 false
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
     {/* [수정] 카메라 버튼: 탭 바에 아이콘은 유지하지만, 클릭 시 외부 화면을 띄움 */}
      <Tabs.Screen
        name="camera" // 이 이름은 유지하되
        listeners={{
          tabPress: (e) => {
            e.preventDefault(); // 1. 원래 탭 이동 동작을 막습니다.
            router.push('/camera_full'); // 2. 탭 바가 없는 외부의 'camera_full' 페이지로 강제 이동시킵니다.
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
      
      {/* [수정] profile 탭 설정 */}
      {/* profile 탭 설정 */}
      <Tabs.Screen
        name="profile"
        listeners={{
          tabPress: async (e) => {
            // 💡 탭을 누르는 순간 로컬 스토리지에서 최신 토큰 상태를 읽어옵니다.
            const token = await AsyncStorage.getItem('userToken');
            
            if (!token) {
              // 1. 토큰이 없다면 원래의 프로필 화면 이동을 막고 로그인 페이지로 보냅니다.
              e.preventDefault();
              router.push('/login');
            }
            // 2. 토큰이 있다면 e.preventDefault()가 실행되지 않아서 
            // 원래 목적지인 'profile' 화면으로 자연스럽게 진입하게 됩니다!
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
              {/* 💡 로그인이 되어 프로필 화면에 성공적으로 들어왔을 때만 하단 파란 점을 띄워줍니다. */}
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
    // [수정] 하단 패딩을 제거하여 아이콘이 중앙에 오도록 조정
    paddingBottom: 0, 
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
    // [수정] OS별 마진을 최적화하여 아이콘을 세로 중앙 정렬
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