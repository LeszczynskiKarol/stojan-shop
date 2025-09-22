// frontend/src/utils/format.ts
export const formatDuration = (duration: any): string => {
  if (!duration) return "0s";

  let seconds = 0;

  if (typeof duration === "number") {
    seconds = duration;
  } else if (typeof duration === "string") {
    seconds = parseInt(duration);
  } else if (typeof duration === "object" && duration.seconds) {
    seconds = duration.seconds;
  }

  if (isNaN(seconds)) return "0s";

  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
};
