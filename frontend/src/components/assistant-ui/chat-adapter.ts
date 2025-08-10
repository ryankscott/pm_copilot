import { type ExternalStoreAdapter } from "@assistant-ui/react";
import { sessionApi } from "@/lib/api";
import type { LLMModel } from "@/types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

interface ChatState {
  mode: "create" | "critique" | "question";
  prdId?: string;
  templateId?: string;
  messages: ChatMessage[];
  isLoading: boolean;
}

export class ChatAdapter implements ExternalStoreAdapter<ChatState> {
  private _state: ChatState = {
    mode: "create",
    messages: [],
    isLoading: false,
  };
  private _listeners = new Set<() => void>();

  private llmModel: LLMModel;
  private onStateChange?: (state: ChatState) => void;

  constructor(llmModel: LLMModel, onStateChange?: (state: ChatState) => void) {
    this.llmModel = llmModel;
    this.onStateChange = onStateChange;
  }

  onNew() {
    this.clearConversation();
  }

  get state() {
    return this._state;
  }

  subscribe(listener: () => void) {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  private _notifyListeners() {
    this._listeners.forEach((listener) => listener());
    this.onStateChange?.(this._state);
  }

  private _setState(partial: Partial<ChatState>) {
    this._state = { ...this._state, ...partial };
    this._notifyListeners();
  }

  setMode(mode: ChatState["mode"]) {
    this._setState({ mode, messages: [] });
  }

  setPrdContext(prdId?: string) {
    this._setState({ prdId });
  }

  setTemplateContext(templateId?: string) {
    this._setState({ templateId });
  }

  async sendMessage(content: string): Promise<void> {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    this._setState({
      messages: [...this._state.messages, userMessage],
      isLoading: true,
    });

    try {
      let response: string;

      switch (this._state.mode) {
        case "create":
          const createResponse = await api.generateContent({
            message: content,
            conversation_history: this._state.messages
              .slice(0, -1)
              .map((msg) => ({ role: msg.role, content: msg.content })),
            template_id: this._state.templateId,
            llm_model: this.llmModel.id,
            llm_config: this.llmModel.config,
          });
          response = createResponse.content;
          break;

        case "critique":
          if (!this._state.prdId) {
            throw new Error("PRD ID is required for critique mode");
          }
          const critiqueResponse = await api.critique({
            message: content,
            prd_id: this._state.prdId,
            conversation_history: this._state.messages
              .slice(0, -1)
              .map((msg) => ({ role: msg.role, content: msg.content })),
            llm_model: this.llmModel.id,
            llm_config: this.llmModel.config,
          });
          response = critiqueResponse.content;
          break;

        case "question":
          if (!this._state.prdId) {
            throw new Error("PRD ID is required for question mode");
          }
          const questionResponse = await api.question({
            message: content,
            prd_id: this._state.prdId,
            conversation_history: this._state.messages
              .slice(0, -1)
              .map((msg) => ({ role: msg.role, content: msg.content })),
            llm_model: this.llmModel.id,
            llm_config: this.llmModel.config,
          });
          response = questionResponse.content;
          break;

        default:
          throw new Error(`Unknown mode: ${this._state.mode}`);
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      this._setState({
        messages: [...this._state.messages, assistantMessage],
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to send message:", error);

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Failed to send message"}`,
        timestamp: new Date(),
      };

      this._setState({
        messages: [...this._state.messages, errorMessage],
        isLoading: false,
      });
    }
  }

  clearConversation() {
    this._setState({ messages: [] });
  }
}
