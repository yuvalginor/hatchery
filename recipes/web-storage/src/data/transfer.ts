// Export and import of AppData as a file. Browser storage is per device and can be evicted,
// so the file is the backup and the way to move data between devices.
import { migrate, type AppData } from './schema';

export const serialize = (data: AppData): string => `${JSON.stringify(data, null, 2)}\n`;

export const parse = (text: string): AppData => migrate(JSON.parse(text));

export function exportFileName(appName: string, now = new Date()): string {
  return `${appName}-${now.toISOString().slice(0, 10)}.json`;
}

export function download(data: AppData, appName: string): void {
  const url = URL.createObjectURL(new Blob([serialize(data)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = exportFileName(appName);
  link.click();
  URL.revokeObjectURL(url);
}
