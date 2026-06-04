import { useCallback, useEffect, useState } from 'react';

export default function useColumnCount() {
  const [screenSize, setScreenSize] = useState<any>(document.getElementById("resize"));

  const onSizeChanged = useCallback(() => {
    setScreenSize(document.getElementById("resize"));
  }, []);

  useEffect(() => {
    return () => {
    };
  },
  [onSizeChanged, screenSize]);
  
  return screenSize.offsetWidth >= 350 ? 2 : 1;

};

