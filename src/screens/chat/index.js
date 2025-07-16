import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import apiClient from "../../api";
import useParticipantStore from "../../store/participantStore";

const ChatScreen = () => {
  const [allMessages, setAllMessages] = useState([]);
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 170
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [inputText, setInputText] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [showReactionsSheet, setShowReactionsSheet] = useState(false);
  const [currentReactions, setCurrentReactions] = useState([]);

  const participants = useParticipantStore.getState().participants;

  const flatListRef = useRef(null);

  const getAllMessages = async () => {
    try {
      const response = await apiClient.get("/messages/all");
      const data = response?.data;

      // Sort + Randomly edited flag add
      const sortedMessages = data
        .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
        .map((msg) => ({
          ...msg,
          edited: Math.random() < 0.3, // 30% messages edited honge
        }));

      setAllMessages(sortedMessages);

      const initialMessages = sortedMessages.slice(0, pageSize);
      setMessages(initialMessages);

      if (sortedMessages.length <= pageSize) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  // const getAllMessages = async () => {
  //   try {
  //     const response = await apiClient.get("/messages/all");
  //     const data = response?.data;

  //     const sortedMessages = data.sort(
  //       (a, b) => new Date(b.sentAt) - new Date(a.sentAt)
  //     );

  //     setAllMessages(sortedMessages);

  //     const initialMessages = sortedMessages.slice(0, pageSize);
  //     setMessages(initialMessages);

  //     if (sortedMessages.length <= pageSize) {
  //       setHasMore(false);
  //     }
  //   } catch (error) {
  //     console.error("Failed to fetch messages:", error);
  //   }
  // };
  const fetchLatestMessages = async () => {
    try {
      const response = await apiClient.get("/messages/latest");
      const latestMessages = response.data;

      const existingUuids = new Set(messages.map((msg) => msg.uuid));

      const newMessages = latestMessages.filter(
        (msg) => !existingUuids.has(msg.uuid)
      );

      if (newMessages.length > 0) {
        const updatedAllMessages = [...newMessages, ...allMessages];
        const sortedMessages = updatedAllMessages.sort(
          (a, b) => new Date(b.sentAt) - new Date(a.sentAt)
        );

        setAllMessages(sortedMessages);

        setMessages((prev) => {
          const prevUuids = new Set(prev.map((msg) => msg.uuid));
          const filteredNewMessages = newMessages.filter(
            (msg) => !prevUuids.has(msg.uuid)
          );
          return [...filteredNewMessages, ...prev];
        });
      }
    } catch (error) {
      console.error("Failed to fetch latest messages:", error);
    }
  };

  const fetchParticipants = useParticipantStore(
    (state) => state.fetchParticipants
  );
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Count");

      fetchLatestMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchParticipants();
    getAllMessages();
  }, []);

  const loadMoreMessages = () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);

    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;

    const newMessages = allMessages.slice(startIndex, endIndex);

    if (newMessages.length > 0) {
      setTimeout(() => {
        // inverted list ke liye naya data start mein lagayega
        setMessages((prev) => [...newMessages, ...prev]);
        setPage((prev) => prev + 1);

        if (endIndex >= allMessages.length) {
          setHasMore(false);
        }

        setLoadingMore(false);
      }, 500);
    } else {
      setHasMore(false);
      setLoadingMore(false);
    }
  };

  const renderMessageItem = ({ item, index }) => {
    const reactionCounts = {};
    item.reactions?.forEach((reaction) => {
      const value = reaction.value;
      if (reactionCounts[value]) {
        reactionCounts[value] += 1;
      } else {
        reactionCounts[value] = 1;
      }
    });

    const participant = useParticipantStore
      .getState()
      .getParticipantByUUID(item?.authorUuid);

    if (!participant) return null;

    const isFirstOfGroup =
      index === 0 || messages[index - 1]?.authorUuid !== item.authorUuid;

    const isCurrentUser = participant.name === "You";

    const messageTime = new Date(item.sentAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return (
      <View style={{ marginBottom: 0 }}>
        {isFirstOfGroup && !isCurrentUser && (
          <View style={styles.header}>
            <Image
              source={{ uri: participant.avatarUrl }}
              style={styles.avatar}
            />
            <Text style={styles.name}>{participant.name}</Text>
          </View>
        )}

        <View
          style={[
            styles.messageWrapper,
            isCurrentUser ? styles.rightAlign : styles.leftAlign,
          ]}
        >
          <Pressable
            onLongPress={() => {
              setSelectedMessageId(item.uuid);
              setHighlightedMessageId(item.uuid);
            }}
            style={[
              styles.messageBubble,
              isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
              highlightedMessageId === item.uuid && styles.highlightedBubble,
            ]}
          >
            {item.text?.length > 0 && (
              <View
                style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 0,alignItems:'center' }}
              >
                <Text style={styles.messageText}>{item.text}</Text>
                {item.edited && (
                  <Text style={styles.editedText}> (edited)</Text>
                )}
              </View>
            )}

            {!isCurrentUser &&
              item.attachments?.length > 0 &&
              item.attachments.map((attachment, i) => (
                <Pressable
                  key={i}
                  onPress={() => setSelectedImage(attachment.url)}
                >
                  <Image
                    source={{ uri: attachment.url }}
                    style={styles.attachmentImage}
                  />
                </Pressable>
              ))}
          </Pressable>
          {Object.keys(reactionCounts).length > 0 && (
            <Pressable
              onPress={() => {
                setCurrentReactions(item.reactions);
                setShowReactionsSheet(true);
              }}
            >
              <View style={styles.reactionsRow}>
                {Object.entries(reactionCounts).map(([emoji, count]) => (
                  <View
                    key={emoji}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginRight: 8,
                      backgroundColor: "#eee",
                      borderRadius: 12,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>{emoji}</Text>
                    {/* count sirf tab dikhayein jab 2 ya us se zyada ho */}
                    {count > 1 && (
                      <Text
                        style={{
                          fontSize: 12,
                          marginLeft: 4,
                          color: "#333",
                        }}
                      >
                        {count}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </Pressable>
          )}

          {/* Message Time */}
          <Text
            style={{
              color: "#999",
              fontSize: 12,
              marginTop: 2,
              marginRight: isCurrentUser ? 8 : 0,
            }}
          >
            {messageTime}
          </Text>
        </View>
      </View>
    );
  };

  const handleSend = async () => {
    if (inputText.trim() === "") return;

    try {
      const payload = {
        text: inputText,
      };

      const response = await apiClient.post("/messages/new", payload);
      const newMessage = response.data;
      setMessages((prev) => [newMessage, ...prev]);

      console.log("Sent Message:", newMessage);

      const updatedAllMessages = [newMessage, ...allMessages];
      setAllMessages(updatedAllMessages);
      const initialMessages = updatedAllMessages.slice(0, pageSize);
      setMessages(initialMessages);
      setPage(1);

      if (updatedAllMessages.length <= pageSize) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      setInputText("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
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
    <View style={{ flex: 1, marginTop: 5 }}>
      <StatusBar backgroundColor="#ffffffff" barStyle="dark-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={
          Platform.OS === "ios" ? 0 : StatusBar.currentHeight || 0
        }
      >
        <View style={styles.container}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item, index) => item?.uuid || index.toString()}
            contentContainerStyle={{ padding: 20, paddingBottom: 80 }}
            onEndReached={loadMoreMessages}
            onEndReachedThreshold={0.1}
            ListFooterComponent={
              loadingMore ? (
                <Text style={{ textAlign: "center", padding: 10 }}>
                  Loading more...
                </Text>
              ) : null
            }
            initialNumToRender={50}
            inverted
          />
          {showMentions && (
            <View
              style={{
                maxHeight: 150,
                backgroundColor: "#fff",
                borderTopWidth: 1,
                borderColor: "#ddd",
              }}
            >
              <FlatList
                data={participants.filter((p) =>
                  p.name.toLowerCase().includes(mentionQuery)
                )}
                keyExtractor={(item) => item.uuid}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      const words = inputText.split(" ");
                      words.pop(); // remove the @mention query word
                      const newText =
                        [...words, `@${item.name}`].join(" ") + " ";
                      setInputText(newText);
                      setShowMentions(false);
                    }}
                    style={{
                      padding: 10,
                      borderBottomWidth: 1,
                      borderColor: "#eee",
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{item.name}</Text>
                  </Pressable>
                )}
              />
            </View>
          )}

          <View style={styles.inputWrapper}>
            <View style={styles.inputBar}>
              <TextInput
                value={inputText}
                onChangeText={(text) => {
                  setInputText(text);

                  const lastWord = text.split(" ").pop();
                  if (lastWord.startsWith("@")) {
                    setMentionQuery(lastWord.slice(1).toLowerCase());
                    setShowMentions(true);
                  } else {
                    setShowMentions(false);
                    setMentionQuery("");
                  }
                }}
                placeholder="Type a message..."
                style={styles.input}
                placeholderTextColor={"#ddd"}
              />

              <Pressable onPress={handleSend} style={styles.sendButton}>
                <Ionicons name="send" size={12} color="#fff" />
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
        <Modal
          visible={!!selectedImage}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedImage(null)}
        >
          <View style={styles.modalOverlays}>
            <Pressable
              onPress={() => setSelectedImage(null)}
              style={{
                position: "absolute",
                top: 30,
                right: 40,
                zIndex: 1,
                // backgroundColor: "rgba(0,0,0,0.6)",
                borderRadius: 20,
                padding: 8,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16 }}>✖️</Text>
            </Pressable>

            {/* Image */}
            <Pressable
              style={styles.modalOverlays}
              onPress={() => setSelectedImage(null)}
            >
              <Image
                source={{ uri: selectedImage }}
                style={{ width: 300, height: 300 }}
              />
            </Pressable>
          </View>
        </Modal>
        <Modal
          visible={showReactionsSheet}
          transparent
          animationType="slide"
          onRequestClose={() => setShowReactionsSheet(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "flex-end",
              backgroundColor: "rgba(0,0,0,0.4)",
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                padding: 20,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                maxHeight: "50%",
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}
              >
                Reactions
              </Text>

              {currentReactions.length > 0 ? (
                currentReactions.map((reaction) => {
                  const participant = useParticipantStore
                    .getState()
                    .getParticipantByUUID(reaction.participantUuid);

                  return (
                    <View
                      key={reaction.uuid}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 10,
                      }}
                    >
                      <Text style={{ fontSize: 22, marginRight: 12 }}>
                        {reaction.value}
                      </Text>
                      <Image
                        source={{ uri: participant?.avatarUrl }}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          marginRight: 8,
                        }}
                      />
                      <Text style={{ fontSize: 16 }}>
                        {participant?.name || "Unknown"}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <Text>No reactions</Text>
              )}

              <Pressable
                onPress={() => setShowReactionsSheet(false)}
                style={{
                  marginTop: 20,
                  backgroundColor: "#0288d1",
                  paddingVertical: 10,
                  borderRadius: 20,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 16 }}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </View>
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
  // editedText: { color: "#555", fontSize: 12, fontStyle: "italic" },

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
    // backgroundColor: "#000",
    borderTopWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 24,
    marginRight: 8,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#0288d1",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 22,
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
  attachmentImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginTop: 5,
  },
  modalOverlays: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "90%",
    height: "70%",
    borderRadius: 12,
  },
  editedText: {
    color: "#555",
    fontSize: 12,
    fontStyle: "italic",
  },
});
