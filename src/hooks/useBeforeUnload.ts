import { useEffect } from 'react';
import { useViewerStore } from '../store/viewerStore';

/**
 * useBeforeUnload Hook
 *
 * Prevents the user from accidentally navigating away or refreshing the page
 * if there are unsaved changes (isDirty = true).
 */
export function useBeforeUnload() {
  const isDirty = useViewerStore((state) => state.isDirty);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        // The dialog triggers differently in different browsers, so try all of these:
        event.preventDefault();
        event.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);
}
