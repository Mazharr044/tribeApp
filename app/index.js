import { SafeAreaView } from 'react-native';
import ChatScreen from '../src/screens/chat';
import useParticipantStore from '../src/store/participantStore';

export default function HomeScreen() {
  useParticipantStore.getState().fetchParticipants();
  return (
     <SafeAreaView style={{flex:1,}}>
         <ChatScreen/>
     </SafeAreaView>
  );
}