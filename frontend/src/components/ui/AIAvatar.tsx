import React from "react";

import OpenAILogo from "@/assets/openai.svg";
import AnthropicLogo from "@/assets/anthropic.svg";
import OllamaLogo from "@/assets/ollama.svg";
import ClaudeLogo from "@/assets/claude.svg";
import GeminiLogo from "@/assets/gemini.svg";

interface AIAvatarProps {
  provider?: string;
  model?: string;
}

const AIAvatar: React.FC<AIAvatarProps> = ({ provider, model }) => {
  const getLogo = () => {
    if (model) {
      if (model.toLowerCase().includes("claude")) return ClaudeLogo;
      if (model.toLowerCase().includes("gemini")) return GeminiLogo;
    }
    if (provider) {
      if (provider.toLowerCase() === "openai") return OpenAILogo;
      if (provider.toLowerCase() === "anthropic") return AnthropicLogo;
      if (provider.toLowerCase() === "ollama") return OllamaLogo;
    }
    return OpenAILogo; // Default logo
  };

  const getModelName = () => {
    let adjustedModel = model || "AI";
    if (model) {
      // Return the model name, but remove "models/" from the start if it exists
      if (model.startsWith("models/")) {
        adjustedModel = model.replace("models/", "");
      }
      if (model.includes(":")) {
        adjustedModel = model.split(":")[0];
      }
      return adjustedModel;
    }
    return adjustedModel;
  };

  const LogoComponent = getLogo();

  return (
    <div className={"flex flex-row gap-2 justify-center items-center"}>
      <img
        src={LogoComponent}
        alt={`${getModelName()} logo`}
        className="w-4 h-4"
      />
      <span className="text-xs">{getModelName()}</span>
    </div>
  );
};

export default AIAvatar;
