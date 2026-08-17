const BRAND_BLUE = "#00418d";

const logoSrc = "/brand/holo-hele-logo.png";

export function HoloHeleLogo({
  variant = "hero",
}: {
  variant?: "hero" | "compact";
}) {
  if (variant === "compact") {
    return (
      <img
        alt="Holo Hele"
        className="mx-auto h-16 w-auto"
        decoding="async"
        draggable={false}
        height={82}
        src={logoSrc}
        width={87}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <img
        alt="Holo Hele"
        className="h-[80px] w-auto"
        decoding="async"
        draggable={false}
        height={82}
        src={logoSrc}
        width={87}
      />
      <p
        className="text-base font-medium leading-normal"
        style={{ color: BRAND_BLUE }}
      >
        Oʻahu&apos;s Transit App
      </p>
    </div>
  );
}
