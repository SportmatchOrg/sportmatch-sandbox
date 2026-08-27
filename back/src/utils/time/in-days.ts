export const inDays = (days: number, hour: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);

  return date;
};
