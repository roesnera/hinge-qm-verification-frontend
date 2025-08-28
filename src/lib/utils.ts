import { clsx, type ClassValue } from "clsx"
import { format as formatNaive, type DateArg, type FormatOptions } from "date-fns";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const dateValidator = (arg: any): arg is DateArg<Date> => {
  return !!(new Date(arg)).getDate()
}

/**
 * Wrapper around date-fns `format` to add some default behavior in the case of invalid args
 */
export const format = (arg: DateArg<Date> & {}, formatStr: string, options?: FormatOptions): string => {
  if (!dateValidator(arg)) return `INVALID DATE: '${arg}'`
  else return formatNaive(arg, formatStr, options)
}
