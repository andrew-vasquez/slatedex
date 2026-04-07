import { useRef, useEffect, useState } from "react";

interface AnimatedNumberProps {
  value: number | string;
  className?: string;
  style?: React.CSSProperties;
}

const AnimatedNumber = ({ value, className, style }: AnimatedNumberProps) => {
  const prevValueRef = useRef(value);
  const [isPop, setIsPop] = useState(false);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      setIsPop(true);
      const timer = setTimeout(() => setIsPop(false), 300);
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <span
      className={`${className ?? ""} ${isPop ? "animate-number-pop" : ""}`.trim()}
      style={{ display: "inline-block", ...style }}
    >
      {value}
    </span>
  );
};

export default AnimatedNumber;
