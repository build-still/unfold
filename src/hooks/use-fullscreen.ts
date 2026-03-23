import { getCurrentWindow } from '@tauri-apps/api/window';
import { useEffect } from 'react';
import React from 'react';
export function useFullscreen() {
  const [fullScreen, setFullScreen] = React.useState(false);

  useEffect(() => {
    const win = getCurrentWindow();

    let cleanup: (() => void) | null = null;

    win.isFullscreen().then(setFullScreen);

    win
      .onResized(() => {
        win.isFullscreen().then(setFullScreen);
      })
      .then((unlisten) => {
        cleanup = unlisten;
      });

    return () => {
      if (cleanup) cleanup();
    };
  }, []);
  return fullScreen;
}
