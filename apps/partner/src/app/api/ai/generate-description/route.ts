import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from '@google/generative-ai'

interface RequestBody {
  title: string
  draftDescription?: string
  vibe: string
  extraDetails?: string
}

export async function POST(req: NextRequest) {
  let body: RequestBody

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { title, draftDescription, vibe, extraDetails } = body

  if (!title?.trim() || !vibe?.trim()) {
    return NextResponse.json(
      { error: 'title and vibe are required.' },
      { status: 400 },
    )
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI service is not configured.' },
      { status: 500 },
    )
  }

  const systemInstruction =
    'You are a human event promoter. Write punchy, natural, conversational copy. ' +
    `The tone/vibe should strictly match: ${vibe.trim()}. ` +
    'CRITICAL: Do NOT sound robotic. ' +
    'Completely ban words like: elevate, unleash, embark, delve, unlock, seamless, testament, realm. ' +
    'Do NOT use em dashes (—), en dashes (–), asterisks, markdown formatting, or excessive special characters. ' +
    'Use standard, casual punctuation like you are typing on a phone. ' +
    'Keep it under 3 short paragraphs. ' +
    'Use the draft description as a foundation if provided.'

  const userPrompt = [
    `Event Title: ${title.trim()}`,
    draftDescription?.trim() ? `Draft Description: ${draftDescription.trim()}` : null,
    extraDetails?.trim() ? `Extra Details: ${extraDetails.trim()}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      systemInstruction,
    })

    const result = await model.generateContent(userPrompt)
    const description = result.response.text().trim()

    return NextResponse.json({ description })
  } catch (err) {
    // Extract rich error info from the SDK's typed error
    let debugMessage = 'Unknown error'
    let httpStatus: number | undefined
    let errorDetails: unknown

    if (err instanceof GoogleGenerativeAIFetchError) {
      debugMessage = err.message
      httpStatus = err.status
      errorDetails = err.errorDetails
    } else if (err instanceof Error) {
      debugMessage = err.message
    }

    console.error('[ai/generate-description] Gemini error:', {
      message: debugMessage,
      httpStatus,
      errorDetails,
    })

    // Surface debug info in development so you can diagnose without checking server logs
    const isDev = process.env.NODE_ENV === 'development'

    return NextResponse.json(
      {
        error: 'Failed to generate description. Please try again.',
        ...(isDev && {
          debug: { message: debugMessage, httpStatus, errorDetails },
        }),
      },
      { status: 500 },
    )
  }
}
