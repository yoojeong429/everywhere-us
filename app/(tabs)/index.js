import { AntDesign, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router'; // 💡 화면 이동을 위해 useRouter 추가
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Circle, Svg } from 'react-native-svg';

export default function HomeScreen() {
  const router = useRouter(); // 👈 피드백 화면 push 이동을 위한 라우터 선언

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* 1. 상단 헤더 (아바타 누르면 로그인으로 이동) */}
        <View style={styles.header}>
          <Link href="/login" asChild>
            <TouchableOpacity style={styles.avatar} />
          </Link>
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="diamond-stone" size={20} color="#3b82f6" />
            <Text style={styles.statText}>234</Text>
          </View>
          <View style={styles.statBox}>
            <FontAwesome5 name="fire" size={18} color="#f97316" />
            <Text style={styles.statText}>12</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* 2. 중앙: Active Level 카드 */}
        <View style={styles.activeLevelCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Active Level</Text>
            <AntDesign name="exclamationcircleo" size={16} color="#aaa" />
          </View>
          <View style={styles.cardContent}>
            <View style={styles.progressCircleWrapper}>
              <Svg width="80" height="80" viewBox="0 0 100 100">
                <Circle cx="50" cy="50" r="45" stroke="#E5E7EB" strokeWidth="8" fill="none" />
                <Circle
                  cx="50" cy="50" r="45" stroke="#3b82f6" strokeWidth="8" fill="none"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - 0.72)}`}
                  strokeLinecap="round" transform="rotate(-90 50 50)"
                />
              </Svg>
              <View style={styles.percentTextContainer}>
                <Text style={styles.progressPercent}>72<Text style={styles.percentSymbol}>%</Text></Text>
              </View>
            </View>
            <View style={styles.cardTextWrapper}>
              <Text style={styles.cardMainText}>Level 15</Text>
              <Text style={styles.cardSubText}>You're doing great! Keep it up to level up.</Text>
            </View>
          </View>
        </View>

        {/* 3. Challenge 버튼 */}
        <TouchableOpacity style={styles.challengeButton}>
          <View style={styles.challengeButtonContent}>
            <MaterialCommunityIcons name="lightning-bolt" size={20} color="#fff" />
            <Text style={styles.challengeButtonText}>Let's Challenge!</Text>
          </View>
          <AntDesign name="arrowright" size={20} color="#fff" />
        </TouchableOpacity>

        {/* 3.5 AI 학습 피드백 리포트 진입 카드 */}
        <TouchableOpacity 
          style={styles.feedbackShortcutCard}
          onPress={() => router.push('/(tabs)/feedback')} // 👈 경로를 탭 폴더 내부로 정확히 지정!
>
          <View style={styles.cardLeft}>
            <View style={styles.iconBadge}>
              <Ionicons name="analytics" size={22} color="#3B82F6" />
            </View>
            <View style={styles.shortcutTextWrapper}>
              <Text style={styles.cardMainTextLink}>AI 학습 피드백 리포트</Text>
              <Text style={styles.cardSubTextLink}>그동안의 성장을 한눈에 확인해보세요</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* 4. 하단 리스트: Continue Studying */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Continue Studying</Text>
          <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.studyCard}>
          <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="briefcase" size={24} color="#3b82f6" />
          </View>
          <View style={styles.studyText}>
            <Text style={styles.studyTitle}>Business English</Text>
            <Text style={styles.studySub}>15 mins left • 80% done</Text>
          </View>
          <AntDesign name="right" size={16} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.studyCard}>
          <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="chatbubbles" size={24} color="#ef4444" />
          </View>
          <View style={styles.studyText}>
            <Text style={styles.studyTitle}>Daily Conversation</Text>
            <Text style={styles.studySub}>5 mins left • 20% done</Text>
          </View>
          <AntDesign name="right" size={16} color="#ccc" />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContainer: { paddingBottom: 120 }, // 하단 여백 통합 정리 완료
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, marginBottom: 20 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FED7AA' },
  statBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statText: { marginLeft: 6, fontWeight: 'bold', color: '#3b82f6', fontSize: 16 },
  activeLevelCard: { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 20, padding: 20, marginBottom: 20, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginRight: 6 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  progressCircleWrapper: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  percentTextContainer: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  progressPercent: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  percentSymbol: { fontSize: 12, color: '#9CA3AF' },
  cardTextWrapper: { flex: 1 },
  cardMainText: { fontSize: 18, fontWeight: 'bold', color: '#3b82f6', marginBottom: 4 },
  cardSubText: { fontSize: 13, color: '#6B7280' },
  challengeButton: { backgroundColor: '#8B5CF6', marginHorizontal: 20, borderRadius: 15, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  challengeButtonContent: { flexDirection: 'row', alignItems: 'center' },
  challengeButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  
  // 🆕 피드백 이동 카드 스타일 컴포넌트 추가
  feedbackShortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EBF5FF', justifyContent: 'center', alignItems: 'center' },
  shortcutTextWrapper: { justifyContent: 'center' },
  cardMainTextLink: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 2 },
  cardSubTextLink: { fontSize: 12, color: '#6B7280' },

  // 리스트 스타일
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 10, marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  seeAll: { color: '#8B5CF6', fontWeight: 'bold' },
  studyCard: { backgroundColor: '#fff', marginHorizontal: 20, padding: 15, borderRadius: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  studyText: { flex: 1 },
  studyTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  studySub: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
});