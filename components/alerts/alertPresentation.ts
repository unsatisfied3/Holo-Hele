import type { TransitAlert } from "@/types/transit";
import { getAlertPresentationTone } from "@/lib/service-alerts";

interface AlertToneClasses {
  border: string;
  hoverSurface: string;
  surface: string;
  text: string;
}

export function getAlertToneClasses(alert: TransitAlert): AlertToneClasses {
  const tone = getAlertPresentationTone(alert);

  if (tone === "closure") {
    return {
      border: "border-closure-border",
      hoverSurface: "hover:bg-closure-soft",
      surface: "bg-closure-subtle",
      text: "text-closure",
    };
  }

  if (tone === "detour") {
    return {
      border: "border-alert-border",
      hoverSurface: "hover:bg-alert-soft",
      surface: "bg-alert-subtle",
      text: "text-alert",
    };
  }

  return {
    border: "border-brand-blue-border",
    hoverSurface: "hover:bg-brand-blue-soft",
    surface: "bg-brand-blue-subtle",
    text: "text-brand-blue",
  };
}
