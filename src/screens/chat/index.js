import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import apiClient from "../../api";
import useParticipantStore from "../../store/participantStore";

const dummyMessages = [
  {
    id: "1",
    user: {
      name: "Ali",
      avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    },
    time: "9:00 PM",
    text: "Hello!",
    edited: false,
    reactions: { "👍": 1, "❤️": 1 },
    image: null,
  },
  {
    id: "2",
    user: {
      name: "Ali",
      avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    },
    time: "9:01 PM",
    text: "How are you?",
    edited: true,
    reactions: [],
    image: null,
  },
  {
    id: "3",
    user: {
      name: "Sara",
      avatar: "https://randomuser.me/api/portraits/women/2.jpg",
    },
    time: "9:02 PM",
    text: "",
    edited: false,
    reactions: { "😂": 3 },
    image: "https://picsum.photos/200",
  },
  {
    id: "4",
    user: {
      name: "Sara",
      avatar: "https://randomuser.me/api/portraits/women/2.jpg",
    },
    time: "9:03 PM",
    text: "Just sent you a photo!",
    edited: false,
    reactions: { "🔥": 1 },
    image: null,
  },
  {
    id: "5",
    user: {
      name: "You",
      avatar: "https://randomuser.me/api/portraits/men/10.jpg",
    },
    time: "9:05 PM",
    text: "Looks awesome 😍",
    edited: false,
    reactions: {},
    image: null,
  },
  {
    id: "6",
    user: {
      name: "Ahmed",
      avatar: "https://randomuser.me/api/portraits/men/5.jpg",
    },
    time: "9:07 PM",
    text: "Guys, what’s the plan for tonight?",
    edited: false,
    reactions: { "😂": 1 },
    image: null,
  },
  {
    id: "7",
    user: {
      name: "You",
      avatar: "https://randomuser.me/api/portraits/men/10.jpg",
    },
    time: "9:08 PM",
    text: "Dinner at 9:30?",
    edited: true,
    reactions: { "👍": 2 },
    image: null,
  },
  {
    id: "8",
    user: {
      name: "Ali",
      avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    },
    time: "9:10 PM",
    text: "I’m in!",
    edited: false,
    reactions: { "👍": 2, "😂": 1 },
    image: null,
  },
  {
    id: "9",
    user: {
      name: "Sara",
      avatar: "https://randomuser.me/api/portraits/women/2.jpg",
    },
    time: "9:11 PM",
    text: "Let’s go!",
    edited: false,
    reactions: { "🔥": 1 },
    image: null,
  },
  {
    id: "10",
    user: {
      name: "Ahmed",
      avatar: "https://randomuser.me/api/portraits/men/5.jpg",
    },
    time: "9:12 PM",
    text: "Sending location 📍",
    edited: false,
    reactions: [],
    image: null,
  },
  {
    id: "11",
    user: {
      name: "Ahmed",
      avatar: "https://randomuser.me/api/portraits/men/5.jpg",
    },
    time: "9:13 PM",
    text: "Goof",
    edited: false,
    reactions: [],
    // image: 'https://picsum.photos/201',
  },
  {
    id: "12",
    user: {
      name: "Ahmed",
      avatar: "https://randomuser.me/api/portraits/men/5.jpg",
    },
    time: "9:13 PM",
    text: "Noce",
    edited: false,
    reactions: [],
    // image: 'https://picsum.photos/201',
  },
];

