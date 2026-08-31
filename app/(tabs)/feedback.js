import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// 🧪 MOCK 데이터: 대화 세션 저장 결과 (점수 제거 버전)
const MOCK_FEEDBACK_LIST = [
  {
    id: 'fb_1',
    topic: '카페에서 음료 주문해보기',
    space: 'CAFE',
    date: '2026.05.18',
    summary: '자연스러운 표현을 잘 사용하셨어요! 수량 표현에서 약간의 보완이 있으면 더 완벽합니다.',
    dialogue: [
      {
        speaker: 'AI',
        text: 'Hey Elie! What can I get started for you today?',
        subText: '엘리! 오늘 어떤 음료로 준비해 드릴까요?',
      },
      {
        speaker: 'USER',
        text: 'I want one iced americano please.',
        paraphrase: 'Can I please get a large iced Americano?',
      },
      {
        speaker: 'AI',
        text: 'Great! What size would you like for that?',
        subText: '좋습니다! 사이즈는 어떤 걸로 하시겠어요?',
      },
      {
        speaker: 'USER',
        text: 'Large size, thank you.',
        paraphrase: 'I would like a large one, thanks!',
      },
    ],
    tips: [
      "'I want ~' 대신 'Can I get ~'를 사용해보면 더 공손한 표현이 됩니다.",
    ],
  },
  {
    id: 'fb_2',
    topic: '시그니처 메뉴 추천 부탁하기',
    space: 'CAFE',
    date: '2026.05.17',
    summary: '질문 형태를 유연하게 잘 작성하셨습니다.',
    dialogue: [
      {
        speaker: 'AI',
        text: 'Welcome! Are you looking for anything specific?',
        subText: '어서오세요! 특별히 찾으시는 메뉴가 있으신가요?',
      },
      {
        speaker: 'USER',
        text: 'What is your signature drink here?',
        paraphrase: 'Could you recommend your signature drink?',
      },
    ],
    tips: [
      "'What do you recommend?'도 자주 쓰이는 좋은 추천 요청 표현입니다.",
    ],
  },
];

// 🧪 MOCK 데이터: 대화 중 초록색 깃발을 눌러 보관함에 저장된 문장 목록
const MOCK_SAVED_SENTENCES = [
  {
    id: 's_1',
    topic: '카페에서 음료 주문해보기',
    en: 'Hey Elie! What can I get started for you today?',
    ko: '엘리! 오늘 어떤 음료로 준비해 드릴까요?',
    savedAt: '2026.05.18',
  },
  {
    id: 's_2',
    topic: '카페에서 음료 주문해보기',
    en: 'Great! What size would you like for that?',
    ko: '좋습니다! 사이즈는 어떤 걸로 하시겠어요?',
    savedAt: '2026.05.18',
  },
];

