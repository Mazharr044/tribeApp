import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const useParticipantStore = create(
  persist(
    (set, get) => ({
      participants: [],
      isFetched: false,

      fetchParticipants: async () => {
        const { isFetched } = get();
        console.log("isFetched", isFetched);
        if (isFetched) {
          console.log("Participants already fetched.");
          return;
        }

        try {
          const response = await axios.get(
            "https://dummy-chat-server.tribechat.com/api/participants/all"
          );
          set({
            participants: response.data,
            isFetched: true,
          });
          console.log("Participants fetched:", response.data.length);
        } catch (error) {
          console.log("Error fetching participants:", error);
        }
      },

      getParticipantByUUID: (uuid) => {
        const participants = get().participants;        
        return participants.find((item) => item.uuid === uuid);
      },
    }),
    {
      name: "participant-storage",
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);

export default useParticipantStore;
