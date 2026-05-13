// ... 상단 import 부분에 Alert 추가
import { Alert } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [passwordVisible, setPasswordVisible] = useState(false);
  
  // [추가] 사용자가 입력한 값을 담을 변수
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // [추가] 로그인 버튼 클릭 시 실행할 함수
  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("알림", "이메일과 비밀번호를 입력해주세요.");
      return;
    }
    console.log("입력된 데이터:", email, password); // 확인용
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ... 뒤로가기 버튼 등 생략 ... */}

      {/* 3. 입력 필드 (이메일) - [수정] */}
      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.input}
          placeholder="Enter your email"
          value={email} // 추가
          onChangeText={setEmail} // 추가
          placeholderTextColor="#ADB5BD"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* 4. 입력 필드 (비밀번호) - [수정] */}
      <View style={[styles.inputContainer, styles.passwordRow]}>
        <TextInput 
          style={styles.input}
          placeholder="Enter your password"
          value={password} // 추가
          onChangeText={setPassword} // 추가
          placeholderTextColor="#ADB5BD"
          secureTextEntry={!passwordVisible}
        />
        {/* ... 눈 아이콘 버튼 생략 ... */}
      </View>

      {/* 6. 로그인 버튼 - [수정] */}
      <TouchableOpacity 
        style={styles.loginButton}
        onPress={handleLogin} // handleLogin 함수 연결
      >
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>

      {/* ... 나머지 소셜 로그인 등은 동일 ... */}
    </SafeAreaView>
  );
}