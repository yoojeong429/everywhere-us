import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput, // 💡 편집 모드용 입력창 추가
  TouchableOpacity,
  View
} from 'react-native';

// 💡 테스트용으로 선택할 수 있는 프로필 이미지 샘플 리스트
const AVATAR_SAMPLES = [
  'https://www.bootdey.com/img/Content/avatar/avatar1.png',
  'https://www.bootdey.com/img/Content/avatar/avatar2.png',
  'https://www.bootdey.com/img/Content/avatar/avatar3.png',
  'https://www.bootdey.com/img/Content/avatar/avatar6.png',
];

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false); // 💡 편집 모드 상태 (true면 수정 창이 뜸)
  
  // 유저 데이터 상태 관리
  const [userData, setUserData] = useState({
    username: '',
    bio: 'Contextual Learning Enthusiast',
    courses: 0,
    streak: 1,
    points: 0,
    avatar: 'https://www.bootdey.com/img/Content/avatar/avatar1.png'
  });

  // 편집용 임시 상태 변수들
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  // 1. 데이터 로드
  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const savedUsername = await AsyncStorage.getItem('username');
      const savedBio = await AsyncStorage.getItem('userBio') || 'Contextual Learning Enthusiast';
      const savedAvatar = await AsyncStorage.getItem('userAvatar') || 'https://www.bootdey.com/img/Content/avatar/avatar1.png';

      if (!token) {
        router.replace('/login');
        return;
      }

      const currentData = {
        username: savedUsername || 'User',
        bio: savedBio,
        courses: 12, // 시연용 고정 수치
        streak: 45,
        points: 2450,
        avatar: savedAvatar
      };

      setUserData(currentData);
      
      // 편집 창에 미리 기존 값 넣어두기
      setEditUsername(currentData.username);
      setEditBio(currentData.bio);
      setEditAvatar(currentData.avatar);

    } catch (e) {
      console.error("데이터 로딩 에러:", e);
      Alert.alert("오류", "프로필 정보를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 💡 2. 프로필 수정 저장 로직
  const handleSaveProfile = async () => {
    if (!editUsername.trim()) {
      Alert.alert("알림", "유저네임은 비워둘 수 없습니다.");
      return;
    }

    try {
      setLoading(true);
      // 로컬 스토리지에 변경된 정보 저장
      await AsyncStorage.setItem('username', editUsername);
      await AsyncStorage.setItem('userBio', editBio);
      await AsyncStorage.setItem('userAvatar', editAvatar);

      // 화면 UI 데이터 갱신
      setUserData({
        ...userData,
        username: editUsername,
        bio: editBio,
        avatar: editAvatar
      });

      setIsEditing(false); // 편집 모드 종료
      Alert.alert("성공", "프로필이 수정되었습니다.");
    } catch (e) {
      Alert.alert("오류", "프로필을 저장하는 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 💡 3. 사진 변경 기능 (누를 때마다 샘플 이미지 번갈아가며 변경)
  const handleChangeAvatar = () => {
    const currentIndex = AVATAR_SAMPLES.indexOf(editAvatar);
    const nextIndex = (currentIndex + 1) % AVATAR_SAMPLES.length;
    setEditAvatar(AVATAR_SAMPLES[nextIndex]);
  };

  // 4. 로그아웃
  const handleLogout = async () => {
    Alert.alert("로그아웃", "정말 로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { 
        text: "로그아웃", 
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('username');
          router.replace('/login');
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* ================= [ 헤더 & 프로필 카드 섹션 ] ================= */}
        <View style={styles.header}>
          
          {/* 📸 프로필 이미지 영역 */}
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: isEditing ? editAvatar : userData.avatar }} 
              style={styles.avatar} 
            />
            {/* 편집 모드일 때만 이미지 위에 카메라 아이콘 뱃지를 띄움 */}
            {isEditing && (
              <TouchableOpacity style={styles.avatarEditBadge} onPress={handleChangeAvatar}>
                <Ionicons name="camera" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* ✏️ 일반 모드 vs 편집 모드 조건부 UI 분기 */}
          {!isEditing ? (
            <>
              <Text style={styles.name}>{userData.username}</Text>
              <Text style={styles.handleText}>@{userData.username}</Text>
              <Text style={styles.bio}>{userData.bio}</Text>
              
              <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.editForm}>
              {/* 이름 수정 인풋 */}
              <Text style={styles.fieldLabel}>Username</Text>
              <TextInput 
                style={styles.textInput}
                value={editUsername}
                onChangeText={setEditUsername}
                placeholder="Username"
              />
              
              {/* 한줄 소개 수정 인풋 */}
              <Text style={styles.fieldLabel}>Bio</Text>
              <TextInput 
                style={styles.textInput}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Introduce yourself"
              />

              {/* 저장 / 취소 버튼 조합 */}
              <View style={styles.editButtonGroup}>
                <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={() => {
                  setIsEditing(false);
                  setEditUsername(userData.username);
                  setEditBio(userData.bio);
                  setEditAvatar(userData.avatar);
                }}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={handleSaveProfile}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ================= [ 하단 통계 및 메뉴 (기존과 동일) ] ================= */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{userData.courses}</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </View>
          <View style={[styles.statBox, styles.statDivider]}>
            <Text style={styles.statNumber}>{userData.streak}d</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{userData.points}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <MenuButton icon="person-outline" label="Personal Information" />
          <MenuButton icon="shield-checkmark-outline" label="Security & Privacy" />
          <MenuButton icon="notifications-outline" label="Notifications" />
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#ef4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const MenuButton = ({ icon, label }) => (
  <TouchableOpacity style={styles.menuItem}>
    <View style={styles.menuLeft}>
      <Ionicons name={icon} size={22} color="#4b5563" />
      <Text style={styles.menuLabel}>{label}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', paddingVertical: 35, backgroundColor: '#fff', px: 24 },
  
  // 아바타 래퍼 및 카메라 배지 스타일
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#3b82f6' },
  avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#3b82f6', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  
  name: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  handleText: { fontSize: 14, color: '#3b82f6', fontWeight: '500', marginTop: 2 },
  bio: { fontSize: 14, color: '#6b7280', marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },
  editButton: { marginTop: 16, paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, backgroundColor: '#F3F4F6' },
  editButtonText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  
  // 편집 창 폼 스타일들
  editForm: { width: '100%', paddingHorizontal: 32, marginTop: 10 },
  fieldLabel: { fontSize: 12, fontWeight: 'bold', color: '#9ca3af', marginBottom: 4, marginTop: 10, textTransform: 'uppercase' },
  textInput: { width: '100%', height: 44, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#F9FAFB', fontSize: 15, color: '#111827' },
  editButtonGroup: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 20 },
  actionBtn: { flex: 1, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F3F4F6' },
  cancelBtnText: { color: '#4B5563', fontWeight: '600' },
  saveBtn: { backgroundColor: '#3b82f6' },
  saveBtnText: { color: '#fff', fontWeight: '600' },

  statsContainer: { flexDirection: 'row', backgroundColor: '#fff', marginTop: 1, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#F3F4F6' },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  menuSection: { padding: 24 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8 },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuLabel: { fontSize: 16, color: '#374151', marginLeft: 12 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, padding: 16, borderWidth: 1, borderColor: '#fee2e2', borderRadius: 12, backgroundColor: '#fff' },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});