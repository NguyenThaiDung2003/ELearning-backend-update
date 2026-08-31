import { autoSubmitExpired } from "../services/grading.service";

const DEFAULT_INTERVAL_MS = 30 * 1000;

/**
 * Sinh vien co the dong tab giua chung, nen server tu chot bai het gio thay vi
 * cho client goi submit.
 */
export const startAutoSubmitJob = (intervalMs = DEFAULT_INTERVAL_MS) => {
  const tick = async () => {
    try {
      const count = await autoSubmitExpired();
      if (count > 0) {
        console.log(`Auto-submitted ${count} expired submission(s)`);
      }
    } catch (error) {
      console.error("Auto-submit job failed", error);
    }
  };

  const timer = setInterval(() => {
    void tick();
  }, intervalMs);

  timer.unref();

  return () => clearInterval(timer);
};
