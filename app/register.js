import { Ionicons } from '@expo/vector-icons';
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

const BACKEND_API_URL = 'https://cobalt-unretired-fastness.ngrok-free.dev';

export default function RegisterScreen() {
  const router = useRouter();
  
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);

const handleRegister = async () => {
    if (!username || !password || !confirmPassword) {
      Alert.alert("알림", "모든 필드를 입력해주세요.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("알림", "비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    if (username.length < 4) {
      Alert.alert("알림", "아이디는 4자 이상 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${BACKEND_API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();
      
      console.log("서버 응답 상태:", response.status);
      console.log("서버 응답 데이터:", result);

      const isDuplicate = result.message?.includes("이미 존재하는") || result.msg?.includes("이미 존재하는");

      if (response.ok && !isDuplicate) {
        Alert.alert("성공", "회원가입이 완료되었습니다!", [
          { text: "확인", onPress: () => router.back() }
        ]);
      } else {
        Alert.alert("회원가입 실패", result.message || result.msg || "가입에 실패했습니다.");
      }
    } catch (error) {
      console.error("통신 에러:", error);
      Alert.alert("오류", "서버와 연결할 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Get Started</Text>
          <Text style={styles.subTitle}>Create an account to save your learning data</Text>
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Username</Text>
          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.input}
              placeholder="Enter your username"
              value={username}
              onChangeText={setUsername}
              placeholderTextColor="#ADB5BD"
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
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              placeholderTextColor="#ADB5BD"
              secureTextEntry={!passwordVisible}
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TouchableOpacity style={styles.eyeButton} onPress={() => setPasswordVisible(!passwordVisible)}>
              <Ionicons name={passwordVisible ? "eye-outline" : "eye-off-outline"} size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Confirm Password</Text>
          <View style={[styles.inputContainer, styles.passwordRow]}>
            <TextInput 
              style={[styles.input, { flex: 1, borderWidth: 0, paddingHorizontal: 0 }]} 
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholderTextColor="#ADB5BD"
              secureTextEntry={!confirmPasswordVisible}
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TouchableOpacity style={styles.eyeButton} onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}>
              <Ionicons name={confirmPasswordVisible ? "eye-outline" : "eye-off-outline"} size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.registerButtonText}>Register</Text>}
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.footerLinkText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 56 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  contentContainer: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 24 },
  titleSection: { marginBottom: 32 },
  mainTitle: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  subTitle: { fontSize: 14, color: '#6B7280' },
  inputWrapper: { marginBottom: 18 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputContainer: { height: 52, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#F9FAFB', justifyContent: 'center' },
  passwordRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: { fontSize: 15, color: '#111827', width: '100%', height: '100%' },
  eyeButton: { padding: 4 },
  registerButton: { backgroundColor: '#3b82f6', height: 52, justifyContent: 'center', alignItems: 'center', borderRadius: 12, marginTop: 16, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 },
  registerButtonDisabled: { backgroundColor: '#93c5fd' },
  registerButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#6B7280', fontSize: 14 },
  footerLinkText: { color: '#3b82f6', fontSize: 14, fontWeight: '600' },
});