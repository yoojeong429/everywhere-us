import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');
const BASE_URL = 'https://cobalt-unretired-fastness.ngrok-free.dev';

// 백엔드가 꺼져있을 때는 true
const USE_MOCK = false;

const DUMMY_TOPICS = [
  'Ordering a coffee',
  'Asking about the menu',
  'Talking about your favorite drink',
  'Paying for your order',
];

// 파동 개수 (12개)
const WAVE_BAR_COUNT = 12;

export default function CameraScreen({ onSaveToFeedback }) {
  const userId = 1;
  const cameraRef = useRef(null);
  const scrollViewRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  // 화면 단계: 'CAMERA' | 'ANALYZING' | 'MAIN_LEARNING' | 'CHAT'
  const [step, setStep] = useState('CAMERA');
const [capturedPhotoUri, setCapturedPhotoUri] = useState(null);

// 4방향 촬영
const [capturedPhotos, setCapturedPhotos] = useState({
  front: null,
  right: null,
  back: null,
  left: null,
});

// 현재 촬영할 방향
const [captureDirection, setCaptureDirection] = useState('front');

// 4장 촬영이 끝났는지
const CAPTURE_DIRECTIONS = [
  { key: 'front', label: '앞쪽', instruction: '앞쪽 공간을 촬영해주세요' },
  { key: 'right', label: '오른쪽', instruction: '오른쪽 공간을 촬영해주세요' },
  { key: 'back', label: '뒤쪽', instruction: '뒤쪽 공간을 촬영해주세요' },
  { key: 'left', label: '왼쪽', instruction: '왼쪽 공간을 촬영해주세요' },
];
  // 인식 및 상태 관리
const [currentSpace, setCurrentSpace] = useState('');
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);
  const [recommendedTopics, setRecommendedTopics] = useState([]);

  // UI 모달 및 피드백 버튼 노출 상태
  const [isTopicDrawerOpen, setIsTopicDrawerOpen] = useState(false);
  const [showFeedbackBtn, setShowFeedbackBtn] = useState(false);
  const [showRecommendedTopics, setShowRecommendedTopics] = useState(false);

  // 대화 및 AI 상태
  const [sessionId, setSessionId] = useState(null);
  const [activeDialogue, setActiveDialogue] = useState([]);
  const [aiStatus, setAiStatus] = useState('IDLE');
  const [currentTopic, setCurrentTopic] = useState('');
  
  // 🎙️ 음성 녹음/인식 상태: 'IDLE' | 'RECORDING' | 'PROCESSING'
  const [recordingState, setRecordingState] = useState('IDLE');

  // 🌊 음성 파동 애니메이션
  const waveAnimValues = useRef(
    Array.from({ length: WAVE_BAR_COUNT }, () => new Animated.Value(6))
  ).current;

  // 패러프레이징 토글 상태
  const [showParaphraseMap, setShowParaphraseMap] = useState({});

  // 예: 주제를 선택하거나 대화 화면으로 전환되는 함수
const startChat = (topic) => {
  setCurrentTopic(topic);
  
  // 타이머
  setTimeLeft(10); 
  setShowFeedbackBtn(false);
  
  setStep('CHAT'); // 화면을 CHAT 단계로 전환 (이제 useEffect 타이머 동작!)
};

  //타이머
const [timeLeft, setTimeLeft] = useState(10);

useEffect(() => {
  let timer;

  // step이 'CHAT'일 때만 타이머 동작
  if (step === 'CHAT') {
    if (timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // 60초가 모두 끝나면 피드백 버튼 노출
      setShowFeedbackBtn(true);
    }
  }

  return () => clearInterval(timer);
}, [step, timeLeft]);

  // 🌊 흘러가는 음성 파동 애니메이션
  useEffect(() => {
    let animations = [];

    if (recordingState === 'RECORDING') {
      animations = waveAnimValues.map((anim, index) => {
        const baseMin = 8;
        const baseMax = 28 + (index % 3) * 4;

        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: baseMax,
              duration: 250 + (index % 4) * 50,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: baseMin,
              duration: 250 + (index % 4) * 50,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: false,
            }),
          ])
        );
      });

      animations.forEach((anim) => anim.start());
    } else {
      waveAnimValues.forEach((anim) => {
        Animated.timing(anim, {
          toValue: 6,
          duration: 300,
          useNativeDriver: false,
        }).start();
      });
    }

    return () => {
      animations.forEach((anim) => anim.stop());
    };
  }, [recordingState]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 1. 이미지 통합 분석
