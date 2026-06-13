import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions, Platform, ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');


export default function CameraScreen() {
  const cameraRef = useRef(null);
  const scrollViewRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [step, setStep] = useState('SCANNING'); // SCANNING, CONFIRMING, OBJECT_SCANNING, SELECT_OBJECT, COMBINATIONS_LIST, DIALOGUE_CHAT, SPACE_DIALOGUE_CHAT
  const [currentSpace, setCurrentSpace] = useState('분석 전'); 
  const [scannedObject, setScannedObject] = useState('사물을 찾는 중...'); 
  const [detectedCandidates, setDetectedCandidates] = useState([]); 
  const [isLocked, setIsLocked] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [activeDialogue, setActiveDialogue] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [aiStatus, setAiStatus] = useState('IDLE');
  const [scanCount, setScanCount] = useState(0);

  // [CLIP 연동] 6장의 이미지를 백엔드 공간 인식 API로 전송
  const uploadSingleSpaceImage = async (photoUri) => {
    const formData = new FormData();
    formData.append('file', {
      uri: photoUri,
      name: 'space_scan.jpg',
      type: 'image/jpeg',
    });

    try {
      const response = await fetch(
        'https://cobalt-unretired-fastness.ngrok-free.dev/detect-space',
        {
          method: 'POST',
          body: formData,
          headers: { 'ngrok-skip-browser-warning': 'true'},
        });

      if (!response.ok) throw new Error(`서버 오류: ${response.status}`);

      const data = await response.json();
      console.log("🎯 백엔드 CLIP 최종 판정 장소:", data);
      return data.space; 
    } catch (err) {
      console.error("CLIP 공간 인식 통신 실패:", err);
      return null;
    }
  };

  // [YOLO 연동] 단일 사물 촬영 및 인식
  const uploadObjectScanImage = async (photoUri) => {
    const formData = new FormData();
    const uri = Platform.OS === 'ios' ? photoUri.replace('file://', '') : photoUri;
    formData.append('file', {
      uri: uri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    });
    formData.append('current_space', currentSpace);

    try {
      const response = await fetch(
        'https://cobalt-unretired-fastness.ngrok-free.dev/detect',
        { method: 'POST', body: formData, headers: { 'ngrok-skip-browser-warning': 'true' } }
      );
      const responseText = await response.text();
      console.log("🔥 서버 응답 원본:", responseText);

      if (!response.ok) {
        console.error(`서버 응답 에러 (${response.status}):`, responseText);
        return null;
      }
      
      const data = JSON.parse(responseText);

      if (!data) {
        console.warn("⚠️ 서버 응답이 비어있습니다 (null)");
        return [];
    }
    
    // 아까 확인한 구조에 맞게 데이터 추출
    return data;

  } catch (err) {
    console.error("통신 에러:", err);
    return null;
  }
};

     

const handleSingleSpaceScan = async () => {
  if (!cameraRef.current || isLocked) return;
  
  setIsLocked(true);
  try {
    // 사진 1장 촬영
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
    
    // 백엔드로 전송 (uploadSingleSpaceImage 함수 호출)
    const spaceName = await uploadSingleSpaceImage(photo.uri);
    
    if (spaceName) {
      setCurrentSpace(spaceName);
      setStep('CONFIRMING');
    } else {
      alert("공간을 인식하지 못했습니다. 다시 촬영해주세요.");
    }
  } catch (err) {
    console.error("촬영 오류:", err);
  } finally {
    setIsLocked(false);
  }
};

// 3. 렌더링 부분의 버튼을 아래처럼 연결하세요.


  // 사물 전용 촬영 (YOLO 인터랙션)
  const takePicture = async () => {
    if (!cameraRef.current || isLocked) return;

    try {
      setIsLocked(true);
      setScannedObject('사물을 분석하는 중...');
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
      cameraRef.current.pausePreview();

      const detectedResult = await uploadObjectScanImage(photo.uri);
      if (detectedResult && detectedResult.object) {
      setScannedObject(detectedResult.object);

      // 3. 서버에서 받은 expressions를 화면용 리스트로 변환
      const formattedCombinations = detectedResult.ai.expressions.map((exp, index) => ({
        id: `server_${index}`,
        phrase: exp.split('(')[0].trim().replace(/"/g, ''),
        meaning: exp.split('(')[1]?.replace(')', '') || '',
        dialogue: [] // 필요 시 서버에서 다이얼로그도 받아와서 여기에 할당
      }));
      setDetectedCandidates(formattedCombinations);
      setStep('COMBINATIONS_LIST');
    } else {
      // 5. 인식 실패 시 처리
      alert(`학습 가능한 사물을 찾지 못했습니다.\n서버 응답: ${JSON.stringify(detectedResult)}`);
      cameraRef.current.resumePreview();
      setIsLocked(false);
      setScannedObject('사물을 다시 찾아주세요');
    }
  } catch (err) {
    console.error("사진 촬영 및 통신 에러:", err);
    cameraRef.current?.resumePreview();
    setIsLocked(false);
    setScannedObject('다시 시도해주세요');
  }
};

  const startDialogueSession = (fullScript) => {
    setCurrentTurn(0);
    setAiStatus('IDLE');
    if (fullScript && fullScript[0]?.speaker === 'AI') {
      setActiveDialogue([fullScript[0]]);
      setCurrentTurn(1);
    } else {
      setActiveDialogue([]);
    }
  };

  const handleUserSpeak = (targetText, fullScript) => {
    if (aiStatus !== 'IDLE') return;
    setAiStatus('STT_LISTENING');
    setTimeout(() => {
      const userSpeech = { speaker: 'USER', text: targetText };
      setActiveDialogue((prev) => [...prev, userSpeech]);
      setAiStatus('AI_THINKING');
      setTimeout(() => {
        const nextAiReply = fullScript[currentTurn + 1];
        if (nextAiReply) {
          setActiveDialogue((prev) => [...prev, nextAiReply]);
          setCurrentTurn((prev) => prev + 2);
        }
        setAiStatus('IDLE');
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      }, 2000);
    }, 2500);
  };

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionText}>카메라 권한 허용</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentWordData = { 
    kr: scannedObject, 
    combinations: detectedCandidates 
  };  
  const targetScript = step === 'DIALOGUE_CHAT' 
  ? (selectedCombo?.dialogue || []) 
  : [];

    const nextUserStatement = targetScript?.[currentTurn]?.speaker === 'USER' ? targetScript[currentTurn].text : null;

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef}>
        <View style={styles.overlay}>
          {/* 헤더 바 */}
          <View style={styles.header}>
            <View style={{ width: 32 }} />
            <Text style={styles.headerTitle}>AI Context Scanner</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
              <Ionicons name="close" size={32} color="white" />
            </TouchableOpacity>
          </View>

