export const ms = {
  seconds: (n: number): number => n * 1000,
  minutes: (n: number): number => n * 60 * 1000,
  hours:   (n: number): number => n * 60 * 60 * 1000,
  days:    (n: number): number => n * 24 * 60 * 60 * 1000,
};
