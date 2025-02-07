import { useState, useEffect } from "react";

// 1. useMediaQuery를 사용한 방식 (가장 많이 사용)
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 모바일 기준 768px
    const mediaQuery = window.matchMedia("(max-width: 768px)");

    // 초기값 설정
    setIsMobile(mediaQuery.matches);

    // 리사이즈 이벤트 핸들러
    const handleResize = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    // 이벤트 리스너 등록
    mediaQuery.addEventListener("change", handleResize);

    // 클린업
    return () => {
      mediaQuery.removeEventListener("change", handleResize);
    };
  }, []);

  return isMobile;
};
