import axios from "axios";
import i18n from "i18next";

export interface ApiError {
  message: string
  code?: string
  statusCode?: number
  originalError?: Error
}

export class ConfigLoadError extends Error {
  code: 'INVALID_URL' | 'STORAGE_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR'
  originalError?: Error

  constructor(message: string, code: ConfigLoadError['code'] = 'UNKNOWN_ERROR', originalError?: Error) {
    super(message)
    this.name = 'ConfigLoadError'
    this.code = code
    this.originalError = originalError
  }
}

function translateErrCode(code?: string): string | undefined {
  if (!code) return undefined
  const out = i18n.t(`errors:${code}`)
  if (out && out !== `errors:${code}`) return out
  return undefined
}

export function getStoragesApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; err_code?: string; errCode?: string } | undefined
    const translated = translateErrCode(data?.err_code || data?.errCode)
    if (translated) return translated
    if (data?.message) return data.message
    if (error.message) return error.message
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export const parseApiError = async (response: Response): Promise<string> => {
  try {
    const errorData = await response.clone().json() as { message?: string; err_code?: string; errCode?: string }
    const code = errorData.err_code || errorData.errCode
    return translateErrCode(code) || errorData.message || code || JSON.stringify(errorData) || response.statusText
  } catch {
    try {
      const text = await response.clone().text()
      if (text) {
        if (text.trim().startsWith('<')) {
          const match = text.match(/<Message>(.*?)<\/Message>/i) || text.match(/<Error>(.*?)<\/Error>/i)
          return match?.[1] ?? text
        }
        return text
      }
    } catch {
      // keep statusText
    }
  }
  return response.statusText
}

export const handleConfigError = (error: unknown, context: string): ConfigLoadError => {
  if (error instanceof ConfigLoadError) {
    return error
  }

  if (error instanceof Error) {
    if (error.message.includes('Invalid URL')) {
      return new ConfigLoadError(`Invalid URL in ${context}: ${error.message}`, 'INVALID_URL', error)
    }
    if (error.message.includes('localStorage') || error.message.includes('storage')) {
      return new ConfigLoadError(`Storage error in ${context}: ${error.message}`, 'STORAGE_ERROR', error)
    }
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return new ConfigLoadError(`Network error in ${context}: ${error.message}`, 'NETWORK_ERROR', error)
    }
  }

  return new ConfigLoadError(
    `Unknown error in ${context}: ${error}`,
    'UNKNOWN_ERROR',
    error instanceof Error ? error : new Error(String(error))
  )
}
