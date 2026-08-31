import { AssignmentStatus } from "@prisma/client";

export interface AssignmentTiming {
  status: AssignmentStatus;
  openAt: Date | null;
  closeAt: Date | null;
  durationMinutes: number | null;
}

/**
 * Trang thai luu trong DB chi la y dinh cua giang vien; openAt/closeAt moi
 * quyet dinh bai co thuc su nhan bai lam tai thoi diem hien tai hay khong.
 */
export const resolveAssignmentState = (assignment: AssignmentTiming, now = new Date()) => {
  const isClosedByTime = assignment.closeAt !== null && now > assignment.closeAt;
  const isPending = assignment.openAt !== null && now < assignment.openAt;

  const effectiveStatus =
    assignment.status === AssignmentStatus.OPEN && isClosedByTime
      ? AssignmentStatus.CLOSED
      : assignment.status;

  return {
    effectiveStatus,
    isOpenNow: assignment.status === AssignmentStatus.OPEN && !isClosedByTime && !isPending,
    isPending: assignment.status === AssignmentStatus.OPEN && isPending,
  };
};

/**
 * Han nop cua mot luot lam bai: som nhat giua "het gio lam bai" va "dong bai".
 * Tra ve null khi khong gioi han (bai thuc hanh khong dat thoi luong).
 */
export const resolveExpiresAt = (
  assignment: Pick<AssignmentTiming, "closeAt" | "durationMinutes">,
  startedAt: Date,
) => {
  const byDuration = assignment.durationMinutes
    ? new Date(startedAt.getTime() + assignment.durationMinutes * 60 * 1000)
    : null;

  if (byDuration && assignment.closeAt) {
    return byDuration < assignment.closeAt ? byDuration : assignment.closeAt;
  }

  return byDuration ?? assignment.closeAt ?? null;
};
