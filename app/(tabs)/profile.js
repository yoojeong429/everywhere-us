import { useRouter } from 'expo-router'; // 1. useRouter 임포트
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const router = useRouter(); // 2. router 객체 생성

  const handleLoginPress = () => {
    // 3. /login 경로로 이동 (tabs 밖에 있으므로 그냥 /login)
    router.push('/login'); 
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>내 프로필</Text>
      
      {/* 이미지 속 디자인을 위해 만든 로그인 버튼 역할 */}
      <TouchableOpacity style={styles.button} onPress={handleLoginPress}>
        <Text style={styles.buttonText}>로그인하러 가기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#1A1C1E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});