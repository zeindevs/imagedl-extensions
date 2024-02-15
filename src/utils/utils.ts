export const unique = (values: any): Array<any> => [...new Set(values)]

export const removeSpecialCharacters = (value: string) => value.replace(/[<>:"|?*]/g, '')

export const cn = (...classNames: Array<any>): string => classNames.filter(Boolean).join(' ')

export const normalizeSlashes = (filename: string) => filename.replace(/\\/g, '/').replace(/\/{2,}/g, '/')