const ChatScreen = () => {
  const [messages, setMessages] = useState(dummyMessages);
  const [allMessage, setAllMessage] = useState([]);
  const [inputText, setInputText] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const flatListRef = useRef(null);

  const getAllMessages = async () => {
    try {
      const response = await apiClient.get("/messages/all");
      setAllMessage(response?.data);
      // setMessages(response?.data)
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      throw error;
    }
  };
  // console.log("UUID---->",allMessage.map((item)=>item?.uuid));
  const fetchParticipants = useParticipantStore(
    (state) => state.fetchParticipants
  );

  useEffect(() => {
    fetchParticipants();
    getAllMessages();
  }, []);
  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);
  const renderMessageItem = ({ item, index }) => {
    const participant = useParticipantStore
      .getState()
      .getParticipantByUUID(item?.uuid);
    // if (!participant) return null;
    const isFirstOfGroup =
      index === 0 || messages[index - 1].user.name !== item.user.name;
     console.log("Image---->",item);
     
    const isCurrentUser = item.user.name === "You";

    return (
      <View style={{ marginBottom: 0 }}>
        {isFirstOfGroup && !isCurrentUser && (
          <View style={styles.header}>
            <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
            <Text style={styles.name}>{item.user.name}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
        )}

        <View
          style={[
            styles.messageWrapper,
            isCurrentUser ? styles.rightAlign : styles.leftAlign,
          ]}
        >
          {item.text ? (
            <Pressable
              onLongPress={() => {
                setSelectedMessageId(item.id);
                setHighlightedMessageId(item.id);
              }}
              style={[
                styles.messageBubble,
                isCurrentUser
                  ? styles.currentUserBubble
                  : styles.otherUserBubble,
                highlightedMessageId === item.id && styles.highlightedBubble,
              ]}
            >
              <Text style={styles.messageText}>
                {item.text}
                {item.edited ? " (edited)" : ""}
              </Text>
            </Pressable>
          ) : null}

          {item.image && (
            <Pressable
              onLongPress={() => {
                setSelectedMessageId(item.id);
                setHighlightedMessageId(item.id);
              }}
              style={[
                styles.messageBubble,
                isCurrentUser
                  ? styles.currentUserBubble
                  : styles.otherUserBubble,
                highlightedMessageId === item.id && styles.highlightedBubble,
              ]}
            >
              <Image source={{ uri: item.image }} style={styles.messageImage} />
            </Pressable>
          )}

          {Object.keys(item.reactions).length > 0 && (
            <View style={styles.reactionsRow}>
              {Object.entries(item.reactions).map(([emoji, count]) => (
                <Text key={emoji} style={styles.reaction}>
                  {emoji}
                  {count > 1 ? ` ${count}` : ""}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const handleSend = () => {
    if (inputText.trim() === "") return;

    const newMessage = {
      id: (messages.length + 1).toString(),
      user: {
        name: "You",
        avatar: "https://randomuser.me/api/portraits/men/10.jpg",
      },
      time: "Now",
      text: inputText,
      edited: false,
      reactions: [],
      image: null,
    };

    setMessages([...messages, newMessage]);
    setInputText("");
  };
  const handleReact = (emoji) => {
    const updatedMessages = messages.map((msg) => {
      if (msg.id === selectedMessageId) {
        const currentCount = msg.reactions[emoji] || 0;
        return {
          ...msg,
          reactions: {
            ...msg.reactions,
            [emoji]: currentCount + 1,
          },
        };
      }
      return msg;
    });
    setMessages(updatedMessages);
    setSelectedMessageId(null);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 80 }}
          extraScrollHeight={20}
          keyboardShouldPersistTaps="handled"
        />

        <View style={styles.inputWrapper}>
          <View style={styles.inputBar}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              style={styles.input}
            />
            <Pressable onPress={handleSend} style={styles.sendButton}>
              <Text style={styles.sendText}>Send</Text>
            </Pressable>
          </View>
        </View>

        {selectedMessageId && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={{ fontSize: 18, marginBottom: 16 }}>
                React to message
              </Text>
              <View style={{ flexDirection: "row" }}>
                <Text style={styles.emoji} onPress={() => handleReact("👍")}>
                  👍
                </Text>
                <Text style={styles.emoji} onPress={() => handleReact("❤️")}>
                  ❤️
                </Text>
                <Text style={styles.emoji} onPress={() => handleReact("😂")}>
                  😂
                </Text>
                <Text style={styles.emoji} onPress={() => handleReact("🔥")}>
                  🔥
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setSelectedMessageId(null);
                  setHighlightedMessageId(null);
                }}
                style={styles.closeButton}
              >
                <Text style={{ color: "#fff" }}>Close</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5", paddingHorizontal: 0 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 8 },
  name: { fontWeight: "bold", fontSize: 15, marginRight: 5, color: "#333" },
  time: { color: "#999", fontSize: 12 },

  messageWrapper: { flexDirection: "column" },
  leftAlign: { alignItems: "flex-start" },
  rightAlign: { alignItems: "flex-end" },

  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: "80%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    marginVertical: 2,
  },

  reactionsRow: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    marginLeft: 5,
    marginBottom: 10,
  },

  currentUserBubble: { backgroundColor: "#4fc3f7" },
  otherUserBubble: { backgroundColor: "#fff" },

  messageText: { fontSize: 16, color: "#222" },
  editedText: { color: "#555", fontSize: 12, fontStyle: "italic" },

  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 14,
    marginTop: 6,
  },
  reaction: {
    marginRight: 0,
    fontSize: 14,
  },

  inputBar: {
    flexDirection: "row",
    padding: 8,
    backgroundColor: "#000",
    borderTopWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 24,
    marginRight: 8,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#0288d1",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
  },
  sendText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    width: "80%",
    alignItems: "center",
  },
  emoji: {
    fontSize: 30,
    marginHorizontal: 8,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#0288d1",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  highlightedBubble: {
    borderWidth: 0,
    borderColor: "#0288d1",
    transform: [{ scale: 0.98 }],
  },
  // inputWrapper: {
  //   position: 'absolute',
  //   bottom: 0,
  //   left: 0,
  //   right: 0,
  // },
});
