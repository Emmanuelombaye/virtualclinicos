import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** App icon — matches `LogoMark` geometry. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          background: "linear-gradient(135deg, #2E5BFF 0%, #25C9E8 100%)",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 32 32">
          <path
            d="M8.5 9.5h4.2L16 18.2 19.3 9.5h4.2L17.2 23h-2.4L8.5 9.5Z"
            fill="#FFFFFF"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