{/* 스캔 관련 UI: 한 장 촬영 모드 */}
{step === 'SCANNING' && (
  <View style={styles.scanBanner}>
    <Text style={styles.scanText}>공간을 중앙에 맞추고 촬영하세요!</Text>
    
    <TouchableOpacity 
      style={styles.mainActionBtn} 
      onPress={handleSingleSpaceScan} 
      disabled={isLocked}
    >
      <Text style={styles.btnTextWhite}>
        {isLocked ? "분석 중..." : "📸 공간 촬영하기"}
      </Text>
    </TouchableOpacity>

    {/* 분석 중일 때만 표시되는 인디케이터 */}
    {isLocked && (
      <View style={{ marginTop: 20 }}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ color: 'white', marginTop: 10 }}>공간 맥락 분석 중...</Text>
      </View>
    )}
  </View>
)}

          {/* 2. 공간 분석 완료 -> 사용자가 확인하는 UI 단계 */}
          {step === 'CONFIRMING' && (
            <View style={styles.confirmBox}>
              <Ionicons name="location-sharp" size={36} color="#3b82f6" style={{ marginBottom: 5 }} />
              <Text style={styles.locationTitle}>📍 여기가 [{currentSpace}] 가 맞나요?</Text>
              <Text style={styles.subText}>AI가 360도 스캔을 통해 장소를 예측했습니다.</Text>
              
              <View style={styles.verticalButtonGroup}>
                <TouchableOpacity style={styles.mainActionBtn} onPress={() => {
                  cameraRef.current?.resumePreview();
                  setIsLocked(false);
                  setScannedObject('사물을 찾는 중...');
                  setStep('OBJECT_SCANNING');
                }}>
                  <Text style={styles.btnTextWhite}>네, 맞아요! 여기서 사물 찾기</Text>
                </TouchableOpacity>
                
              <TouchableOpacity style={styles.spaceSkipBtn} onPress={() => {
                setStep('SPACE_DIALOGUE_CHAT');
  // 여기를 []로 변경하세요!
                 startDialogueSession([]); 
}}>
                  <Text style={styles.btnTextBlue}>장소 전용 "공간 대화" 시작하기</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.retryBtn} onPress={() => setStep('SCANNING')}>
                  <Text style={styles.btnTextBlack}>❌ 아니요, 공간 다시 스캔하기</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 3. 사물 스캔 대기 (YOLO 스캔 뷰) */}
          {step === 'OBJECT_SCANNING' && (
            <View style={styles.objectContainer}>
              <View style={styles.scannerBox}>
                <View style={[styles.corner, styles.topLeft]} /><View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} /><View style={[styles.corner, styles.bottomRight]} />
                <View style={styles.wordButton}>
                  <Text style={styles.contextBadge}>{currentSpace}</Text>
                  <Text style={styles.bigWord}>{scannedObject.toUpperCase()}</Text>
                </View>
                <View style={styles.scanLine} />
              </View>
              <Text style={styles.hintText}>공부할 오브젝트를 사각형 안에 맞추고 하단 셔터를 누르세요</Text>
            </View>
          )}

          {/* 하단 셔터 바 */}
          {(step === 'SCANNING' || step === 'CONFIRMING' || step === 'OBJECT_SCANNING') && (
            <View style={styles.bottomControls}>
              <View style={styles.circleBtn}><Text style={{ color: 'white' }}>1x</Text></View>
              <TouchableOpacity 
                style={[styles.mainShutter, step !== 'OBJECT_SCANNING' && { backgroundColor: '#4b5563', opacity: 0.5 }]} 
                disabled={isLocked || step !== 'OBJECT_SCANNING'} 
                onPress={takePicture} 
              />
              <View style={styles.circleBtn}><Ionicons name="flash" size={20} color="white" /></View>
            </View>
          )}

          {/* 4. 사물 복수 후보군 선택 창 */}
          {step === 'SELECT_OBJECT' && (
            <View style={styles.sheetContainer}>
              <Text style={styles.chatTitle}>🔎 공부할 사물 선택</Text>
              <View style={styles.sheetDivider} />
              <ScrollView style={styles.comboList} showsVerticalScrollIndicator={false}>
                {detectedCandidates.map((item) => (
                  <TouchableOpacity key={item} style={styles.comboCard} onPress={() => {
                    setScannedObject(item);
                    setStep('COMBINATIONS_LIST');
                  }}>
                    <View style={styles.comboInfo}>
                      <Text style={styles.comboPhrase}>{item.toUpperCase()}</Text>
                      <Text style={styles.comboMeaning}>{item.meaning || '설명 없음'}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* 5. 표현 구문 리스트 */}
          {step === 'COMBINATIONS_LIST' && (
          <View style={styles.sheetContainer}>
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => { 
              cameraRef.current?.resumePreview(); 
              setIsLocked(false); 
              setStep('OBJECT_SCANNING'); 
    }}>
            <Ionicons name="close-circle" size={28} color="#999" />
          </TouchableOpacity>
          <View style={styles.sheetDivider} />
          <ScrollView style={styles.comboList} showsVerticalScrollIndicator={false}>
           {detectedCandidates.map((item) => (
            <TouchableOpacity key={item.id} style={styles.comboCard} onPress={() => {
              setSelectedCombo(item);
              setStep('DIALOGUE_CHAT');
              startDialogueSession(item.dialogue);
        }}>
              <View style={styles.comboInfo}>
                <Text style={styles.comboPhrase}>{item.phrase}</Text>
                <Text style={styles.comboMeaning}>{item.meaning}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
            </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
)}

          {/* 6. 사물 연계 대화 시뮬레이터 */}
          {step === 'DIALOGUE_CHAT' && selectedCombo && (
            <View style={styles.sheetContainer}>
              <View style={styles.sheetHeader}>
                <TouchableOpacity style={styles.backArrowBtn} onPress={() => setStep('COMBINATIONS_LIST')}>
                  <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={{ alignItems: 'center', flex: 1, marginRight: 24 }}>
                  <Text style={styles.chatTitle}>{scannedObject.toUpperCase()}</Text>
                  <Text style={styles.chatSubTitle}>"{selectedCombo.phrase}" 회화 세션</Text>
                </View>
              </View>
              <View style={styles.sheetDivider} />
              <ScrollView ref={scrollViewRef} style={styles.chatContainer} showsVerticalScrollIndicator={false}>
                {activeDialogue.map((chat, idx) => {
                  const isAI = chat.speaker === 'AI';
                  return (
                    <View key={idx} style={[styles.chatRow, isAI ? styles.aiRow : styles.userRow]}>
                      {isAI && <View style={styles.avatar}><Text style={styles.avatarText}>AI</Text></View>}
                      <View style={[styles.bubble, isAI ? styles.aiBubble : styles.userBubble]}>
                        <Text style={[styles.bubbleText, isAI ? styles.aiText : styles.userText]}>{chat.text}</Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
              <View style={styles.voicePanel}>
                {nextUserStatement ? (
                  <TouchableOpacity style={[styles.micButton, aiStatus !== 'IDLE' && styles.micActive]} disabled={aiStatus !== 'IDLE'} onPress={() => handleUserSpeak(nextUserStatement, selectedCombo.dialogue)}>
                    <Ionicons name="mic" size={22} color="white" />
                    <Text style={styles.micButtonText}>대사 따라 말하기</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.completeText}>🎉 학습이 완료되었습니다.</Text>
                )}
                {nextUserStatement && <Text style={styles.scriptHint}>"{nextUserStatement}"</Text>}
              </View>
            </View>
          )}

          {/* 7. 공간 자유 토킹 룸 */}
          {step === 'SPACE_DIALOGUE_CHAT' && (
            <View style={styles.sheetContainer}>
              <View style={styles.sheetHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.chatTitle}>🌳 장소 대화 연습 ({currentSpace})</Text>
                  <Text style={styles.chatSubTitle}>※ 현재 데모 버전으로 임시 템플릿 대화가 진행됩니다.</Text>
                </View>
                <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setStep('CONFIRMING')}>
                  <Ionicons name="close-circle" size={28} color="#999" />
                </TouchableOpacity>
              </View>
              <View style={styles.sheetDivider} />
              <ScrollView ref={scrollViewRef} style={styles.chatContainer} showsVerticalScrollIndicator={false}>
                {activeDialogue.map((chat, idx) => {
                  const isAI = chat.speaker === 'AI';
                  return (
                    <View key={idx} style={[styles.chatRow, isAI ? styles.aiRow : styles.userRow]}>
                      {isAI && <View style={styles.avatar}><Text style={styles.avatarText}>AI</Text></View>}
                      <View style={[styles.bubble, isAI ? styles.aiBubble : styles.userBubble]}>
                        <Text style={[styles.bubbleText, isAI ? styles.aiText : styles.userText]}>{chat.text}</Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
              <View style={styles.voicePanel}>
                {nextUserStatement ? (
              <TouchableOpacity 
                style={[styles.micButton, { backgroundColor: '#10b981' }]} 
                onPress={() => handleUserSpeak(nextUserStatement, [])}> // 빈 배열로 완전히 교체
                 <Ionicons name="mic" size={22} color="white" />
                    <Text style={styles.micButtonText}>대사 따라 말하기</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.completeText}>🎉 대화 세션 종료</Text>
                )}
                {nextUserStatement && <Text style={styles.scriptHint}>"{nextUserStatement}"</Text>}
              </View>
            </View>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  closeButton: { padding: 5 },
  scanBanner: { alignItems: 'center', marginTop: '25%' },
  scanText: { color: 'white', fontSize: 15, fontWeight: '600', marginBottom: 35, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 22, paddingVertical: 14, borderRadius: 20, textAlign: 'center', width: '85%', lineHeight: 22 },
  scanHighlight: { color: '#67e8f9', fontWeight: 'bold', fontSize: 13 },
  progressText: { color: 'white', fontSize: 14, fontWeight: 'bold', marginTop: 8, zIndex: 12 },
  confirmBox: { backgroundColor: 'white', padding: 24, borderRadius: 24, width: '88%', alignSelf: 'center', alignItems: 'center', marginTop: '20%', elevation: 10 },
  locationTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', textAlign: 'center' },
  subText: { fontSize: 12, color: '#6b7280', marginTop: 6, marginBottom: 20, textAlign: 'center' },
  verticalButtonGroup: { width: '100%', gap: 10 },
  mainActionBtn: { backgroundColor: '#3b82f6', width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  spaceSkipBtn: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe', borderWidth: 1, width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  retryBtn: { backgroundColor: '#f3f4f6', width: '100%', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  btnTextWhite: { color: 'white', fontWeight: '700', fontSize: 15 },
  btnTextBlue: { color: '#2563eb', fontWeight: '700', fontSize: 15 },
  btnTextBlack: { color: '#4b5563', fontWeight: '600', fontSize: 14 },
  objectContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scannerBox: { width: width * 0.72, height: width * 0.72, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#3b82f6', borderWidth: 4 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  wordButton: { backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, zIndex: 10 },
  contextBadge: { color: '#93c5fd', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  bigWord: { color: 'white', fontWeight: 'bold', fontSize: 18, marginTop: 2 },
  scanLine: { width: '90%', height: 2, backgroundColor: '#3b82f6', position: 'absolute', top: '50%' },
  hintText: { color: 'white', marginTop: 30, fontSize: 13, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  sheetContainer: { backgroundColor: 'white', width: '100%', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, height: height * 0.52, position: 'absolute', bottom: 0 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetCloseBtn: { position: 'absolute', right: 0, top: 0 },
  sheetDivider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 12 },
  comboList: { flex: 1 },
  comboCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  comboInfo: { flex: 1 },
  comboPhrase: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  comboMeaning: { fontSize: 13, color: '#64748b', marginTop: 4 },
  backArrowBtn: { padding: 4 },
  chatTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  chatSubTitle: { fontSize: 12, color: '#ef4444', marginTop: 2 },
  chatContainer: { flex: 1, marginTop: 5, marginBottom: 80 },
  chatRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  aiRow: { justifyContent: 'flex-start' },
  userRow: { justifyContent: 'flex-end' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  avatarText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  bubble: { maxWidth: width * 0.65, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  aiBubble: { backgroundColor: '#f1f5f9', borderBottomLeftRadius: 4 },
  userBubble: { backgroundColor: '#3b82f6', borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, color: '#334155', lineHeight: 20 },
  userText: { color: 'white' },
  voicePanel: { position: 'absolute', bottom: 16, left: 24, right: 24, backgroundColor: 'white', paddingTop: 10, alignItems: 'center' },
  micButton: { flexDirection: 'row', backgroundColor: '#3b82f6', width: '100%', paddingVertical: 12, borderRadius: 25, justifyContent: 'center', alignItems: 'center', gap: 6 },
  micActive: { backgroundColor: '#ef4444' },
  micButtonText: { color: 'white', fontWeight: 'bold' },
  scriptHint: { fontSize: 13, color: '#4b5563', marginTop: 8, fontStyle: 'italic' },
  completeText: { color: '#10b981', fontWeight: 'bold', fontSize: 15 },
  bottomControls: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 50 },
  mainShutter: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'white', borderWidth: 5, borderColor: 'rgba(255,255,255,0.4)' },
  circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  permissionButton: { backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  permissionText: { color: 'white', fontWeight: 'bold' },
  progressBarContainer: {
    width: '75%',
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
    borderRadius: 5,
    marginTop: 25,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6', 
    borderRadius: 5,
  },
  barSubText: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  scanCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
});