const processImageAnalysis = async (photoUri) => {
  setStep('ANALYZING');

  const formattedUri =
    Platform.OS === 'ios'
      ? photoUri.replace('file://', '')
      : photoUri;

  try {
    // ==========================================
    // /detect-space 하나로 공간 + 사물 + 좌표 받기
    // ==========================================
    const formData = new FormData();

    formData.append('file', {
      uri: formattedUri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    });

    formData.append('user_id', String(userId));

    const response = await fetch(`${BASE_URL}/detect-space`, {
      method: 'POST',
      body: formData,
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    });

    if (!response.ok) {
      throw new Error(`이미지 분석 실패: ${response.status}`);
    }

    const data = await response.json();

    console.log('📦 detect-space 전체 응답:', JSON.stringify(data, null, 2));

    // ==========================================
    // 1. 공간 정보
    // ==========================================
    const detectedSpace =
      data?.space ||
      data?.place ||
      data?.detected_space ||
      '공간';

    setCurrentSpace(detectedSpace);

    // ==========================================
    // 2. 사물 + Bounding Box
    // ==========================================
    if (Array.isArray(data?.objects)) {
    const YOLO_WIDTH = 990;
    const YOLO_HEIGHT = 1920;

      const mappedObjects = data.objects
        .map((obj, index) => {
          // box가 없는 객체는 제외
          if (
            !obj?.box ||
            typeof obj.box.x1 !== 'number' ||
            typeof obj.box.y1 !== 'number' ||
            typeof obj.box.x2 !== 'number' ||
            typeof obj.box.y2 !== 'number'
          ) {
            console.warn(
              '⚠️ Bounding box가 없는 객체:',
              obj
            );
            return null;
          }

          const { x1, y1, x2, y2 } = obj.box;

          // Bounding Box 중앙 좌표
          const centerX = (x1 + x2) / 2;
          const centerY = (y1 + y2) / 2;

          // YOLO 좌표 → 현재 화면 좌표
          const screenX =
            (centerX / YOLO_WIDTH) * width;

          const screenY =
            (centerY / YOLO_HEIGHT) * height;

          console.log(
            `📍 ${obj.name}:`,
            `YOLO(${centerX}, ${centerY})`,
            `→ 화면(${screenX}, ${screenY})`
          );

          return {
            id: obj.id || `obj_${index}`,
            name: obj.name || obj.label || 'Object',
            confidence: obj.confidence || 0,

            // 화면에 표시할 위치
            x: screenX,
            y: screenY,

            // 원본 좌표도 보관
            box: obj.box,
          };
        })
        .filter(Boolean);

      console.log(
        '📍 최종 화면 객체:',
        JSON.stringify(mappedObjects, null, 2)
      );

      setDetectedObjects(mappedObjects);
    } else {
      console.warn('⚠️ objects가 없습니다.');
      setDetectedObjects([]);
    }

    // ==========================================
    // 3. 추천 표현 / 추천 주제
    // ==========================================
    const topics =
      data?.ai?.expressions ||
      data?.expressions ||
      data?.recommended_topics ||
      [];

    setRecommendedTopics(
      Array.isArray(topics) && topics.length > 0
        ? topics
        : DUMMY_TOPICS
    );

    // ==========================================
    // 학습 화면으로 이동
    // ==========================================
    setStep('MAIN_LEARNING');

  } catch (err) {
    console.error('이미지 분석 통신 에러:', err);

    alert('공간 및 사물 인식 중 오류가 발생했습니다.');

    setStep('CAMERA');
  }
};

// ==========================================
// 4방향 촬영 버튼
// ==========================================
const handleTakePicture = async () => {
  if (!cameraRef.current) {
    console.warn('⚠️ 카메라가 준비되지 않았습니다.');
    return;
  }

  try {
    console.log(
      `📸 ${CAPTURE_DIRECTIONS.find(
        (item) => item.key === captureDirection
      )?.label} 촬영 시작`
    );

    // 사진 촬영
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.8,
      skipProcessing: true,
    });

    if (!photo?.uri) {
      console.warn('⚠️ 사진 URI가 없습니다.');
      return;
    }

    console.log('✅ 사진 촬영 성공:', photo.uri);

    const currentIndex = CAPTURE_DIRECTIONS.findIndex(
      (item) => item.key === captureDirection
    );

    // 현재 방향 사진 저장
    const updatedPhotos = {
      ...capturedPhotos,
      [captureDirection]: photo.uri,
    };

    setCapturedPhotos(updatedPhotos);

    // ==========================================
    // 아직 4장이 안 끝났으면 다음 방향으로 이동
    // ==========================================
    if (currentIndex < CAPTURE_DIRECTIONS.length - 1) {
      const nextDirection =
        CAPTURE_DIRECTIONS[currentIndex + 1];

      console.log(
        `➡️ 다음 방향: ${nextDirection.label}`
      );

      // 잠깐 기다린 뒤 방향 변경
      setTimeout(() => {
        setCaptureDirection(nextDirection.key);
      }, 300);

      return;
    }

    // ==========================================
    // 4장 모두 촬영 완료
    // ==========================================
    console.log('🎉 4방향 촬영 완료');

    setCapturedPhotoUri(updatedPhotos.front);

    // 분석 시작
    await processFourImages(updatedPhotos);

  } catch (error) {
    console.error('📸 촬영 오류:', error);
  }
};

