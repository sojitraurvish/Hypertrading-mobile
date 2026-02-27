import moment from 'moment';
import { DATE_TIME_FORMAT, DateTimeFormat } from '../../constants';
import { DEFAULT_LANGUAGE } from '@/lib/config';


// 3️⃣ Function argument type
interface FormatDateTimeParams {
  timeStamp: string | number | Date | null | undefined;
  format?: DateTimeFormat;
  locale?: string;
}

// 4️⃣ Function implementation
export const formatDateTimeAccordingToFormat = ({
  timeStamp,
  format = DATE_TIME_FORMAT.DD_MMM,
  locale =  DEFAULT_LANGUAGE,
}: FormatDateTimeParams): string => {
  if (!timeStamp) return '-';

  const originalLocale: string = moment.locale();
  moment.locale(locale);

  const formattedDate: string = moment(timeStamp).format(format);

  moment.locale(originalLocale);

  return formattedDate;
};

// Format countdown from milliseconds to HH:MM:SS format
export const formatCountdown = (ms: number): string => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = Math.floor(s / 3600).toString().padStart(2, "0");
  const mm = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
};
