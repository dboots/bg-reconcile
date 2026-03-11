import React from "react";

const ImageDot: React.FC<any> = (props: any) => {
  const { cx, cy, payload } = props as any;
  if (cx == null || cy == null || !payload?.image) return null;
  const size = 36;
  return (
    <image
      href={payload.image}
      x={cx - size / 2}
      y={cy - size / 2}
      width={size}
      height={size}
      preserveAspectRatio="xMidYMid slice"
    />
  );
};

export default ImageDot;
