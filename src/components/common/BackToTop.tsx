// src/components/common/BackToTop.tsx
import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const BackToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const scrollRoots: (Window | Element)[] = [window];
    document.querySelectorAll('main.app-page-main, main.app-main-scroll').forEach((el) => {
      scrollRoots.push(el);
    });

    const handleScroll = (e: Event) => {
      const target = e.target;
      const scrollTop =
        target === document ? window.scrollY : (target as Element).scrollTop;
      setVisible(scrollTop > 300);
    };

    scrollRoots.forEach((root) => {
      root.addEventListener('scroll', handleScroll, { passive: true });
    });
    handleScroll({ target: document } as Event);

    return () => {
      scrollRoots.forEach((root) => {
        root.removeEventListener('scroll', handleScroll);
      });
    };
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => {
        const main = document.querySelector('main.app-page-main, main.app-main-scroll');
        if (main instanceof HTMLElement && main.scrollTop > 0) {
          main.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }}
      className="fixed bottom-24 right-4 bg-primary text-white p-3 rounded-full shadow-lg z-40 hover:bg-primary/80 transition-all"
    >
      <ArrowUp size={20} />
    </button>
  );
};