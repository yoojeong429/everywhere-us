import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

// 💡 10개의 더미 데이터
const DUMMY_FEEDBACKS = [
  { id: '1', date: '2026.05.26', title: 'SPRING BLOOM', score: 85, summary: '상대방의 제안에 대해 완곡한 거절 표현을 적절히 사용했으나...', good: '정중한 톤앤매너', bad: '문법 부족', aiTip: '팁', themeColor: '#E57373', icon: 'flower-outline' },
  { id: '2', date: '2026.05.24', title: 'SUMMER VACATION', score: 92, summary: 'Z세대의 트렌드 키워드를 활용한...', good: '어휘 활용', bad: '시제 오류', aiTip: '팁', themeColor: '#7952B3', icon: 'sunny-outline' },
  { id: '3', date: '2026.05.20', title: 'THE RAINY DAY', score: 78, summary: '전반적인 흐름은 좋았으나...', good: '시각적 묘사', bad: '축약어 잦음', aiTip: '팁', themeColor: '#FBC02D', icon: 'rainy-outline' },
  { id: '4', date: '2026.05.18', title: 'AUTUMN LEAVES', score: 88, summary: '비즈니스 협상 중...', good: '조건부 표현', bad: '성급한 결론', aiTip: '팁', themeColor: '#E67E22', icon: 'leaf-outline' },
  { id: '5', date: '2026.05.15', title: 'WINTER BREEZE', score: 95, summary: '투자 유치를 위한...', good: '확장성 표현', bad: '단어 반복', aiTip: '팁', themeColor: '#5DADE2', icon: 'snow-outline' },
  { id: '6', date: '2026.05.12', title: 'STARRY NIGHT', score: 81, summary: '아이디에이션...', good: '논리 확장', bad: '근거 부족', aiTip: '팁', themeColor: '#2C3E50', icon: 'moon-outline' },
  { id: '7', date: '2026.05.09', title: 'FOREST WALK', score: 74, summary: '상황 대처 능력...', good: '당황하지 않음', bad: '감탄사 빈번', aiTip: '팁', themeColor: '#27AE60', icon: 'tree-outline' },
  { id: '8', date: '2026.05.06', title: 'OCEAN DEEP', score: 90, summary: '글로벌 파트너...', good: '배려 섞인 거절', bad: '수동태 과도', aiTip: '팁', themeColor: '#2980B9', icon: 'boat-outline' },
  { id: '9', date: '2026.05.02', title: 'SWEET BERRY', score: 86, summary: '신제품 런칭...', good: '매력적 형용사', bad: '빠른 속도', aiTip: '팁', themeColor: '#9B59B6', icon: 'ice-cream-outline' },
  { id: '10', date: '2026.04.28', title: 'GOLDEN HOUR', score: 89, summary: '연봉 협상...', good: '자신감 있는 피력', bad: '소극적 어조', aiTip: '팁', themeColor: '#F39C12', icon: 'trophy-outline' },
];

const ROW_HEIGHT = 160; 
const START_Y = 90; // 첫 번째 카드가 위치하는 Y축 중심점 계산

export default function FeedbackScreen() {
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 10개의 카드가 가진 정확한 중심 좌표(X, Y)를 관통하는 S자 곡선 생성 로직
  const generateSvgPath = (numItems) => {
    const leftX = width * 0.26;  // 좌측 카드의 중심 예상 지점
    const rightX = width * 0.74; // 우측 카드의 중심 예상 지점
    
    let path = `M ${leftX} ${START_Y}`; // 시작점 세팅
    
    for (let i = 0; i < numItems - 1; i++) {
      const currentY = START_Y + i * ROW_HEIGHT;
      const nextY = currentY + ROW_HEIGHT;
      const midY = (currentY + nextY) / 2;

      if (i % 2 === 0) {
        // 좌측 카드 -> 우측 카드로 가는 완만한 곡선 패스
        path += ` C ${width * 0.85} ${currentY + 20}, ${width * 0.85} ${nextY - 20}, ${rightX} ${nextY}`;
      } else {
        // 우측 카드 -> 좌측 카드로 가는 완만한 곡선 패스
        path += ` C ${width * 0.15} ${currentY + 20}, ${width * 0.15} ${nextY - 20}, ${leftX} ${nextY}`;
      }
    }
    return path;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>피드백 로드맵</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* 1. 배경 SVG 레이어 (수학적으로 정렬된 점선 도로) */}
        <View style={styles.svgBackgroundAbsolute}>
          <Svg width={width} height={ROW_HEIGHT * DUMMY_FEEDBACKS.length + START_Y}>
            <Path
              d={generateSvgPath(DUMMY_FEEDBACKS.length)}
              fill="none"
              stroke="#4E9E6B" /* 원작과 유사한 꽉 찬 초록 트랙색으로 변경 */
              strokeWidth={32} /* 카드를 안정적으로 지탱하도록 두께 확장 */
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d={generateSvgPath(DUMMY_FEEDBACKS.length)}
              fill="none"
              stroke="#FFF"
              strokeWidth={4}
              strokeDasharray="8, 8" /* 중앙 흰색 점선 간격 최적화 */
              strokeLinecap="round"
            />
          </Svg>
        </View>

        {/* 2. 전면 카드 레이어 */}
        <View style={styles.cardsLayer}>
          {DUMMY_FEEDBACKS.map((item, index) => {
            const isRight = index % 2 !== 0;
            return (
              <View 
                key={item.id} 
                style={[
                  styles.cardRowWrapper, 
                  isRight ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }
                ]}
              >
                <TouchableOpacity
                  style={[styles.card, { borderBottomColor: item.themeColor }]}
                  onPress={() => {
                    setSelectedFeedback(item);
                    setModalVisible(true);
                  }}
                >
                  <View style={[styles.cardImageArea, { backgroundColor: item.themeColor + '15' }]}>
                    <Ionicons name={item.icon} size={32} color={item.themeColor} />
                    <View style={[styles.cardBadge, { backgroundColor: item.themeColor }]}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* 하단 최종 도달지 */}
        <View style={styles.barnContainer}>
          <Ionicons name="flag" size={32} color="#E74C3C" />
          <Text style={styles.barnText}>GOAL IN</Text>
        </View>

      </ScrollView>

      {/* 모달창 생략 (기존 로직과 완전히 동일) */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D2EBD4' },
  header: { height: 56, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#E5E7EB' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  
  scrollContainer: { paddingVertical: 20, position: 'relative' },

  // 수정된 부분: z-index -> zIndex
  svgBackgroundAbsolute: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1, 
  },
  
  cardsLayer: {
    width: '100%',
    paddingHorizontal: width * 0.04,
    zIndex: 2, // 수정된 부분
  },
  cardRowWrapper: {
    width: '100%',
    height: ROW_HEIGHT,
    justifyContent: 'center',
  },

  card: {
    width: '44%',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderBottomWidth: 5,
    shadowColor: '#1E462E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImageArea: {
    height: 75,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardBadge: {
    position: 'absolute',
    top: 8,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 5,
    borderBottomLeftRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: { padding: 10, alignItems: 'center', backgroundColor: '#fff', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  cardTitle: { fontSize: 11, fontWeight: '800', color: '#555' },

  barnContainer: { alignItems: 'center', marginTop: 20, marginBottom: 40, zIndex: 3 }, // 수정된 부분
  barnText: { fontSize: 13, fontWeight: '900', color: '#4E9E6B', marginTop: 5 },
});