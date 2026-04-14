import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";
import { shell } from "electron";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);

export const IS_MAC = process.platform === "darwin";
export const IS_WIN = process.platform === "win32";

export function captureFrontmostApp(): string | null {
  try {
    if (IS_MAC) {
      const stdout = execFileSync(
        "osascript",
        [
          "-e",
          'tell application "System Events" to get name of first application process whose frontmost is true',
        ],
        { encoding: "utf8", timeout: 1000 }
      );
      const name = stdout.trim();
      if (name && name !== "SpeakNote" && name !== "Electron") return name;
      return null;
    }
    if (IS_WIN) {
      const script =
        "Add-Type @'\nusing System;\nusing System.Runtime.InteropServices;\nusing System.Text;\npublic class W {\n  [DllImport(\"user32.dll\")] public static extern IntPtr GetForegroundWindow();\n  [DllImport(\"user32.dll\")] public static extern int GetWindowTextLength(IntPtr h);\n  [DllImport(\"user32.dll\", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int c);\n  public static string T() { IntPtr h = GetForegroundWindow(); int l = GetWindowTextLength(h); var b = new StringBuilder(l+1); GetWindowText(h, b, b.Capacity); return b.ToString(); }\n}\n'@;\n[W]::T()";
      const stdout = execFileSync(
        "powershell.exe",
        ["-NoProfile", "-Command", script],
        { encoding: "utf8", timeout: 2500 }
      );
      const title = stdout.trim();
      if (title && !title.includes("SpeakNote")) return title;
      return null;
    }
  } catch {
    return null;
  }
  return null;
}

export async function pasteToApp(target: string): Promise<void> {
  if (IS_MAC) {
    await execFileAsync("osascript", [
      "-e",
      `tell application "${target}" to activate`,
      "-e",
      "delay 0.15",
      "-e",
      'tell application "System Events" to keystroke "v" using command down',
    ]);
    return;
  }
  if (IS_WIN) {
    const escaped = target.replace(/'/g, "''");
    const script = `Add-Type -AssemblyName System.Windows.Forms; $w = New-Object -ComObject WScript.Shell; $w.AppActivate('${escaped}') | Out-Null; Start-Sleep -Milliseconds 150; [System.Windows.Forms.SendKeys]::SendWait('^v')`;
    await execFileAsync("powershell.exe", ["-NoProfile", "-Command", script]);
    return;
  }
}

export async function saveToNotes(text: string): Promise<void> {
  if (IS_MAC) {
    const escaped = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const script = `tell application "Notes" to make new note with properties {body:"${escaped}"}`;
    await execFileAsync("osascript", ["-e", script]);
    return;
  }
  if (IS_WIN) {
    // Windows には Apple Notes 相当が無いため、.txt をメモ帳で開く
    const file = path.join(os.tmpdir(), `speaknote-${Date.now()}.txt`);
    await fs.writeFile(file, text, "utf8");
    await shell.openPath(file);
    return;
  }
}
