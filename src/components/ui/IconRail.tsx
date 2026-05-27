import { motion, AnimatePresence } from 'motion/react';
import { QuestionMarkCircleIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useViewerStore } from '../../store/viewerStore';
import { inject4D, ACCENT_COLOR, selectIs4D } from '../../utils/uiLayout';
import { NAV_SECTIONS, NAV_SECTION_4D, NAV_LAYOUTS } from '../../utils/navConstants';

export function IconRail() {
  const activeSections = useViewerStore((state) => state.activeSections);
  const is4D           = useViewerStore(selectIs4D);
  const toggleSection  = useViewerStore((state) => state.toggleSection);
  const layoutMode     = useViewerStore((state) => state.layoutMode);
  const setLayoutMode  = useViewerStore((state) => state.setLayoutMode);
  const setHelpModalOpen = useViewerStore((state) => state.setHelpModalOpen);
  const theme          = useViewerStore((state) => state.theme);
  const toggleTheme    = useViewerStore((state) => state.toggleTheme);

  const isDark = theme === 'dark';
  const fg35   = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';
  const fg65   = isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)';
  const fg85   = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)';
  const bg0    = isDark ? 'rgba(255,255,255,0)'    : 'rgba(0,0,0,0)';
  const bgAct  = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';
  const bgHov  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const sections = inject4D(NAV_SECTIONS, NAV_SECTION_4D, is4D, 4);

  return (
    <div className="w-12 flex-shrink-0 flex flex-col bg-white/80 dark:bg-black/30 border-r border-black/8 dark:border-white/8 z-10 select-none">
      {/* Logo */}
      <motion.div
        className="flex items-center justify-center py-3 border-b border-black/8 dark:border-white/8"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      >
        <img src="/logo.svg" alt="Flux" draggable={false} className="w-6 h-6" />
      </motion.div>

      {/* Layout modes */}
      <div className="flex flex-col border-b border-black/8 dark:border-white/8 py-1">
        {NAV_LAYOUTS.map(({ id, icon: Icon, label }) => {
          const isActive = layoutMode === id;
          return (
            <motion.button
              key={id}
              onClick={() => setLayoutMode(id)}
              title={label}
              className="!p-0 !border-0 rounded-none w-full h-9 flex items-center justify-center"
              animate={{
                backgroundColor: isActive ? bgAct : bg0,
                color: isActive ? fg85 : fg35,
              }}
              whileHover={{
                backgroundColor: isActive ? bgAct : bgHov,
                color: isActive ? fg85 : fg65,
              }}
              whileTap={{ scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <Icon className="w-[18px] h-[18px]" />
            </motion.button>
          );
        })}
      </div>

      {/* Section toggles */}
      <div className="flex flex-col flex-1 py-1 overflow-y-auto overflow-x-hidden">
        {sections.map(({ id, icon: Icon, label }) => {
          const isActive = activeSections.includes(id);
          return (
            <motion.button
              key={id}
              onClick={() => toggleSection(id)}
              title={label}
              style={{ padding: '11px 0' }}
              className="relative rounded-none w-full flex flex-col items-center justify-center gap-1"
              animate={{
                backgroundColor: isActive ? 'rgba(19,221,209,0.09)' : bg0,
                color: isActive ? ACCENT_COLOR : fg35,
              }}
              whileHover={{
                backgroundColor: isActive ? 'rgba(19,221,209,0.09)' : bgHov,
                color: isActive ? ACCENT_COLOR : fg65,
              }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              {/* Active accent bar */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    key="bar"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r"
                    style={{ backgroundColor: ACCENT_COLOR }}
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: 1 }}
                    exit={{ scaleY: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                  />
                )}
              </AnimatePresence>
              <Icon className="w-[17px] h-[17px] flex-shrink-0" />
              <span className="text-[7px] font-semibold uppercase tracking-wide leading-none">
                {label.split(' ')[0]}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Help + theme toggle */}
      <div className="border-t border-black/8 dark:border-white/8">
        <motion.button
          onClick={toggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="!p-0 !border-0 rounded-none w-12 h-10 flex items-center justify-center"
          animate={{ color: fg35, backgroundColor: bg0 }}
          whileHover={{ color: fg65, backgroundColor: bgHov }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          {isDark ? <SunIcon className="w-[17px] h-[17px]" /> : <MoonIcon className="w-[17px] h-[17px]" />}
        </motion.button>
        <motion.button
          onClick={() => setHelpModalOpen(true)}
          title="Help"
          className="!p-0 !border-0 rounded-none w-12 h-10 flex items-center justify-center"
          animate={{ color: fg35, backgroundColor: bg0 }}
          whileHover={{ color: fg65, backgroundColor: bgHov }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <QuestionMarkCircleIcon className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}
