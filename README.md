<div align="center">
  <img src="https://github.com/user-attachments/assets/4c0f39d6-f4da-4404-a819-1b2c0984ce37" alt="Flux Logo" width="150" />
  <h1>Flux</h1>
  <p><strong>4D</strong> medical imaging viewer powered by <strong>WebGPU</strong></p>
</div>

![Version](https://img.shields.io/badge/version-0.1.0-blue?style=for-the-badge)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![WebGPU](https://img.shields.io/badge/renderer-WebGPU-%23FF6D00?style=for-the-badge&logo=googlechrome&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-%2322c55e?style=for-the-badge)

A privacy-first, browser-based 4D medical imaging viewer powered by WebGPU for instant, zero-installation NIfTI visualization.

[Live Demo](#live-demo) &nbsp;|&nbsp; [Screenshots](#screenshots) &nbsp;|&nbsp; [Features](#features) &nbsp;|&nbsp; [Requirements](#requirements) &nbsp;|&nbsp; [Getting Started](#getting-started) &nbsp;|&nbsp; [Disclaimer](#disclaimer)

## Live Demo

<p align="center">
  <a href="https://flux-gilt-ten.vercel.app" target="_blank"><strong>🔗 Launch the Live Viewer</strong></a>
  <br />
  <img width="800" height="538" alt="Flux Live Demo" src="https://github.com/user-attachments/assets/b0e0293f-cf60-418d-aff0-edb31a8a87fe" />
</p>

## Screenshots

<table>
  <tr>
    <td align="center"><b>Quad Layout</b></td>
    <td align="center"><b>TIC Analysis</b></td>
  </tr>
  <tr>
    <td><img width="2049" height="1378" alt="CleanShot 2026-05-29 at 17 12 22" src="https://github.com/user-attachments/assets/c9bca3f9-7aeb-4f93-8005-3b30d9921989" /></td>
    <td><img width="1232" height="985" alt="CleanShot 2026-05-30 at 22 12 17" src="https://github.com/user-attachments/assets/d2bbbd19-1685-4fe7-a6c4-abb7e0d7b060" /></td>
  </tr>
  <tr>
    <td align="center"><b>Slice Views</b></td>
    <td align="center"><b>Crop Box</b></td>
  </tr>
  <tr>
    <td><img width="1972" height="1374" alt="CleanShot 2026-05-30 at 21 44 16" src="https://github.com/user-attachments/assets/d88ead70-65e1-4205-b921-31450a30c989" /></td>
    <td><img width="2049" height="1378" alt="CleanShot 2026-05-29 at 17 19 14" src="https://github.com/user-attachments/assets/3243ef2a-d340-4051-8f9d-3b880d63fddb" /></td>
  </tr>
</table>

## Features

- **WebGPU volume rendering**: real-time raymarching with front-to-back compositing, early ray termination, and optional Blinn-Phong shading
- **NIfTI support**: drag-and-drop `.nii` / `.nii.gz` with SHA-256 integrity validation across sessions
- **2D slice viewers**: axial, coronal, and sagittal planes with window/level controls and synchronized crosshairs
- **Transfer function editor**: interactive RGBA control points with built-in presets
- **4D temporal navigation**: time slider, playback controls
- **Time-intensity curves (TIC)**: place circular ROIs on any slice to extract and chart signal intensity over time
- **Measurement tools**: distance (in mm using voxel spacing) and angle measurements
- **Volume clipping**: interactive 3D crop box
- **Session persistence**: IndexedDB-backed save and restore with auto-save, persistent file handles, and thumbnail previews
- **Responsive multi-layout**: single volume, three-slice, or quad (volume + all three planes); light/dark theme

## Requirements

- A browser with [WebGPU support](https://caniuse.com/webgpu) (Chrome 113+, Edge 113+)
- Node.js 18+
- pnpm

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Disclaimer

Flux is a research and visualization tool, not a medical device. It is not intended for clinical diagnosis.

## License

[MIT](LICENSE)

If you use Flux in your work, please link back to this repository.
