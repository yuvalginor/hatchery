// Export inside the Android app: write the backup to the app's cache, then open Android's share sheet with it,
// so it can be saved to Files or Drive or sent on. Loaded only in the app (src/data/transfer.ts).
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export async function shareFile(name: string, text: string): Promise<void> {
  const { uri } = await Filesystem.writeFile({ path: name, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 });
  try {
    await Share.share({ title: name, files: [uri] });
  } catch (error) {
    // Closing the share sheet without picking anything rejects too. That is not a failure.
    if (!/cancel/i.test(String((error as Error)?.message ?? error))) console.error('Export failed', error);
  }
}
