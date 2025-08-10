import { create } from "zustand";

interface MessageMetadata {
  messageId: string;
  inputTokens?: number;
  outputTokens?: number;
  generationTime?: number;
  cost?: number;
  langfuseData?: {
    traceId: string;
    generationId: string;
  };
  provider: string;
  model: string;
  timestamp: Date;
  responseContent?: string; // To help match with assistant-ui messages
}

interface MessageMetadataState {
  metadata: Map<string, MessageMetadata>;
  pendingMetadata: MessageMetadata[]; // Temporary storage for unmatched metadata

  // Actions
  setMessageMetadata: (
    messageId: string,
    metadata: Omit<MessageMetadata, "messageId">
  ) => void;
  getMessageMetadata: (messageId: string) => MessageMetadata | undefined;
  addPendingMetadata: (metadata: Omit<MessageMetadata, "messageId">) => void;
  matchPendingMetadata: (messageId: string, responseContent: string) => boolean;
  clearMetadata: () => void;
}

export const useMessageMetadataStore = create<MessageMetadataState>(
  (set, get) => ({
    metadata: new Map(),
    pendingMetadata: [],

    setMessageMetadata: (
      messageId: string,
      metadata: Omit<MessageMetadata, "messageId">
    ) => {
      set((state) => {
        const newMetadata = new Map(state.metadata);
        newMetadata.set(messageId, { messageId, ...metadata });
        return { metadata: newMetadata };
      });
    },

    getMessageMetadata: (messageId: string) => {
      return get().metadata.get(messageId);
    },

    addPendingMetadata: (metadata: Omit<MessageMetadata, "messageId">) => {
      set((state) => ({
        pendingMetadata: [
          ...state.pendingMetadata,
          { messageId: "", ...metadata },
        ],
      }));
    },

    matchPendingMetadata: (messageId: string, responseContent: string) => {
      const state = get();
      const matchIndex = state.pendingMetadata.findIndex(
        (pending) =>
          pending.responseContent &&
          responseContent.includes(pending.responseContent.substring(0, 100)) // Match first 100 chars
      );

      if (matchIndex !== -1) {
        const matchedMetadata = state.pendingMetadata[matchIndex];
        set((currentState) => {
          const newMetadata = new Map(currentState.metadata);
          newMetadata.set(messageId, { ...matchedMetadata, messageId });

          const newPendingMetadata = [...currentState.pendingMetadata];
          newPendingMetadata.splice(matchIndex, 1);

          return {
            metadata: newMetadata,
            pendingMetadata: newPendingMetadata,
          };
        });
        return true;
      }
      return false;
    },

    clearMetadata: () => {
      set({ metadata: new Map(), pendingMetadata: [] });
    },
  })
);
