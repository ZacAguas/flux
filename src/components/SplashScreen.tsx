import { motion } from 'motion/react';
import { ThreadsBackground } from './ui/ThreadsBackground';
import { FileImport } from './FileImport';
import { QuestionMarkCircleIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useViewerStore } from '../store/viewerStore';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { y: 22, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 380, damping: 32 } },
};

export function SplashScreen() {
  const setHelpModalOpen = useViewerStore((state) => state.setHelpModalOpen);
  const theme = useViewerStore((state) => state.theme);
  const toggleTheme = useViewerStore((state) => state.toggleTheme);

  return (
    <div className="fixed inset-0 bg-[#e8eaed] dark:bg-[#0d0d10] flex items-center justify-center overflow-hidden">
      <ThreadsBackground />

      <motion.div
        className="relative z-10 flex flex-col items-center gap-10 w-full max-w-xl px-8 select-none"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {/* Logo */}
        <motion.img
          src="/logo.svg"
          alt=""
          draggable={false}
          className="w-32 h-32 [filter:drop-shadow(0_0_1.4rem_rgba(19,221,209,0.35))]"
          variants={{
            hidden: { scale: 0.72, opacity: 0 },
            show: {
              scale: 1,
              opacity: 1,
              transition: { type: 'spring', stiffness: 320, damping: 26 },
            },
          }}
        />

        {/* Title + sub heading */}
        <motion.div className="text-center" variants={fadeUp}>
          <h1 className="m-0 text-6xl font-light tracking-[0.35em] pl-[0.35em] bg-gradient-to-r from-[#13ddd1] to-[#0a72f5] bg-clip-text text-transparent">
            FLUX
          </h1>
          <p className="mt-3 mb-0 text-lg text-black/50 dark:text-white/50 tracking-[0.22em] uppercase">
            4D Medical Imaging Viewer
          </p>
        </motion.div>

        {/* Import zone */}
        <motion.div className="w-full" variants={fadeUp}>
          <FileImport />
        </motion.div>

        {/* Hint */}
        <motion.p className="m-0 text-sm text-black/40 dark:text-white/40 tracking-[0.08em]" variants={fadeUp}>
          Drop a NIfTI file anywhere to get started (.nii/.nii.gz)
        </motion.p>
      </motion.div>

      {/* Bottom-right buttons: theme toggle + help */}
      <motion.div
        className="absolute bottom-6 right-6 z-10 flex items-center gap-1"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.35 }}
      >
        <motion.button
          onClick={toggleTheme}
          className="p-2 text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 transition-colors"
          aria-label="Toggle theme"
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.92 }}
        >
          {theme === 'dark' ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
        </motion.button>
        <motion.button
          onClick={() => setHelpModalOpen(true)}
          className="p-2 text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 transition-colors"
          aria-label="Open help"
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.92 }}
        >
          <QuestionMarkCircleIcon className="w-6 h-6" />
        </motion.button>
      </motion.div>
    </div>
  );
}
