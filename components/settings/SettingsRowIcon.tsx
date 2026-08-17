export type SettingsRowIconName =
  | "alert"
  | "globe"
  | "help"
  | "legal"
  | "map"
  | "phone"
  | "report"
  | "star"
  | "ticket"
  | "video";

export function SettingsRowIcon({
  name,
  className = "",
}: {
  name: SettingsRowIconName;
  className?: string;
}) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...common}
    >
      {name === "help" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.8 9a2.4 2.4 0 1 1 3.5 2.1c-.9.5-1.3 1-1.3 2" />
          <path d="M12 17h.01" />
        </>
      ) : name === "ticket" ? (
        <>
          <path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4V7Z" />
          <path d="M9 7v10" />
        </>
      ) : name === "video" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m10 8 6 4-6 4V8Z" />
        </>
      ) : name === "map" ? (
        <>
          <path d="m3 6 5-2 8 2 5-2v14l-5 2-8-2-5 2V6Z" />
          <path d="M8 4v14M16 6v14" />
        </>
      ) : name === "alert" ? (
        <>
          <path d="M12 3 2.8 20h18.4L12 3Z" />
          <path d="M12 9v5M12 17h.01" />
        </>
      ) : name === "phone" ? (
        <path d="M7.2 3.5 10 7.8 8.2 10a14 14 0 0 0 5.8 5.8l2.2-1.8 4.3 2.8-1 3c-.3.8-1 1.3-1.9 1.2A17 17 0 0 1 3 6.4c-.1-.8.4-1.6 1.2-1.9l3-1Z" />
      ) : name === "report" ? (
        <>
          <path d="M5 4h14v13H9l-4 3V4Z" />
          <path d="M9 8h6M9 12h4" />
        </>
      ) : name === "globe" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </>
      ) : name === "star" ? (
        <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8-5.4 2.8 1-6-4.4-4.3 6.1-.9L12 3Z" />
      ) : (
        <>
          <path d="M6 3h9l3 3v15H6V3Z" />
          <path d="M15 3v4h4M9 12h6M9 16h6" />
        </>
      )}
    </svg>
  );
}
