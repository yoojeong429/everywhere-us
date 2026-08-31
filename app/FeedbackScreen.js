import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

const BASE_URL = 'https://cobalt-unretired-fastness.ngrok-free.dev';
const MOCK_MODE = false;

const DUMMY_FEEDBACK = {
  reviewProgress: 0,
  scores: {
    pronunciation: 85,
    rhythm: 80,
    fluency: 90,
  },
  recommendedExpressions: [
    {
      id: 1,
      expression: 'proficiency test',
      meaning: '영어 능력 시험',
      example: "It's just an English proficiency test.",
      highlight: 'proficiency test',
    },
    {
      id: 2,
      expression: 'enjoy the downtime',
      meaning: '휴식을 즐기다',
      example: 'Are you just enjoying the downtime?',
      highlight: 'downtime',
    },
  ],
  scriptFeedbacks: [
    {
      id: 'msg_1',
      speaker: 'AI',
      text: "Oh, really? It's nice to chat in the morning too!\nWhat made you think of calling now?",
    },
    {
      id: 'msg_2',
      speaker: 'USER',
      text: "Because today is weekend, so I don't have to go to work.",
      paraphrase: {
        suggested: "Because today is the weekend, I don't have to go to work.",
        explanation:
          '원래 말씀하신 "Because today is weekend"에서는 \'weekend\' 앞에 정관사 \'the\'가 빠져서 문법적으로 어색했어요. 또한 "Because ~ so ~"처럼 이유를 나타내는 접속사를 두 번 쓰는 것보다는 "so"를 생략하여 한 문장으로 연결하는 것이 훨씬 자연스럽습니다.',
      },
    },
    {
      id: 'msg_3',
      speaker: 'AI',
      text: "That sounds like a perfect reason!\nWeekends are for relaxing. Did you have any fun plans for today, or just enjoying the downtime?",
    },
    {
      id: 'msg_4',
      speaker: 'USER',
      text: "Actually, I have to study for the exam tomorrow so I think I can't relax entirely.",
      paraphrase: {
        suggested: "Actually, I have an exam tomorrow, so I don't think I can fully relax.",
        explanation:
          '"relax entirely" 보다는 "fully relax" 표현이 훨씬 자연스러우며, "I think I can\'t"보다는 "I don\'t think I can"으로 부정어를 앞쪽 주절로 넘기는 것이 영어다운 자연스러운 표현입니다.',
      },
    },
  ],
};

