import { ThreadsBackground } from './ui/ThreadsBackground';
import { FileImport } from './FileImport';

export function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-[#0d0d10] flex items-center justify-center overflow-hidden">
      <ThreadsBackground />

      <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-xl px-8 select-none">
        {/* Logo */}
        <img
          src="/logo.svg"
          alt=""
          draggable={false}
          className="w-32 h-32 [filter:drop-shadow(0_0_1.4rem_rgba(19,221,209,0.35))]"
        />

        {/* Title + sub heading */}
        <div className="text-center">
          <h1 className="m-0 text-6xl font-light tracking-[0.35em] pl-[0.35em] bg-gradient-to-r from-[#13ddd1] to-[#0a72f5] bg-clip-text text-transparent">
            FLUX
          </h1>
          <p className="mt-3 mb-0 text-lg text-white/50 tracking-[0.22em] uppercase">
            4D Medical Imaging Viewer
          </p>
        </div>

        {/* Import zone */}
        <div className="w-full">
          <FileImport />
        </div>

        {/* Hint */}
        <p className="m-0 text-sm text-white/40 tracking-[0.08em]">
          Drop a NIfTI file anywhere to get started (.nii/.nii.gz)
        </p>
      </div>
    </div>
  );
}
