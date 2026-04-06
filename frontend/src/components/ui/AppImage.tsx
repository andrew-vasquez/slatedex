import { forwardRef } from "react";
import type { CSSProperties, ImgHTMLAttributes } from "react";

type AppImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  unoptimized?: boolean;
};

const AppImage = forwardRef<HTMLImageElement, AppImageProps>(function AppImage(
  { fill = false, style, width, height, loading, ...props },
  ref
) {
  const imageStyle: CSSProperties = fill
    ? {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        ...style,
      }
    : style ?? {};

  return (
    <img
      ref={ref}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={loading ?? "lazy"}
      style={imageStyle}
      {...props}
    />
  );
});

export default AppImage;
