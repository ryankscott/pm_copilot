interface PMCopilotLogoProps {
  className?: string;
  size?: number;
  variant?: "full" | "icon" | "text";
}

export function PMCopilotLogo({
  className = "",
  size = 32,
  variant = "full",
}: PMCopilotLogoProps) {
  const iconSvg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle with gradient */}
      <defs>
        <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>
        <linearGradient
          id="accent-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>

      {/* Main background */}
      <circle
        cx="16"
        cy="16"
        r="15"
        fill="url(#bg-gradient)"
        stroke="#1E40AF"
        strokeWidth="1"
      />

      {/* Document/PRD icon */}
      <rect
        x="8"
        y="6"
        width="12"
        height="16"
        rx="1.5"
        fill="white"
        fillOpacity="0.95"
      />
      <rect
        x="8"
        y="6"
        width="12"
        height="16"
        rx="1.5"
        stroke="#E5E7EB"
        strokeWidth="0.5"
      />

      {/* Document lines */}
      <line
        x1="10"
        y1="9"
        x2="18"
        y2="9"
        stroke="#6B7280"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <line
        x1="10"
        y1="11.5"
        x2="16"
        y2="11.5"
        stroke="#6B7280"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <line
        x1="10"
        y1="14"
        x2="18"
        y2="14"
        stroke="#6B7280"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <line
        x1="10"
        y1="16.5"
        x2="15"
        y2="16.5"
        stroke="#6B7280"
        strokeWidth="0.8"
        strokeLinecap="round"
      />

      {/* AI/Copilot star accent */}
      <g transform="translate(16, 3)">
        <circle cx="5" cy="5" r="5.5" fill="url(#accent-gradient)" />
        <path
          d="M5 2 L6.2 3.8 L8 5 L6.2 6.2 L5 8 L3.8 6.2 L2 5 L3.8 3.8 Z"
          fill="white"
          fillOpacity="0.9"
        />
      </g>
    </svg>
  );

  const textElement = <span className="font-bold text-lg">PM Copilot</span>;

  if (variant === "icon") {
    return iconSvg;
  }

  if (variant === "text") {
    return textElement;
  }

  // variant === "full"
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {iconSvg}
      {textElement}
    </div>
  );
}

// Export different variants for convenience
export const PMCopilotIcon = (props: Omit<PMCopilotLogoProps, "variant">) => (
  <PMCopilotLogo {...props} variant="icon" />
);

export const PMCopilotText = (props: Omit<PMCopilotLogoProps, "variant">) => (
  <PMCopilotLogo {...props} variant="text" />
);
