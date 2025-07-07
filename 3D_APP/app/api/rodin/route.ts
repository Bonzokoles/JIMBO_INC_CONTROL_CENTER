import { NextResponse } from "next/server"

const API_KEY = "vibecoding" // Public API key

// Rate limiting map
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()
const RATE_LIMIT_MAX = 10 // Max requests per window
const RATE_LIMIT_WINDOW = 60000 // 1 minute window

// Retry configuration
interface RetryConfig {
  maxRetries: number
  baseDelay: number
  backoffMultiplier: number
}

async function apiWithRetry<T>(
  apiCall: () => Promise<T>,
  config: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    backoffMultiplier: 2
  }
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await apiCall()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === config.maxRetries) {
        throw lastError
      }
      
      const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

function checkRateLimit(clientIP: string): boolean {
  const now = Date.now()
  const clientData = rateLimitMap.get(clientIP)

  if (!clientData || now - clientData.lastReset > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(clientIP, { count: 1, lastReset: now })
    return true
  }

  if (clientData.count >= RATE_LIMIT_MAX) {
    return false
  }

  clientData.count++
  return true
}

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const forwarded = request.headers.get("x-forwarded-for")
    const clientIP = forwarded ? forwarded.split(",")[0] : "unknown"

    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    // Get the form data from the request
    const formData = await request.formData()

    // Sprawdź czy są parametry kolorów
    const useColors = formData.get("use_colors") === "true"
    const colorMode = formData.get("color_mode")
    const preserveColors = formData.get("preserve_colors")

    // Dodaj parametry kolorów jeśli są ustawione
    if (useColors) {
      if (colorMode) formData.append("color_mode", colorMode.toString())
      if (preserveColors) formData.append("preserve_colors", preserveColors.toString())
    }

    // Sprawdź czy jest ustawiony HighPack
    const highpack = formData.get("highpack") === "true"

    // Dodaj parametr HighPack jeśli jest ustawiony
    if (highpack) {
      formData.append("highpack", "true")
    }

    // Forward the request to the Hyper3D API with retry logic
    const data = await apiWithRetry(async () => {
      const response = await fetch("https://hyperhuman.deemos.com/api/v2/rodin", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API request failed: ${response.status} - ${errorText}`)
      }

      return await response.json()
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in Rodin API route:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