export default function FeedbackScreen() {
  const [activeTab, setActiveTab] = useState('FEEDBACK'); // 'FEEDBACK' | 'SAVED'
  const [expandedDialogueMap, setExpandedDialogueMap] = useState({}); // '전체대화복기 >' 토글

  // 💡 1. 전달받은 params 읽기
  const params = useLocalSearchParams();

  // 💡 2. params로 전달받은 저장 문장 데이터 파싱 (없으면 MOCK 데이터 fallback)
  const savedSentences = useMemo(() => {
    if (params.savedData && typeof params.savedData === 'string') {
      try {
        return JSON.parse(params.savedData);
      } catch (e) {
        console.error('Failed to parse savedData', e);
      }
    }
    return MOCK_SAVED_SENTENCES; // 파라미터가 없을 때 기존 MOCK 데이터 사용
  }, [params.savedData]);

  const handlePlayTTS = (text) => {
    if (Speech) Speech.speak(text, { language: 'en-US' });
  };

  
  const toggleDialogue = (id) => {
    setExpandedDialogueMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>학습 리포트 & 보관함</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* 2. 상단 세그먼트 탭 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'FEEDBACK' && styles.activeTabButton]}
          onPress={() => setActiveTab('FEEDBACK')}
        >
          <Text style={[styles.tabText, activeTab === 'FEEDBACK' && styles.activeTabText]}>
            주제별 피드백
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'SAVED' && styles.activeTabButton]}
          onPress={() => setActiveTab('SAVED')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="flag" size={14} color={activeTab === 'SAVED' ? '#16a34a' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === 'SAVED' && styles.activeTabText]}>
              문장 보관함
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 3. 콘텐츠 영역 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* ---------------- A. 주제별 피드백 탭 ---------------- */}
        {activeTab === 'FEEDBACK' && (
          <View style={{ paddingBottom: 40 }}>
            <Text style={styles.sectionHeaderTitle}>💡 카메라인식 대화 피드백</Text>

            {MOCK_FEEDBACK_LIST.map((item) => {
              const isDialogueExpanded = !!expandedDialogueMap[item.id];

              return (
                <View key={item.id} style={styles.feedbackCard}>
                  {/* 카드 요약 헤더 (점수 요소 완전히 삭제) */}
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.badgeRow}>
                        <View style={styles.spaceBadge}>
                          <Text style={styles.spaceBadgeText}>{item.space}</Text>
                        </View>
                        <Text style={styles.dateText}>{item.date}</Text>
                      </View>
                      <Text style={styles.topicTitle}>{item.topic}</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {/* AI 종합 총평 */}
                  <Text style={styles.detailSubTitle}>🤖 AI 종합 총평</Text>
                  <Text style={styles.summaryText}>{item.summary}</Text>

                  {/* 교정 팁 */}
                  <Text style={styles.detailSubTitle}>✨ 더 매끄러운 표현 팁</Text>
                  {item.tips.map((tip, idx) => (
                    <Text key={idx} style={styles.tipText}>
                      • {tip}
                    </Text>
                  ))}

                  {/* 📌 전체대화복기 > 버튼 */}
                  <TouchableOpacity
                    style={styles.toggleDialogueBtn}
                    activeOpacity={0.7}
                    onPress={() => toggleDialogue(item.id)}
                  >
                    <Text style={styles.toggleDialogueText}>전체대화복기</Text>
                    <Ionicons
                      name={isDialogueExpanded ? 'chevron-up' : 'chevron-forward'}
                      size={18}
                      color="#2563eb"
                    />
                  </TouchableOpacity>

                  {/* 누르면 펼쳐지는 대화 내역 및 패러프레이징 */}
                  {isDialogueExpanded && (
                    <View style={styles.dialogueBox}>
                      {item.dialogue.map((d, idx) => {
                        const isAI = d.speaker === 'AI';
                        return (
                          <View
                            key={idx}
                            style={[
                              styles.chatBubbleContainer,
                              isAI ? styles.aiBubbleContainer : styles.userBubbleContainer,
                            ]}
                          >
                            <Text style={styles.speakerLabel}>{d.speaker}</Text>
                            <View style={[styles.chatBubble, isAI ? styles.aiBubble : styles.userBubble]}>
                              <Text style={[styles.dialogueText, !isAI && { color: '#FFFFFF' }]}>
                                {d.text}
                              </Text>
                              {d.subText && (
                                <Text style={styles.dialogueSubText}>{d.subText}</Text>
                              )}
                            </View>

                            {!isAI && d.paraphrase && (
                              <View style={styles.paraphraseCard}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                  <Ionicons name="sparkles" size={12} color="#16a34a" />
                                  <Text style={styles.paraphraseTitle}>추천 패러프레이징</Text>
                                </View>
                                <Text style={styles.paraphraseText}>{d.paraphrase}</Text>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* ---------------- B. 🚩 초록색 깃발 문장 보관함 탭 ---------------- */}
        {activeTab === 'SAVED' && (
        <View style={{ paddingBottom: 40 }}>
          <Text style={styles.sectionHeaderTitle}>🚩 대화 중 저장한 문장</Text>

          {/* 💡 MOCK_SAVED_SENTENCES 대신 동적 데이터(savedSentences) 사용 */}
          {savedSentences.length > 0 ? (
            savedSentences.map((item) => (
              <View key={item.id} style={styles.savedSentenceCard}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Ionicons name="flag" size={12} color="#16a34a" />
                    <Text style={styles.savedTopicBadge}>#{item.topic || '자유 대화'}</Text>
                  </View>
                  <Text style={styles.savedEnText}>{item.en}</Text>
                  {item.ko ? <Text style={styles.savedKoText}>{item.ko}</Text> : null}
                </View>

                <TouchableOpacity
                  style={styles.ttsButton}
                  onPress={() => handlePlayTTS(item.en)}
                >
                  <Ionicons name="volume-medium" size={22} color="#16a34a" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={{ textAlign: 'center', marginTop: 40, color: '#94a3b8' }}>
              저장된 문장이 없습니다.
            </Text>
          )}
        </View>
      )}
    </ScrollView> 
    </SafeAreaView>   
  );                 
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' }, // 화이트 배경
  header: {
    flexDirection: 'row',
    justify: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: '#0f172a', fontSize: 18, fontWeight: 'bold' },

  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: { backgroundColor: '#FFFFFF', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  tabText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
  activeTabText: { color: '#0f172a', fontWeight: 'bold' },

  content: { flex: 1, paddingHorizontal: 20 },
  sectionHeaderTitle: { color: '#64748b', fontSize: 13, fontWeight: '600', marginBottom: 14 },

  feedbackCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  spaceBadge: { backgroundColor: '#2563eb', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  spaceBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  dateText: { color: '#94a3b8', fontSize: 11 },
  topicTitle: { color: '#0f172a', fontSize: 16, fontWeight: 'bold' },

  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 14 },
  detailSubTitle: { color: '#2563eb', fontSize: 13, fontWeight: 'bold', marginTop: 10, marginBottom: 4 },
  summaryText: { color: '#334155', fontSize: 14, lineHeight: 20 },
  tipText: { color: '#475569', fontSize: 13, marginTop: 2, lineHeight: 18 },

  toggleDialogueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justify: 'space-between',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  toggleDialogueText: { color: '#2563eb', fontSize: 14, fontWeight: 'bold' },

  dialogueBox: { backgroundColor: '#ffffff', padding: 12, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  chatBubbleContainer: { marginBottom: 14 },
  aiBubbleContainer: { alignItems: 'flex-start' },
  userBubbleContainer: { alignItems: 'flex-end' },
  speakerLabel: { color: '#64748b', fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
  chatBubble: { padding: 10, borderRadius: 12, maxWidth: '85%' },
  aiBubble: { backgroundColor: '#f1f5f9' },
  userBubble: { backgroundColor: '#2563eb' },
  dialogueText: { color: '#0f172a', fontSize: 13, fontWeight: '500' },
  dialogueSubText: { color: '#64748b', fontSize: 11, marginTop: 2 },

  paraphraseCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
    maxWidth: '85%',
  },
  paraphraseTitle: { color: '#16a34a', fontSize: 11, fontWeight: 'bold' },
  paraphraseText: { color: '#15803d', fontSize: 12, marginTop: 2 },

  savedSentenceCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justify: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  savedTopicBadge: { color: '#16a34a', fontSize: 12, fontWeight: '600' },
  savedEnText: { color: '#0f172a', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  savedKoText: { color: '#64748b', fontSize: 12 },
  ttsButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f0fdf4',
    justify: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});