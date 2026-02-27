import { useState, useEffect } from 'react';

/**
 * useMediaQuery hook to detect screen size changes
 * @param {string} query - CSS Media Query (e.g., '(max-width: 1024px)')
 * @returns {boolean} matches - Whether the query matches the current viewport
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener('resize', listener);
    return () => window.removeEventListener('resize', listener);
  }, [matches, query]);

  return matches;
}

/**
 * useResponsiveSidebar hook to manage sidebar state based on screen size
 * @returns {object} { sidebarOpen, setSidebarOpen, isMobile }
 */
export function useResponsiveSidebar() {
  const isMobile = useMediaQuery('(max-width: 1024px)');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Auto-close sidebar on mobile, auto-open on desktop
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  return { sidebarOpen, setSidebarOpen, isMobile };
}
