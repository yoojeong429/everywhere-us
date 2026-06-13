import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// 서버 주소
const BACKEND_API_URL = 'https://cobalt-unretired-fastness.ngrok-free.dev';

export default function LoginScreen() {
  const router = useRouter();
  const [passwordVisible, setPasswordVisible] = useState(false);
  
  // 💡 상태 변수명도 username으로 변경
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // 💡 유효성 검사 변수도 username으로 변경
    if (!username || !password) {
      Alert.alert("알림", "아이디와 비밀번호를 입력해주세요.");
      return;
    }
  
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); 

    try {
      const response = await fetch(`${BACKEND_API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username, // 💡 오타 수정: usernme -> username
          password: password,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      if (response.ok) {
        console.log("로그인 성공! 서버 리턴 데이터:", result);

        if (result.success === false || result.msg === "아이디 없음") {
          Alert.alert("로그인 실패", result.msg || "아이디 또는 비밀번호를 확인해주세요.");
          setIsLoading(false);
          return;}

        await AsyncStorage.setItem('userToken', result.token || 'dummy-token');
        await AsyncStorage.setItem('username', username);

        Alert.alert("성공", "로그인에 성공했습니다.", [
          { text: "확인", onPress: () => router.replace('/(tabs)') }
        ]);
      } else {
        console.log("로그인 실패 원인:", result);
        Alert.alert("로그인 실패", result.message || "아이디 또는 비밀번호를 확인해주세요.");
      }

    } catch (error) {
      clearTimeout(timeoutId);
      console.error("네트워크 통신 에러 발생:", error);
      Alert.alert(
        "오류", 
        error.name === 'AbortError' 
          ? "서버 응답 시간이 초과되었습니다. 서버가 켜져 있는지 확인하세요." 
          : "서버와 연결할 수 없습니다. 네트워크 상태를 확인해주세요."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.replace('/')} 
           >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sign In</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Welcome Back</Text>
          <Text style={styles.subTitle}>Sign in to continue your contextual learning</Text>
        </View>

        {/* 💡 Username 입력 섹션 */}
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Username</Text>
          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.input}
              placeholder="Enter your username"
              value={username}
              onChangeText={setUsername}
              placeholderTextColor="#ADB5BD"
              keyboardType="default"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={[styles.inputContainer, styles.passwordRow]}>
            <TextInput 
              style={[styles.input, { flex: 1, borderWidth: 0, paddingHorizontal: 0 }]} 
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              placeholderTextColor="#ADB5BD"
              secureTextEntry={!passwordVisible}
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TouchableOpacity 
              style={styles.eyeButton} 
              onPress={() => setPasswordVisible(!passwordVisible)}
              disabled={isLoading}
            >
              <Ionicons 
                name={passwordVisible ? "eye-outline" : "eye-off-outline"} 
                size={22} 
                color="#6B7280" 
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.forgotPasswordBtn} disabled={isLoading}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or sign in with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialGroup}>
          <TouchableOpacity style={styles.socialButton} disabled={isLoading}>
            <Ionicons name="logo-google" size={24} color="#EA4335" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton} disabled={isLoading}>
            <Ionicons name="logo-apple" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.registerLinkRow}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('../register')} disabled={isLoading}> 
            <Text style={styles.registerLinkText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ... styles는 이전과 동일합니다.

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 56 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  contentContainer: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  titleSection: { marginBottom: 32 },
  mainTitle: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  subTitle: { fontSize: 14, color: '#6B7280' },
  inputWrapper: { marginBottom: 18 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputContainer: { height: 52, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#F9FAFB', justifyContent: 'center' },
  passwordRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: { fontSize: 15, color: '#111827', width: '100%', height: '100%' },
  eyeButton: { padding: 4 },
  forgotPasswordBtn: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotPasswordText: { color: '#3b82f6', fontSize: 13, fontWeight: '600' },
  loginButton: { backgroundColor: '#3b82f6', height: 52, justifyContent: 'center', alignItems: 'center', borderRadius: 12, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 },
  loginButtonDisabled: { backgroundColor: '#93c5fd' },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 32 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { marginHorizontal: 12, color: '#9CA3AF', fontSize: 13 },
  socialGroup: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  socialButton: { width: 56, height: 56, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 28, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  registerLinkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  registerText: { color: '#6B7280', fontSize: 14 },
  registerLinkText: { color: '#3b82f6', fontSize: 14, fontWeight: '600' },
});