const processFourImages = async (photos) => {
  setStep('ANALYZING');

  try {
    const results = [];

    for (const direction of CAPTURE_DIRECTIONS) {
      const photoUri = photos[direction.key];

      if (!photoUri) {
        console.warn(`⚠️ ${direction.label} 사진이 없습니다.`);
        continue;
      }

      console.log(`📸 ${direction.label} 사진 분석 시작`);

      const formattedUri =
        Platform.OS === 'ios'
          ? photoUri.replace('file://', '')
          : photoUri;

      const formData = new FormData();

      formData.append('file', {
        uri: formattedUri,
        name: `${direction.key}.jpg`,
        type: 'image/jpeg',
      });

      formData.append('user_id', String(userId));

      const response = await fetch(`${BASE_URL}/detect-space`, {
        method: 'POST',
        body: formData,
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(
          `${direction.label} 이미지 분석 실패: ${response.status}`
        );
      }

      const data = await response.json();

      console.log(
        `📦 ${direction.label} 분석 결과:`,
        JSON.stringify(data, null, 2)
      );

      results.push({
        direction: direction.key,
        data,
      });
    }

    // 4장 결과 통합
    mergeFourImageResults(results, photos);

  } catch (err) {
    console.error('4방향 이미지 분석 에러:', err);

    alert('4방향 공간 및 사물 인식 중 오류가 발생했습니다.');

    setStep('CAMERA');
  }
};

// ==========================================
// 4방향 분석 결과 통합
// ==========================================
const mergeFourImageResults = (results, photos) => {
  console.log('🔄 4방향 분석 결과 통합 시작');

  let mergedSpace = '';
  let mergedObjects = [];
  let mergedTopics = [];

  results.forEach((result, directionIndex) => {
    const data = result.data;
    const direction = result.direction;

    // -----------------------------
    // 1. 공간 정보
    // -----------------------------
    if (!mergedSpace) {
      mergedSpace =
        data?.space ||
        data?.place ||
        data?.detected_space ||
        '';
    }

    // -----------------------------
    // 2. 사물 정보
    // -----------------------------
    if (Array.isArray(data?.objects)) {
      const directionObjects = data.objects
        .map((obj, index) => {
          if (
            !obj?.box ||
            typeof obj.box.x1 !== 'number' ||
            typeof obj.box.y1 !== 'number' ||
            typeof obj.box.x2 !== 'number' ||
            typeof obj.box.y2 !== 'number'
          ) {
            return null;
          }

          const YOLO_WIDTH = 990;
          const YOLO_HEIGHT = 1920;

          const { x1, y1, x2, y2 } = obj.box;

          const centerX = (x1 + x2) / 2;
          const centerY = (y1 + y2) / 2;

          const screenX =
            (centerX / YOLO_WIDTH) * width;

          const screenY =
            (centerY / YOLO_HEIGHT) * height;

          return {
            id: `${direction}_${obj.id || index}`,

            name:
              obj.name ||
              obj.label ||
              'Object',

            confidence:
              obj.confidence || 0,

            x: screenX,
            y: screenY,

            box: obj.box,

            direction,
          };
        })
        .filter(Boolean);

      mergedObjects.push(...directionObjects);
    }

    // -----------------------------
    // 3. 추천 주제
    // -----------------------------
    const topics =
      data?.ai?.expressions ||
      data?.expressions ||
      data?.recommended_topics ||
      [];

    if (Array.isArray(topics)) {
      mergedTopics.push(...topics);
    }
  });

  // ==========================================
  // 중복 제거
  // ==========================================
  mergedTopics = [...new Set(mergedTopics)];

  console.log('🏠 통합 공간:', mergedSpace);
  console.log('📦 통합 사물:', mergedObjects);
  console.log('💡 통합 주제:', mergedTopics);

  // ==========================================
  // State 저장
  // ==========================================
  setCurrentSpace(
    mergedSpace || '공간'
  );

  setDetectedObjects(
    mergedObjects
  );

  setRecommendedTopics(
    mergedTopics.length > 0
      ? mergedTopics
      : DUMMY_TOPICS
  );

  // 대표 사진 = 앞쪽 사진
  if (photos?.front) {
    setCapturedPhotoUri(
      photos.front
    );
  }

  // 학습 화면으로 이동
  setStep('MAIN_LEARNING');
};

  const handlePlayPronunciation = (word) => {
    if (Speech) Speech.speak(word, { language: 'en-US' });
  };

  // 4. 대화 시작
  const startConversationAPI = async (topicName) => {
    setCurrentTopic(topicName);
    setIsTopicDrawerOpen(false);
    setShowFeedbackBtn(false);
    setTimeLeft(10);
    setStep('CHAT');
    setAiStatus('THINKING');
    setActiveDialogue([]);
    setShowParaphraseMap({});
    setRecordingState('IDLE');

    try {
      const response = await fetch(`${BASE_URL}/conversation/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ target_expression: topicName }),
      });

      const data = await response.json();
      if (data.success || data.session_id) {
        setSessionId(data.session_id);
        setActiveDialogue([
          {
            speaker: 'AI',
            text: data.reply || data.message || "Let's start talking!",
            subText: data.subText || data.translation || '',
            suggestion: data.suggestion || null,
          },
        ]);
      }
    } catch (error) {
      console.error('대화 시작 통신 오류:', error);
      setActiveDialogue([{ speaker: 'AI', text: '대화 서버 연결에 실패했습니다.' }]);
    } finally {
      setAiStatus('IDLE');
    }
  };


  // 5. 음성 녹음 버튼 터치 핸들러
  const handleMicButtonPress = () => {
    if (aiStatus === 'THINKING') return;

    if (recordingState === 'IDLE') {
      setRecordingState('RECORDING');
    } else if (recordingState === 'RECORDING') {
      setRecordingState('PROCESSING');
      sendUserMessageToBackend("So glad to be talking with you too!");
    }
  };

// 📌 기존 코드를 대체하는 새로운 State & 핸들러
const [flaggedMap, setFlaggedMap] = useState({});
const handleToggleFlag = (idx, chatItem) => {
  const itemKey = chatItem.id || `chat_${idx}`;

// onSaveToFeedback: 피드백 보관함 컴포넌트/상위 상태로 저장된 항목을 넘겨주는 함수 (선택)
setFlaggedMap((prev) => {
    const isCurrentlyFlagged = !!prev[itemKey]; // 👈 prev[itemKey]로 검사해야 정확합니다!
    const nextFlaggedState = !isCurrentlyFlagged;
    
    const updated = { ...prev };

    if (isCurrentlyFlagged) {
      delete updated[itemKey]; // 토글 OFF
    } else {
      updated[itemKey] = {     // 토글 ON
        id: itemKey,
        en: chatItem.text || chatItem.en || '',
        ko: chatItem.subText || chatItem.ko || '',
        topic: typeof currentTopic !== 'undefined' ? currentTopic : 'General',
        savedAt: new Date().toLocaleDateString(),
      };
    }

    // 💡 외부 콜백(onSaveToFeedback)이 있다면 상태 계산 직후 내부에서 안전하게 실행
    if (onSaveToFeedback) {
      const targetItem = updated[itemKey] || { id: itemKey };
      onSaveToFeedback(targetItem, nextFlaggedState);
    }

    return updated;
  });
};

  // 3. 외부 피드백 보관함(Feedback)으로 저장/삭제 상태 전달
  if (onSaveToFeedback) {
    const targetItem = {
      id: itemKey,
      en: chatItem.text || chatItem.en || '',
      ko: chatItem.subText || chatItem.ko || '',
      topic: currentTopic || 'General',
      savedAt: new Date().toLocaleDateString(),
    };
    
    // 피드백 보관함 업데이트 콜백 실행 (저장이면 객체 전달, 삭제면 null 또는 id 전달)
    onSaveToFeedback(targetItem, nextFlaggedState);
  }


// 피드백 보관함으로 이동하는 함수/버튼에서 실행
const handleGoToFeedback = () => {
  // flaggedMap 객체의 값(value)들만 배열로 변환
  const savedSentences = Object.values(flaggedMap);

  router.push({
    pathname:
    '/FeedbackScreen', // 피드백 보관함 화면 경로
    params: {
      savedData: JSON.stringify(savedSentences), // 객체 배열을 문자열로 전달
    },
  });
};
  // 6. 유저 메시지 전송 및 AI 응답 처리
  const sendUserMessageToBackend = async (userText) => {
    setActiveDialogue((prev) => [
      ...prev,
      {
        speaker: 'USER',
        text: userText,
        paraphrase: 'I feel great to connect with you today as well!',
      },
    ]);
    setAiStatus('THINKING');

    if (USE_MOCK) {
      setTimeout(() => {
        setActiveDialogue((prev) => [
          ...prev,
          {
            speaker: 'AI',
            text: 'What kind of coffee do you usually enjoy in a cafe?',
            subText: '카페에서 보통 어떤 종류의 커피를 즐겨 마셔요?',
            suggestion: {
              en: 'I usually like to drink an iced Americano.',
              ko: '저는 보통 아이스 아메리카노를 즐겨 마셔요.',
            },
          },
        ]);
        setAiStatus('IDLE');
        setRecordingState('IDLE');
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      }, 1200);
      return;
    }

    if (!sessionId) return;
    try {
      const response = await fetch(`${BASE_URL}/conversation/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ session_id: sessionId, user_message: userText }),
      });

      const data = await response.json();
      if (data.success && data.reply) {
        setActiveDialogue((prev) => [
          ...prev,
          { 
            speaker: 'AI', 
            text: data.reply,
            subText: data.subText || '',
            suggestion: data.suggestion || null 
          },
        ]);
      }
    } catch (err) {
      console.error('메시지 전송 에러:', err);
    } finally {
      setAiStatus('IDLE');
      setRecordingState('IDLE');
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const toggleParaphrase = (index) => {
    setShowParaphraseMap((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  if (!permission) return <View style={styles.center} />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionText}>카메라 권한 허용</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ---------------- 1. 카메라 스캐너 ---------------- */}
      {step === 'CAMERA' && (
        <CameraView style={styles.camera} facing="back" ref={cameraRef}>
          <View style={styles.overlay}>
           <View style={styles.header}>
  {/* 뒤로가기 버튼 */}
  <TouchableOpacity
    style={styles.backButton}
    onPress={() => router.back()}
    activeOpacity={0.7}
  >
    <Ionicons name="arrow-back" size={28} color="white" />
  </TouchableOpacity>

  <Text style={styles.headerTitle}>AI Context Scanner</Text>

  {/* 제목을 중앙에 유지하기 위한 빈 공간 */}
  <View style={{ width: 38 }} />
</View>

            <View style={styles.scanBanner}>
              <Text
  style={{
    color: 'white',
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
  }}
>
  {captureDirection === 'front' && '1 / 4'}
  {captureDirection === 'right' && '2 / 4'}
  {captureDirection === 'back' && '3 / 4'}
  {captureDirection === 'left' && '4 / 4'}
</Text>
              <Text style={styles.scanText}>
  {USE_MOCK
    ? '🧪 Mock 테스트 모드'
    : CAPTURE_DIRECTIONS.find(
        (item) => item.key === captureDirection
      )?.instruction
  }
</Text>
            </View>

            <View style={styles.bottomControls}>
              <TouchableOpacity style={styles.mainShutter} onPress={handleTakePicture} />
            </View>
          </View>
        </CameraView>
      )}

      {/* ---------------- 2. 분석 중 로딩 ---------------- */}
      {step === 'ANALYZING' && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={{ color: 'white', marginTop: 15, fontSize: 16, fontWeight: '600' }}>
            공간과 사물을 인식하고 있습니다...
          </Text>
        </View>
      )}

{/* ---------------- 3. 촬영 후 학습 화면 ---------------- */}
{step === 'MAIN_LEARNING' && capturedPhotoUri && (
  <ImageBackground source={{ uri: capturedPhotoUri }} style={styles.backgroundImage}>
    {/* 상단 공간 배지 */}
    {/* 촬영 후 화면 상단 헤더 */}
<View style={styles.learningHeader}>

  {/* 뒤로가기 */}
  <TouchableOpacity
    style={styles.learningHeaderBtn}
    onPress={() => router.back()}
    activeOpacity={0.7}
  >
    <Ionicons name="arrow-back" size={25} color="white" />
  </TouchableOpacity>

  {/* 오른쪽 재촬영 */}
  <TouchableOpacity
    style={styles.learningHeaderBtn}
    onPress={() => {
  setCapturedPhotoUri(null);

  setCapturedPhotos({
    front: null,
    right: null,
    back: null,
    left: null,
  });

  setCaptureDirection('front');

  setSelectedObject(null);
  setDetectedObjects([]);
  setRecommendedTopics([]);

  setStep('CAMERA');
}}
    activeOpacity={0.7}
  >
    <Ionicons name="camera-reverse-outline" size={24} color="white" />
  </TouchableOpacity>

</View>
    <View style={styles.topCenterSpaceContainer}>
      <View style={styles.placeBadge}>
        <Text style={styles.placeText}>{currentSpace.toUpperCase()}</Text>
      </View>
    </View>

    {/* 사물 YOLO 핀 */}
    {detectedObjects.map((obj) => (
     <TouchableOpacity
  key={obj.id}
  style={[
    styles.objectDot,
    {
      left: obj.x - 10,
      top: obj.y - 10,
    },
  ]}
  onPress={() => {
    setSelectedObject((prev) =>
      prev?.id === obj.id ? null : obj
    );
  }}
  activeOpacity={0.8}
/>
    ))}

    {/* 사물 터치 시 단어 팝업 카드 */}
    {selectedObject && (
<View style={styles.wordPopupCard}>
  <View style={{ flex: 1 }}>
    <Text style={styles.wordSubTitle}>
      YOLO Detected
    </Text>

    <Text style={styles.wordText}>
      {selectedObject.name}
    </Text>
  </View>

  <View style={styles.wordPopupActions}>
    <TouchableOpacity
      style={styles.audioButton}
      onPress={() => handlePlayPronunciation(selectedObject.name)}
    >
      <Ionicons
        name="volume-medium"
        size={22}
        color="#3b82f6"
      />
    </TouchableOpacity>

    <TouchableOpacity
      onPress={() => setSelectedObject(null)}
      style={{ marginLeft: 10 }}
    >
      <Ionicons
        name="close-circle"
        size={28}
        color="#94a3b8"
      />
    </TouchableOpacity>
  </View>
</View>
    )}

    {/* AI 추천 주제 */}
{!selectedObject && (
  <View style={styles.topicPreviewContainer}>

    {/* 접혀 있는 상태에서도 항상 보이는 헤더 */}
    <TouchableOpacity
      style={styles.topicPreviewHeader}
      onPress={() =>
        setShowRecommendedTopics((prev) => !prev)
      }
      activeOpacity={0.8}
    >
      <View style={styles.topicPreviewTitleRow}>
        <Ionicons
          name="sparkles"
          size={18}
          color="#3B82F6"
        />

        <Text style={styles.topicPreviewTitle}>
          AI 추천 주제
        </Text>
      </View>

      <View style={styles.topicHeaderRight}>
        <Text style={styles.topicViewAllText}>
          {showRecommendedTopics ? '접기' : '펼치기'}
        </Text>

        <Ionicons
          name={
            showRecommendedTopics
              ? "chevron-down"
              : "chevron-up"
          }
          size={17}
          color="#64748B"
        />
      </View>
    </TouchableOpacity>

    {/* 펼쳤을 때만 추천 주제 표시 */}
    {showRecommendedTopics && (
      <View style={styles.topicPreviewList}>

        {recommendedTopics.slice(0, 2).map((topic, index) => (
          <TouchableOpacity
            key={index}
            style={styles.topicPreviewItem}
            onPress={() => startConversationAPI(topic)}
            activeOpacity={0.8}
          >
            <View style={styles.topicPreviewIcon}>
              <Ionicons
                name={
                  index === 0
                    ? "cafe-outline"
                    : "chatbubble-ellipses-outline"
                }
                size={18}
                color="#3B82F6"
              />
            </View>

            <Text
              style={styles.topicPreviewText}
              numberOfLines={1}
            >
              {topic}
            </Text>

            <Ionicons
              name="chevron-forward"
              size={17}
              color="#94A3B8"
            />
          </TouchableOpacity>
        ))}

        {/* 전체 보기 */}
        <TouchableOpacity
          style={styles.topicViewAllBtn}
          onPress={() => setStep('TOPIC_ROADMAP')}
          activeOpacity={0.7}
        >
          <Text style={styles.topicViewAllText}>
            전체 보기
          </Text>

          <Ionicons
            name="chevron-forward"
            size={16}
            color="#64748B"
          />
        </TouchableOpacity>

      </View>
    )}

  </View>
)}
  </ImageBackground>
)}

{/* ---------------- 4. 로드맵 전체 페이지 ---------------- */}
{/* ---------------- 4. 로드맵 전체 페이지 (게임화 & 글래스모피즘) ---------------- */}
{step === 'TOPIC_ROADMAP' && (
  <View style={styles.roadmapContainer}>
    {/* 상단 네비게이션 헤더 */}
    <View style={styles.roadmapHeader}>
      <TouchableOpacity
        style={styles.roadmapBackBtn}
        onPress={() => setStep('MAIN_LEARNING')}
      >
        <Ionicons name="arrow-back" size={22} color="#F8FAFC" />
      </TouchableOpacity>
      <Text style={styles.roadmapTitle}>AI 맞춤 학습 코스</Text>
      <View style={styles.headerRightBadge}>
        <Ionicons name="sparkles" size={14} color="#60A5FA" />
        <Text style={styles.headerRightText}>{recommendedTopics.length} Steps</Text>
      </View>
    </View>

    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.roadmapScrollContent}
    >
      {/* 히어로 공간 카드 */}
      <View style={styles.spaceHeroCard}>
        <View style={styles.spaceHeroTag}>
          <Ionicons name="location" size={14} color="#60A5FA" />
          <Text style={styles.spaceHeroTagText}>LOCATION DETECTED</Text>
        </View>
        <Text style={styles.spaceHeroTitle}>[{currentSpace.toUpperCase()}]</Text>
        <Text style={styles.spaceHeroSub}>상황별 핵심 표현을 단계별로 익혀보세요</Text>
      </View>

      {/* 로드맵 노드 영역 */}
      <View style={styles.roadmapPathContainer}>
        {/* 노드들을 잇는 배경 트랙 라인 */}
        <View style={styles.backgroundTrackLine} />

        {recommendedTopics.map((topic, index) => {
          const isFirst = index === 0; // 첫 번째 주제 강조
          const stepInCycle = index % 4;

          let alignStyle = styles.nodeAlignLeft;
          if (stepInCycle === 0) alignStyle = styles.nodeAlignLeft;
          else if (stepInCycle === 1) alignStyle = styles.nodeAlignCenterLeft;
          else if (stepInCycle === 2) alignStyle = styles.nodeAlignCenterRight;
          else if (stepInCycle === 3) alignStyle = styles.nodeAlignRight;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.speakStyleNode,
                alignStyle,
                isFirst && styles.activeFirstNode, // 첫 번째 노드 네온 효과
              ]}
              onPress={() => startConversationAPI(topic)}
              activeOpacity={0.85}
            >
              {/* 노드 번호 배지 */}
              <View style={[styles.nodeBadge, isFirst && styles.activeNodeBadge]}>
                <Text style={[styles.nodeBadgeText, isFirst && styles.activeNodeBadgeText]}>
                  {index + 1}
                </Text>
              </View>

              {/* 주제 텍스트 & 아이콘 */}
              <View style={styles.nodeTextWrapper}>
                <Text style={[styles.speakNodeTopicText, isFirst && styles.activeNodeTopicText]}>
                  {topic}
                </Text>
                {isFirst && (
                  <View style={styles.startBadge}>
                    <Text style={styles.startBadgeText}>START</Text>
                  </View>
                )}
              </View>

              <Ionicons
                name={isFirst ? "play-circle" : "chevron-forward-circle"}
                size={22}
                color={isFirst ? "#60A5FA" : "#475569"}
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  </View>
)}

      {/* ---------------- 4. 대화 화면 ---------------- */}
      {step === 'CHAT' && (
        <View style={styles.chatContainer}>
          {/* 💡 상단 헤더: 아이콘 제거 및 중앙 대화 주제 표시 */}
          <View style={styles.chatHeader}>
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            <Text style={styles.characterName} numberOfLines={1}>
              {currentTopic || '자유 대화'}
            </Text>
          </View>

          {/* 대화 스크롤 영역 */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatScrollView}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {activeDialogue.map((chat, idx) => {
              const isAI = chat.speaker === 'AI';
              const itemKey = chat.id || `chat_${idx}`;
              const isFlagged = !!flaggedMap[itemKey];

              return (
                <View key={idx} style={{ marginBottom: 20 }}>
                  {!isAI ? (
                    <View style={{ alignItems: 'flex-end' }}>
                      <View style={styles.userBubble}>
                        <Text style={styles.userBubbleText}>{chat.text}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.paraphraseBtn}
                        onPress={() => toggleParaphrase(idx)}
                      >
                        <Ionicons name="sparkles-outline" size={12} color="#4ade80" style={{ marginRight: 4 }} />
                        <Text style={styles.paraphraseBtnText}>패러프레이징</Text>
                      </TouchableOpacity>

                      {showParaphraseMap[idx] && (
                        <View style={styles.paraphraseBox}>
                          <Text style={styles.paraphraseTitle}>💡 더 자연스러운 표현:</Text>
                          <Text style={styles.paraphraseContent}>{chat.paraphrase}</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={{ alignItems: 'flex-start', width: '100%' }}>
                      <Text style={styles.aiMainText}>{chat.text}</Text>
                      {chat.subText && <Text style={styles.aiSubText}>{chat.subText}</Text>}

                      <View style={styles.aiActionRow}>
                  {/* 플래그(피드백 저장) 버튼 */}
                  <TouchableOpacity 
                    style={{ marginRight: 15 }}
                    onPress={() => handleToggleFlag(idx, chat)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons 
                      name={isFlagged ? "flag" : "flag-outline"} 
                      size={18} 
                      color={isFlagged ? "#22c55e" : "#94a3b8"} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity>
                          <Ionicons name="bookmark-outline" size={18} color="#94a3b8" />
                        </TouchableOpacity>
                      </View>

                      {chat.suggestion && (
                        <View style={styles.suggestionCard}>
                          <View style={styles.suggestionHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={{ fontSize: 14 }}>💡</Text>
                              <Text style={styles.suggestionTitle}>이렇게 말할 수 있어요</Text>
                            </View>
                            <TouchableOpacity onPress={() => handlePlayPronunciation(chat.suggestion.en)}>
                              <Ionicons name="volume-medium" size={20} color="#cbd5e1" />
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.suggestionEnText}>{chat.suggestion.en}</Text>
                          <Text style={styles.suggestionKoText}>{chat.suggestion.ko}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}

            {aiStatus === 'THINKING' && (
              <ActivityIndicator size="small" color="#ffffff" style={{ alignSelf: 'flex-start', marginVertical: 10 }} />
            )}
          </ScrollView>

          {/* 하단 영역: Animated 파동 & 컨트롤 버튼 */}
          <View style={styles.bottomArea}>
            {/* 🌊 음성 파동 */}
            <View style={styles.waveformContainer}>
              {waveAnimValues.map((animVal, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.waveformBar,
                    { height: animVal },
                  ]}
                />
              ))}
            </View>

            {/* 컨트롤 버튼 ROW (X | ↑ | 😊 조건부 노출) */}
            <View style={styles.imageStyleControls}>
              <TouchableOpacity
                style={styles.sideCircleBtn}
                onPress={() => setStep('MAIN_LEARNING')}
              >
                <Ionicons name="close" size={28} color="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mainArrowBtn}
                onPress={handleMicButtonPress}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-up" size={32} color="#000" />
              </TouchableOpacity>

              {showFeedbackBtn ? (
                <TouchableOpacity
                  style={styles.sideCircleBtn}
                  onPress={handleGoToFeedback} // ✅ 저장된 flaggedMap 데이터를 들고 이동
              >
                  <Ionicons name="happy-outline" size={26} color="#FFF" />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 54, height: 54 }} />
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  backButton: {
  width: 38,
  height: 38,
  borderRadius: 19,
  backgroundColor: 'rgba(0,0,0,0.45)',
  justifyContent: 'center',
  alignItems: 'center',
},
  scanBanner: { alignItems: 'center', marginTop: '20%' },
  scanText: { color: 'white', fontSize: 15, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20 },
  bottomControls: { flexDirection: 'row', justifyContent: 'center', marginBottom: 50 },
  mainShutter: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'white', borderWidth: 5, borderColor: 'rgba(255,255,255,0.4)' },

  backgroundImage: { flex: 1, resizeMode: 'cover' },
retakeBtn: {
  position: 'absolute',
  top: 50,
  right: 20,

  width: 48,
  height: 48,
  borderRadius: 24,

  backgroundColor: 'rgba(15, 23, 42, 0.7)',

  justifyContent: 'center',
  alignItems: 'center',

  zIndex: 50,
},
 topCenterSpaceContainer: { 
    marginTop: 60, 
    alignItems: 'center', 
    width: '100%',
    zIndex: 10, // 다른 레이어에 가려지지 않도록 설정
  },
  placeBadge: { 
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: 28, 
    paddingVertical: 12, 
    borderRadius: 24, 
    // iOS 그림자
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    // Android 그림자
    elevation: 8,
    // 은은한 테두리 강조
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.3)', // 포인트 컬러(파란색) 반투명 테두리
  },
  placeText: { 
    fontSize: 24, // 18 -> 24로 대폭 확대
    fontWeight: '900', // 더 두껍게 (Extra Bold)
    color: '#0F172A', // 더 깊은 딥블루/블랙 계열로 가독성 증가
    letterSpacing: 2, // 자간을 넓혀 깔끔하고 고급스러운 느낌 연출
  },

  rightMiddleTopicBtn: {
    position: 'absolute',
    right: 0,
    top: height * 0.42,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRightWidth: 0,
    elevation: 8,
  },
  rightMiddleTopicText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

objectDot: {
  position: 'absolute',
  width: 20,
  height: 20,
  borderRadius: 10,

  backgroundColor: '#FFFFFF',
  borderWidth: 3,
  borderColor: '#3B82F6',

  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.25,
  shadowRadius: 4,

  elevation: 6,

  zIndex: 50,
},

  learningGuideCard: {
  position: 'absolute',
  bottom: height * 0.06,
  left: '10%',
  right: '10%',
  backgroundColor: 'rgba(15, 23, 42, 0.88)',
  borderRadius: 20,
  paddingVertical: 18,
  paddingHorizontal: 20,
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: 'rgba(96, 165, 250, 0.35)',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 8,
},

learningGuideIcon: {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: 'rgba(59, 130, 246, 0.18)',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 14,
},

learningGuideContent: {
  flex: 1,
},

learningGuideTitle: {
  color: '#FFFFFF',
  fontSize: 15,
  fontWeight: '800',
  marginBottom: 5,
},

learningGuideText: {
  color: '#CBD5E1',
  fontSize: 12,
  lineHeight: 18,
},

 modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'flex-end' },
  rightSideDrawer: { width: width * 0.65, height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.95)', padding: 20, paddingTop: 60 },
  drawerTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 20 },
  topicCardItem: { backgroundColor: 'rgba(255,255,255,0.08)', padding: 14, borderRadius: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topicItemText: { color: 'white', fontSize: 13, flex: 1, paddingRight: 8 },

  /* 블랙 대화 화면 UI */
  chatContainer: { flex: 1, backgroundColor: '#121212', paddingTop: 60, paddingHorizontal: 20 },
  
  /* 💡 중앙 정렬 타이머 및 대화 주제 스타일 */
  chatHeader: { alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  timerText: { color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  characterName: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginTop: 4, textAlign: 'center' },

  chatScrollView: { flex: 1, marginTop: 10 },
  aiMainText: { color: '#FFFFFF', fontSize: 18, fontWeight: '500', lineHeight: 26 },
  aiSubText: { color: '#94a3b8', fontSize: 14, marginTop: 6, lineHeight: 20 },
  aiActionRow: { flexDirection: 'row', marginTop: 12, marginBottom: 16 },

  suggestionCard: {
    width: '100%',
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333336',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  suggestionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  suggestionTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  suggestionEnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  suggestionKoText: { color: '#94a3b8', fontSize: 13 },

  userBubble: { backgroundColor: '#262626', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18, maxWidth: '80%' },
  userBubbleText: { color: '#FFF', fontSize: 15 },
  paraphraseBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  paraphraseBtnText: { color: '#4ade80', fontSize: 11 },
  paraphraseBox: { backgroundColor: '#18271e', padding: 10, borderRadius: 10, marginTop: 6, maxWidth: '85%' },
  paraphraseTitle: { color: '#4ade80', fontSize: 11, fontWeight: 'bold' },
  paraphraseContent: { color: '#e2e8f0', fontSize: 12, marginTop: 2 },

  /* 하단 컨트롤러 & 음성 파동 */
  bottomArea: { paddingBottom: 40, alignItems: 'center' },
  waveformContainer: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 36, marginBottom: 20 },
  waveformBar: { width: 3, backgroundColor: '#FFFFFF', borderRadius: 2 },

  imageStyleControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '80%' },
  sideCircleBtn: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#262626', justifyContent: 'center', alignItems: 'center' },
  mainArrowBtn: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  permissionButton: { backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  permissionText: { color: 'white', fontWeight: 'bold' },
  /* ---------------- 로드맵 페이지 전용 스타일 ---------------- */
 /* ---------------- 고급 게임화 로드맵 전용 스타일 ---------------- */
  roadmapContainer: {
    flex: 1,
    backgroundColor: '#090D16', // 깊이감 있는 사이버펑크 딥 네이비
    paddingTop: 50,
  },
  roadmapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  roadmapBackBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  roadmapTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerRightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(30, 58, 138, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  headerRightText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '700',
  },
  roadmapScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 90,
  },

  /* 히어로 공간 카드 */
  spaceHeroCard: {
    backgroundColor: '#111827',
    padding: 22,
    borderRadius: 24,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  spaceHeroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  spaceHeroTagText: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  spaceHeroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  spaceHeroSub: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
  },

  /* 경로 & 노드 컨테이너 */
  roadmapPathContainer: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },

  /* 중앙 은은한 가이드 수직 선 */
  backgroundTrackLine: {
    position: 'absolute',
    top: 20,
    bottom: 20,
    left: '50%',
    width: 3,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 2,
    marginLeft: -1.5,
  },

  /* 기본 노드 버튼 (3D 입체감 & 입체 그림자) */
  speakStyleNode: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 22,
    minWidth: '64%',
    maxWidth: '78%',
    borderWidth: 1,
    borderColor: '#334155',
    // 3D 버튼 효과를 주는 입체 하단 테두리
    borderBottomWidth: 4,
    borderBottomColor: '#0F172A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },

  /* 첫 번째 노드 (ACTIVE STEP) 네온 글로우 테두리 */
  activeFirstNode: {
    backgroundColor: '#1E3A8A',
    borderColor: '#60A5FA',
    borderBottomColor: '#1D4ED8',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },

  /* 배지 스타일 */
  nodeBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activeNodeBadge: {
    backgroundColor: '#60A5FA',
  },
  nodeBadgeText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '800',
  },
  activeNodeBadgeText: {
    color: '#0F172A',
  },

  /* 노드 텍스트 영역 */
  nodeTextWrapper: {
    flex: 1,
    flexDirection: 'column',
  },
  speakNodeTopicText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '700',
  },
  activeNodeTopicText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  /* START 태그 */
  startBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#2563EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  startBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  /* S자 정렬 커브 위치 */
  nodeAlignLeft: {
    alignSelf: 'flex-start',
    marginLeft: '4%',
  },
  nodeAlignCenterLeft: {
    alignSelf: 'flex-start',
    marginLeft: '18%',
  },
  nodeAlignCenterRight: {
    alignSelf: 'flex-end',
    marginRight: '18%',
  },
  nodeAlignRight: {
    alignSelf: 'flex-end',
    marginRight: '4%',
  },
  learningHeader: {
  position: 'absolute',
  top: 52,
  left: 20,
  right: 20,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  zIndex: 100,
},

learningHeaderBtn: {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: 'rgba(15, 23, 42, 0.7)',
  justifyContent: 'center',
  alignItems: 'center',

  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.2)',

  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 8,
},
wordPopupCard: {
  position: 'absolute',
  bottom: 105,
  left: '8%',
  right: '8%',

  height: 105,

  backgroundColor: '#FFFFFF',
  borderRadius: 20,

  paddingHorizontal: 22,

  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',

  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 4,
  },
  shadowOpacity: 0.18,
  shadowRadius: 8,

  elevation: 8,

  zIndex: 100,
},
wordSubTitle: {
  fontSize: 11,
  color: '#64748B',
  fontWeight: '600',
  marginBottom: 4,
},

wordText: {
  fontSize: 24,
  fontWeight: '800',
  color: '#0F172A',
},
wordPopupActions: {
  flexDirection: 'row',
  alignItems: 'center',
},
topicPreviewContainer: {
  position: 'absolute',
  bottom: 42,
  left: '7%',
  right: '7%',

  backgroundColor: 'rgba(255, 255, 255, 0.96)',
  borderRadius: 22,

  paddingHorizontal: 18,
  paddingVertical: 16,
  
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 4,
  },
  shadowOpacity: 0.2,
  shadowRadius: 8,
  elevation: 8,

  zIndex: 20,
},
topicHeaderRight: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
},

topicPreviewHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
},

topicPreviewTitleRow: {
  flexDirection: 'row',
  alignItems: 'center',
},

topicPreviewTitle: {
  marginLeft: 7,
  color: '#0F172A',
  fontSize: 16,
  fontWeight: '800',
},

topicViewAllBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 4,
},

topicViewAllText: {
  color: '#64748B',
  fontSize: 12,
  fontWeight: '600',
},

topicPreviewList: {
  gap: 8,
},

topicPreviewItem: {
  height: 48,

  flexDirection: 'row',
  alignItems: 'center',

  backgroundColor: '#F8FAFC',
  borderRadius: 12,

  paddingHorizontal: 10,

  borderWidth: 1,
  borderColor: '#E2E8F0',
},

topicPreviewIcon: {
  width: 32,
  height: 32,
  borderRadius: 16,

  backgroundColor: '#EFF6FF',

  justifyContent: 'center',
  alignItems: 'center',

  marginRight: 10,
},

topicPreviewText: {
  flex: 1,

  color: '#1E293B',
  fontSize: 13,
  fontWeight: '600',
},
recommendedWrapper: {
  position: 'absolute',
  left: 16,
  right: 16,
  bottom: 20,
  backgroundColor: 'white',
  borderRadius: 18,
  overflow: 'hidden',

  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 5,
},

recommendedHeader: {
  height: 52,
  paddingHorizontal: 18,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},

recommendedHeaderText: {
  fontSize: 15,
  fontWeight: '700',
  color: '#222',
},

recommendedArrow: {
  fontSize: 20,
  color: '#555',
},

recommendedContent: {
  paddingHorizontal: 16,
  paddingBottom: 14,
  borderTopWidth: 1,
  borderTopColor: '#f0f0f0',
},

topicItem: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 12,
},

topicEmoji: {
  fontSize: 22,
  width: 40,
},

topicTitle: {
  fontSize: 14,
  fontWeight: '600',
  color: '#222',
},

topicDescription: {
  marginTop: 3,
  fontSize: 12,
  color: '#888',
},

viewAllButton: {
  alignItems: 'flex-end',
  paddingTop: 4,
},

viewAllText: {
  fontSize: 13,
  fontWeight: '600',
  color: '#3b82f6',
},
});
