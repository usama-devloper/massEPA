import { useCallback, useState } from 'react';
import { clampPhotoViewerIndex, wrapPhotoViewerIndex } from '../utils/photoViewer';

/** Shared open/index/close state for fullscreen photo viewers (wrap-around prev/next). */
export function usePhotoViewer() {
  const [isOpen, setIsOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const openAt = useCallback((startIndex: number) => {
    setIndex(Math.max(0, startIndex));
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const prev = useCallback((length: number) => {
    setIndex((current) => wrapPhotoViewerIndex(current, -1, length));
  }, []);

  const next = useCallback((length: number) => {
    setIndex((current) => wrapPhotoViewerIndex(current, 1, length));
  }, []);

  const clampIndex = useCallback((length: number) => {
    setIndex((current) => clampPhotoViewerIndex(current, length));
  }, []);

  return { isOpen, index, openAt, close, prev, next, clampIndex, setIndex };
}