export default function FeedbackScreen() {
  const { sessionId } = useLocalSearchParams();
  const [feedbackData, setFeedbackData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedParaphrase, setExpandedParaphrase] = useState({});

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    setIsLoading(true);
    try {
      if (MOCK_MODE || !sessionId) {
        setFeedbackData(DUMMY_FEEDBACK);
        return;
      }

      const response = await fetch(`${BASE_URL}/conversation/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!response.ok) throw new Error('서버 응답 없음');
      const data = await response.json();
      setFeedbackData(data || DUMMY_FEEDBACK);
    } catch (error) {
      console.warn('⚠️ 피드백 생성 서버 미연결/오류 -> 더미 데이터 표시');
      setFeedbackData(DUMMY_FEEDBACK);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleParaphrase = (id) => {
    setExpandedParaphrase((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <SafeAreaView style={styles.summaryContainer}>
      {/* 상단 네비게이션 */}
      <View style={styles.sheetTopNav}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.summaryTitle}>결과 확인</Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#111827" />
          <Text style={{ marginTop: 15, fontSize: 14, color: '#6b7280' }}>
            대화 피드백을 구성 중입니다...
          </Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* 복습 게이지 & 점수 분석 */}
          <View style={styles.gaugeSection}>
            <View style={styles.arcGaugeContainer}>
              <View style={styles.arcGaugeOuter}>
                <Text style={styles.questionMark}>?</Text>
                <Text style={styles.gaugeStatusText}>아직 복습을 안했어요</Text>
              </View>
              <View style={styles.gaugeMinMax}>
                <Text style={styles.gaugeMinMaxText}>0</Text>
                <Text style={styles.gaugeMinMaxText}>100</Text>
              </View>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statBox}>
                <View style={styles.statTitleRow}>
                  <Ionicons name="target-outline" size={14} color="#6b7280" />
                  <Text style={styles.statLabel}>발음</Text>
                </View>
                <Text style={styles.statValue}>
                  {feedbackData?.scores?.pronunciation}%
                </Text>
              </View>

              <View style={styles.statBox}>
                <View style={styles.statTitleRow}>
                  <Ionicons name="water-outline" size={14} color="#6b7280" />
                  <Text style={styles.statLabel}>운율</Text>
                </View>
                <Text style={styles.statValue}>
                  {feedbackData?.scores?.rhythm}%
                </Text>
              </View>

              <View style={styles.statBox}>
                <View style={styles.statTitleRow}>
                  <Ionicons name="speedometer-outline" size={14} color="#6b7280" />
                  <Text style={styles.statLabel}>유창</Text>
                </View>
                <Text style={styles.statValue}>
                  {feedbackData?.scores?.fluency}%
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.reviewMainBtn}>
              <Text style={styles.reviewMainBtnText}>복습하기</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionDivider} />

          {/* 원어민 추천 표현 카드 */}
          <View style={styles.nativeExpSection}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="sparkles" size={18} color="#22c55e" style={{ marginRight: 6 }} />
              <Text style={styles.nativeExpSectionTitle}>내게 딱 맞는 원어민 표현</Text>
            </View>

            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 12 }}
            >
              {feedbackData?.recommendedExpressions.map((item) => (
                <View key={item.id} style={styles.nativeCard}>
                  <View style={styles.cardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.expTitle}>{item.expression}</Text>
                      <Ionicons name="volume-medium-outline" size={18} color="#374151" style={{ marginLeft: 6 }} />
                    </View>
                    <Text style={styles.expMeaning}>{item.meaning}</Text>
                  </View>

                  <View style={styles.expExampleRow}>
                    <Text style={styles.expExampleText}>
                      {item.example.split(item.highlight)[0]}
                      <Text style={styles.expHighlight}>{item.highlight}</Text>
                      {item.example.split(item.highlight)[1]}
                    </Text>
                    <Ionicons name="volume-medium-outline" size={16} color="#374151" style={{ marginLeft: 6 }} />
                  </View>

                  <View style={styles.cardFooter}>
                    <Ionicons name="bookmark-outline" size={20} color="#9ca3af" />
                    <TouchableOpacity style={styles.practiceBtn}>
                      <Ionicons name="mic" size={14} color="#111827" />
                      <Text style={styles.practiceBtnText}>연습</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.dotsRow}>
              <View style={[styles.dot, styles.activeDot]} />
              <View style={styles.dot} />
            </View>
          </View>

          <View style={styles.callHistoryLabelRow}>
            <Text style={styles.callHistoryLabel}>통화 내용</Text>
          </View>

          {/* 대화 스크립트 & 패러프레이징 */}
          <View style={styles.scriptSection}>
            {feedbackData?.scriptFeedbacks.map((msg) => {
              const isAI = msg.speaker === 'AI';
              const isExpanded = expandedParaphrase[msg.id];

              if (isAI) {
                return (
                  <View key={msg.id} style={styles.aiScriptBubble}>
                    <Text style={styles.aiScriptText}>{msg.text}</Text>
                    <View style={styles.aiScriptToolbar}>
                      <TouchableOpacity style={styles.iconToolBtn}>
                        <Ionicons name="flag-outline" size={18} color="#6b7280" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.iconToolBtn}>
                        <Ionicons name="volume-medium-outline" size={18} color="#6b7280" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.iconToolBtn}>
                        <Ionicons name="language-outline" size={18} color="#6b7280" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.iconToolBtn}>
                        <Ionicons name="bookmark-outline" size={18} color="#6b7280" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }

              return (
                <View key={msg.id} style={styles.userScriptGroup}>
                  <View style={styles.userScriptBubble}>
                    <Text style={styles.userScriptText}>{msg.text}</Text>
                  </View>

                  {msg.paraphrase && (
                    <View style={styles.paraphraseContainer}>
                      <TouchableOpacity
                        style={styles.paraphraseHeader}
                        onPress={() => toggleParaphrase(msg.id)}
                      >
                        <View style={styles.paraphraseTitleRow}>
                          <Ionicons name="sparkles" size={14} color="#3b82f6" />
                          <Text style={styles.paraphraseTitleText}>
                            {msg.paraphrase.suggested}
                          </Text>
                        </View>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color="#6b7280"
                        />
                      </TouchableOpacity>

                      {isExpanded && (
                        <View style={styles.paraphraseBody}>
                          <Text style={styles.explanationText}>
                            {msg.paraphrase.explanation}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  summaryContainer: { flex: 1, backgroundColor: '#f9fafb' },
  sheetTopNav: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  summaryTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 12, color: '#111827' },
  gaugeSection: { backgroundColor: 'white', padding: 20, alignItems: 'center' },
  arcGaugeContainer: { alignItems: 'center', marginVertical: 10 },
  arcGaugeOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionMark: { fontSize: 32, fontWeight: 'bold', color: '#9ca3af' },
  gaugeStatusText: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  gaugeMinMax: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 140,
    marginTop: 6,
  },
  gaugeMinMaxText: { fontSize: 11, color: '#9ca3af' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 20 },
  statBox: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6b7280', marginLeft: 4 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  reviewMainBtn: {
    backgroundColor: '#111827',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  reviewMainBtnText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  sectionDivider: { height: 8, backgroundColor: '#f3f4f6' },

  nativeExpSection: { backgroundColor: 'white', padding: 20 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  nativeExpSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  nativeCard: {
    width: width - 60,
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    marginRight: 10,
  },
  cardHeader: { marginBottom: 10 },
  expTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  expMeaning: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  expExampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  expExampleText: { flex: 1, fontSize: 13, color: '#374151' },
  expHighlight: { color: '#2563eb', fontWeight: 'bold' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  practiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  practiceBtnText: { fontSize: 12, fontWeight: '600', color: '#111827', marginLeft: 4 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#e5e7eb', marginHorizontal: 3 },
  activeDot: { backgroundColor: '#111827', width: 12 },

  callHistoryLabelRow: { paddingHorizontal: 20, paddingTop: 16, backgroundColor: '#f9fafb' },
  callHistoryLabel: { fontSize: 14, fontWeight: 'bold', color: '#6b7280' },
  scriptSection: { padding: 20, backgroundColor: '#f9fafb' },
  aiScriptBubble: { backgroundColor: 'white', padding: 14, borderRadius: 12, marginBottom: 12 },
  aiScriptText: { fontSize: 14, color: '#111827', lineHeight: 20 },
  aiScriptToolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 12,
  },
  iconToolBtn: { padding: 2 },

  userScriptGroup: { marginBottom: 16 },
  userScriptBubble: {
    backgroundColor: '#e0e7ff',
    padding: 14,
    borderRadius: 12,
    alignSelf: 'flex-end',
  },
  userScriptText: { fontSize: 14, color: '#1e3a8a', lineHeight: 20 },
  paraphraseContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    overflow: 'hidden',
  },
  paraphraseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  paraphraseTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  paraphraseTitleText: { fontSize: 13, fontWeight: 'bold', color: '#2563eb', marginLeft: 6 },
  paraphraseBody: {
    padding: 10,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginTop: 4,
  },
  explanationText: { fontSize: 12, color: '#4b5563', lineHeight: 18, marginTop: 6 },
});