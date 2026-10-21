const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export const formatDate = (iso: string) => dateFormatter.format(new Date(iso));
