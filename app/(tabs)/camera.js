import { View } from 'react-native';
export default function Dummy() {  return (
      <View style={styles.center}>
        <TouchableOpacity onPress={requestPermission} style={styles.button}><Text style={{color:'#fff'}}>권한 허용</Text></TouchableOpacity>
      </View>
    ); }