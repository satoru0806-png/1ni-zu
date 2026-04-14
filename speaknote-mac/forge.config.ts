import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";
import path from "node:path";
import fs from "fs-extra";

const config: ForgeConfig = {
  packagerConfig: {
    asar: false,
    name: "SpeakNote",
    appBundleId: "com.nizu.speaknote",
    darwinDarkModeSupport: true,
    extendInfo: {
      NSMicrophoneUsageDescription:
        "SpeakNoteは音声をテキストに変換するためにマイクを使用します。",
      NSSpeechRecognitionUsageDescription:
        "SpeakNoteは日本語音声認識のために音声データを使用します。",
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerZIP({}, ["darwin"]),
    new MakerSquirrel({
      name: "SpeakNote",
      setupExe: "SpeakNote-Setup.exe",
    }, ["win32"]),
    new MakerZIP({}, ["win32"]),
  ],
  hooks: {
    packageAfterCopy: async (_config, buildPath) => {
      // Copy uiohook-napi native module into the packaged app
      const srcBase = path.resolve(__dirname, "node_modules");
      const destBase = path.join(buildPath, "node_modules");

      for (const mod of ["uiohook-napi", "node-gyp-build"]) {
        const src = path.join(srcBase, mod);
        const dest = path.join(destBase, mod);
        if (fs.existsSync(src)) {
          await fs.copy(src, dest);
        }
      }
    },
  },
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: "src/main/main.ts",
          config: "vite.main.config.ts",
          target: "main",
        },
        {
          entry: "src/main/preload.ts",
          config: "vite.preload.config.ts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.ts",
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: false,
      [FuseV1Options.OnlyLoadAppFromAsar]: false,
    }),
  ],
};

export default config;
