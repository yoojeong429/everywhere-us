import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function CameraScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState('SCANNING'); // SCANNING -> CONFIRMING -> OBJECT_READY

  // 360도 스캔 시뮬레이션
  useEffect(() => {
    if (step === 'SCANNING') {
      const timer = setTimeout(() => setStep('CONFIRMING'), 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <TouchableOpacity onPress={requestPermission} style={styles.button}><Text style={{color:'#fff'}}>권한 허용</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back">
        <View style={styles.overlay}>
          
          {/* 상단 헤더: 제목과 뒤로가기(X) 버튼 */}
          <View style={styles.header}>
            <View style={{ width: 32 }} /> {/* 좌측 균형용 */}
            <Text style={styles.headerTitle}>Camera</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <Ionicons name="close" size={32} color="white" />
            </TouchableOpacity>
          </View>

          {/* 단계 1: 360도 스캔 중 (image_3a465b.png 반영) */}
          {step === 'SCANNING' && (
            <View style={styles.scanBanner}>
              <Text style={styles.scanText}>360° 스캔으로 주변 환경을 인식해주세요.</Text>
            </View>
          )}

          {/* 단계 2: 장소 확인 (데모용) */}
          {step === 'CONFIRMING' && (
            <View style={styles.confirmBox}>
              <Text style={styles.locationTitle}>인식된 장소: 서울숲 공원</Text>
              <Text style={styles.subText}>이 장소가 맞나요?</Text>
              <View style={styles.row}>
                <TouchableOpacity style={styles.yesBtn} onPress={() => setStep('OBJECT_READY')}>
                  <Text style={styles.btnText}>네, 맞아요</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.noBtn} onPress={() => setStep('SCANNING')}>
                  <Text style={styles.btnText}>다시 스캔</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 하단 컨트롤 영역 */}
          <View style={styles.bottomControls}>
            <View style={styles.circleBtn}><Text style={{color:'white'}}>2x</Text></View>
            <TouchableOpacity style={styles.mainShutter} />
            <View style={styles.circleBtn}><Ionicons name="flash" size={20} color="white" /></View>
          </View>

        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)', justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  closeButton: { padding: 5 },
  scanBanner: { width: '100%', backgroundColor: 'rgba(255,255,255,0.8)', paddingVertical: 25, marginTop: '30%', alignItems: 'center' },
  scanText: { fontSize: 16, fontWeight: '600', color: '#222' },
  confirmBox: { backgroundColor: 'white', padding: 25, borderRadius: 20, width: '85%', alignSelf: 'center', alignItems: 'center', marginTop: '20%' },
  locationTitle: { fontSize: 18, fontWeight: 'bold', color: '#3b82f6' },
  subText: { marginVertical: 8, color: '#666' },
  row: { flexDirection: 'row', gap: 10, marginTop: 10 },
  yesBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  noBtn: { backgroundColor: '#eee', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  btnText: { fontWeight: 'bold', color: '#333' },
  bottomControls: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 50 },
  mainShutter: { width: 75, height: 75, borderRadius: 37.5, backgroundColor: 'white', borderWidth: 6, borderColor: 'rgba(255,255,255,0.3)' },
  circleBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  button: { backgroundColor: '#3b82f6', padding: 15, borderRadius: 10 }
});