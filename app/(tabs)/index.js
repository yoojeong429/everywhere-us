import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Defs, Path, Stop, LinearGradient as SvgGradient } from 'react-native-svg';

// 🌐 백엔드 서버 주소
const BASE_URL = 'https://cobalt-unretired-fastness.ngrok-free.dev';

// -------------------------------------------------------------
// 🔥 리얼 스타일에 가까운 SVG 불꽃 & 연기 컴포넌트
// -------------------------------------------------------------
const RealFlameGraphic = ({ stage = 'normal', scale = 1, colors }) => {
  if (stage === 'danger_3d') {
    return (
      <View style={{ transform: [{ scale: scale * 0.9 }], alignItems: 'center' }}>
        <Svg width="120" height="150" viewBox="0 0 120 150">
          <Defs>
            <SvgGradient id="smokeGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <Stop offset="0%" stopColor="#8D8D8D" stopOpacity="0.8" />
              <Stop offset="60%" stopColor="#D1D1D1" stopOpacity="0.5" />
              <Stop offset="100%" stopColor="#EAEAEA" stopOpacity="0.0" />
            </SvgGradient>
          </Defs>
          <Path
            d="M 58 120 C 40 100, 75 80, 55 50 C 40 30, 65 15, 60 5"
            stroke="url(#smokeGrad)"
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M 64 120 C 75 105, 50 90, 68 65 C 78 45, 60 25, 65 15"
            stroke="url(#smokeGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            opacity={0.6}
          />
          <Path d="M40 132 C45 124, 75 124, 80 132 C82 136, 38 136, 40 132 Z" fill="#4A3B32" />
          <Path d="M48 130 C52 126, 68 126, 72 130 Z" fill="#6D584C" />
        </Svg>
      </View>
    );
  }

  const outerGrad = colors?.outer || ['#FF6D00', '#FF9100', '#FFD600'];
  const innerGrad = colors?.inner || ['#FFAB00', '#FFE57F', '#FFFFFF'];
  const sparkColor = colors?.spark || '#FFC400';

  const outerId = `outer_${outerGrad[1].replace('#', '')}`;
  const innerId = `inner_${innerGrad[1].replace('#', '')}`;

  return (
    <View style={{ transform: [{ scale }] }}>
      <Svg key={outerId} width="120" height="150" viewBox="0 0 120 150">
        <Defs>
          <SvgGradient id={outerId} x1="0%" y1="100%" x2="0%" y2="0%">
            <Stop offset="0%" stopColor={outerGrad[0]} />
            <Stop offset="50%" stopColor={outerGrad[1]} />
            <Stop offset="100%" stopColor={outerGrad[2]} stopOpacity="0.9" />
          </SvgGradient>

          <SvgGradient id={innerId} x1="0%" y1="100%" x2="0%" y2="0%">
            <Stop offset="0%" stopColor={innerGrad[0]} />
            <Stop offset="60%" stopColor={innerGrad[1]} />
            <Stop offset="100%" stopColor={innerGrad[2]} />
          </SvgGradient>
        </Defs>

        <Path
          d="M60 125 C30 125, 20 85, 38 55 C48 70, 52 50, 60 20 C68 50, 72 70, 82 55 C100 85, 90 125, 60 125 Z"
          fill={`url(#${outerId})`}
          opacity={0.4}
          transform="scale(1.08) translate(-4, -5)"
        />

        <Path d="M 32 40 L 35 48 L 28 46 Z" fill={sparkColor} opacity={0.8} />
        <Path d="M 118 32 L 122 40 L 115 38 Z" fill={sparkColor} opacity={0.8} />
        <Circle cx="22" cy="78" r="2.5" fill={sparkColor} opacity={0.9} />
        <Circle cx="132" cy="120" r="3" fill={sparkColor} opacity={0.9} />

        <Path
          d="M60 125 C30 125, 20 85, 38 55 C48 70, 52 50, 60 20 C68 50, 72 70, 82 55 C100 85, 90 125, 60 125 Z"
          fill={`url(#${outerId})`}
        />

        <Path
          d="M60 120 C42 120, 35 92, 47 70 C52 80, 56 68, 60 48 C64 68, 68 80, 73 70 C85 92, 78 120, 60 120 Z"
          fill={`url(#${innerId})`}
        />

        <Path
          d="M60 115 C50 115, 45 98, 52 82 C56 88, 60 68, 60 68 C60 68, 64 88, 68 82 C75 98, 70 115, 60 115 Z"
          fill="#FFFFFF"
          opacity={0.85}
        />

        <Path d="M45 124 C50 120, 70 120, 75 124 C78 127, 42 127, 45 124 Z" fill={outerGrad[0]} opacity={0.8} />
      </Svg>
    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------------
  // 📊 백엔드 연속 학습(Streak) 연동 데이터 상태
  // -------------------------------------------------------------
  const [userData, setUserData] = useState({
    profileImage: 'https://www.bootdey.com/img/Content/avatar/avatar1.png',
    gems: 234,
    streak: 0,        // current_streak 연동
    maxStreak: 0,     // best_streak 연동
    missedDays: 0,    // days_since_last_study 연동
    flameLevel: 0,    // flame_level 연동
  });

  const [todayGoal, setTodayGoal] = useState({ current: 0, target: 5 });

  // 🗓️ 추후 백엔드 업데이트 예정 (현재는 더미 상태 유지)
  const [weeklyAttendance] = useState([
    { day: '월', status: 'completed' },
    { day: '화', status: 'completed' },
    { day: '수', status: 'completed' },
    { day: '목', status: 'completed' },
    { day: '금', status: 'completed' },
    { day: '토', status: 'disabled' },
    { day: '일', status: 'disabled' },
  ]);

  // 🌟 Streak 및 불꽃 데이터 fetch 연동
  const fetchHomeData = async () => {
    try {
      const userId = 1; // 테스트용 임시 사용자 ID

      const response = await fetch(`${BASE_URL}/home/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      const data = await response.json();

      if (data.success) {
        setUserData((prev) => ({
          ...prev,
          streak: data.current_streak ?? 0,
          maxStreak: data.best_streak ?? 0,
          missedDays: data.days_since_last_study ?? 0,
          flameLevel: data.flame_level ?? 0,
        }));

        setTodayGoal({
          current: data.today_word_count ?? 0,
          target: data.daily_goal ?? 5,
        });
      }
    } catch (error) {
      console.error('Streak 데이터 연동 실패:', error);
    } finally {
      setLoading(false);
    }
  };

 useFocusEffect(
  useCallback(() => {
    fetchHomeData();
  }, [])
);
  // 불꽃 부유 애니메이션
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -9,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // 연속 달성도(Streak)에 따른 불꽃 상태 계산
  const getFlameState = () => {
    if (userData.streak === 0) {
      return {
        stage: 'danger_3d',
        scale: 0.8,
        sub: '아직 불꽃이 피어나지 않았어요! 🔥',
        color: '#9E9E9E',
        colors: {
          outer: ['#9E9E9E', '#BDBDBD', '#E0E0E0'],
          inner: ['#E0E0E0', '#EEEEEE', '#FFFFFF'],
          spark: '#BDBDBD',
        },
      };
    }

    if (userData.missedDays >= 3) {
      return {
        stage: 'danger_3d',
        scale: 1.0,
        sub: '불꽃이 꺼졌습니다! 💨',
        color: '#757575',
      };
    }

    if (userData.streak >= 30) {
      return {
        stage: 'normal',
        scale: 1.35,
        sub: '마스터 불꽃! 극강의 푸른/보라 열기 💜',
        color: '#AA00FF',
        colors: {
          outer: ['#4A148C', '#AA00FF', '#00E5FF'],
          inner: ['#7C4DFF', '#E040FB', '#FFFFFF'],
          spark: '#00E5FF',
        },
      };
    }

    if (userData.streak >= 14) {
      return {
        stage: 'normal',
        scale: 1.2,
        sub: '이글거리는 딥 레드 불꽃! 붉게 타오르는 중 🔥',
        color: '#D50000',
        colors: {
          outer: ['#800000', '#D50000', '#FF1744'],
          inner: ['#FF1744', '#FF5252', '#FFFFFF'],
          spark: '#FF1744',
        },
      };
    }

    if (userData.missedDays === 1) {
      return {
        stage: 'warning_1d',
        scale: 0.85,
        sub: '불꽃이 줄어들고 있어요 ⚠️',
        color: '#EF6C00',
        colors: {
          outer: ['#E65100', '#EF6C00', '#FB8C00'],
          inner: ['#F57C00', '#FFB74D', '#FFF3E0'],
          spark: '#E65100',
        },
      };
    }

    if (userData.streak >= 7) {
      return {
        stage: 'normal',
        scale: 1.05,
        sub: '건강하고 강하게 타오르는 중! 🔥',
        color: '#FF3D00',
        colors: {
          outer: ['#DD2C00', '#FF3D00', '#FF9100'],
          inner: ['#FF6D00', '#FFAB40', '#FFFFFF'],
          spark: '#FF6D00',
        },
      };
    }

    return {
      stage: 'normal',
      scale: 0.85,
      sub: '작고 귀여운 시작! 🔥',
      color: '#FF9100',
      colors: {
        outer: ['#FF6D00', '#FF9100', '#FFD600'],
        inner: ['#FFAB00', '#FFE57F', '#FFFFFF'],
        spark: '#FFC400',
      },
    };
  };

  const flameInfo = getFlameState();
  const goalProgress = todayGoal.target > 0 ? (todayGoal.current / todayGoal.target) * 100 : 0;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6366f1" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Top Header */}
        <View style={styles.topHeader}>
          <Image source={{ uri: userData.profileImage }} style={styles.userAvatar} />
          <View style={styles.headerRight}>
            <View style={styles.badgeChip}>
              <Ionicons name="diamond" size={16} color="#3b82f6" />
              <Text style={styles.badgeText}>{userData.gems}</Text>
            </View>
            <View style={styles.badgeChip}>
              <Text style={{ fontSize: 13 }}>🔥</Text>
              <Text style={[styles.badgeText, { color: flameInfo.color }]}>{userData.streak}</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={22} color="#222" />
              <View style={styles.notiDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 🔥 메인 불꽃 캐릭터 영역 (current_streak 기준 연동) */}
        <View style={styles.flameSection}>
          <Text style={styles.streakTitle}>{userData.streak}일 연속 학습 중!</Text>
          <Text style={[styles.streakSubtitle, { color: flameInfo.color }]}>{flameInfo.sub}</Text>

          <View style={styles.flameWrapper}>
            <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
              <RealFlameGraphic 
                stage={flameInfo.stage} 
                scale={flameInfo.scale} 
                colors={flameInfo.colors} 
              />
            </Animated.View>
          </View>

          {/* 최고 기록 툴팁 (best_streak 연동) */}
          <View style={styles.recordTooltip}>
            <Text style={styles.recordLabel}>최고 기록</Text>
            <Text style={styles.recordValue}>{userData.maxStreak}일</Text>
          </View>
        </View>

        {/* 오늘 목표 카드 */}
        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <View>
              <Text style={styles.goalSubTitle}>오늘 목표</Text>
              <Text style={styles.goalTitle}>단어 {todayGoal.target}개 학습</Text>
            </View>
            <Text style={styles.goalCounter}>
              <Text style={styles.goalCurrent}>{todayGoal.current}</Text> / {todayGoal.target}
            </Text>
          </View>

          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${goalProgress}%` }]} />
          </View>

          <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/camera')}>
            <LinearGradient
              colors={['#6366f1', '#a855f7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startButton}
            >
              <Ionicons name="camera-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.startButtonText}>오늘 학습 시작하기</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* 출석 체크 주간 기록 카드 (임시 더미 데이터 사용 중) */}
        <View style={styles.recordCard}>
          <View style={styles.recordHeader}>
            <Text style={styles.recordTitle}>이번 주 학습 기록</Text>
            <Ionicons name="help-circle-outline" size={18} color="#9ca3af" />
            <View style={{ flex: 1 }} />
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </View>

          <View style={styles.weekGrid}>
            {weeklyAttendance.map((item, index) => (
              <View key={index} style={styles.dayCol}>
                <Text style={styles.dayText}>{item.day}</Text>
                <View
                  style={[
                    styles.dayCircle,
                    item.status === 'completed' ? styles.dayCircleActive : styles.dayCircleDisabled,
                  ]}
                >
                  <Ionicons
                    name="flame"
                    size={16}
                    color={item.status === 'completed' ? '#ffffff' : '#d1d5db'}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 하단 안내 배너 */}
        <View style={styles.bannerCard}>
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4712/4712027.png' }}
            style={styles.robotAvatar}
          />
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>멋져요! 🔥</Text>
            <Text style={styles.bannerSubText}>
              오늘만 학습하면 {userData.streak + 1}일 연속 달성이에요! 조금만 더 힘내봐요!
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 110, paddingTop: 10 },

  // Top Header
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  userAvatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: '#e2e8f0' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  badgeText: { fontWeight: '700', fontSize: 13, color: '#1e293b' },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  notiDot: { position: 'absolute', top: 9, right: 10, width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' },

  // Flame Section
  flameSection: { alignItems: 'center', marginVertical: 12, position: 'relative' },
  streakTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  streakSubtitle: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  flameWrapper: {
    height: 190,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
  },
  recordTooltip: {
    position: 'absolute',
    right: 8,
    top: 60,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  recordLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  recordValue: { fontSize: 15, fontWeight: '800', color: '#1e293b', marginTop: 2 },

  // Goal Card
  goalCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, marginTop: 6 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  goalSubTitle: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  goalTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b', marginTop: 2 },
  goalCounter: { fontSize: 15, color: '#94a3b8', fontWeight: '700' },
  goalCurrent: { fontSize: 22, color: '#6366f1', fontWeight: '800' },
  progressBarTrack: { height: 10, backgroundColor: '#f1f5f9', borderRadius: 5, marginVertical: 16, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#818cf8', borderRadius: 5 },
  startButton: { height: 52, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  startButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },

  // Attendance Card
  recordCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, marginTop: 16 },
  recordHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  recordTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  weekGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 8 },
  dayText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  dayCircle: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  dayCircleActive: { backgroundColor: '#FF5722' },
  dayCircleDisabled: { backgroundColor: '#f1f5f9' },
bannerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  robotAvatar: { width: 50, height: 50 },
  bannerContent: { flex: 1 },
  bannerTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  bannerSubText: { fontSize: 13, color: '#64748b', marginTop: 2, lineHeight: 18 },
});