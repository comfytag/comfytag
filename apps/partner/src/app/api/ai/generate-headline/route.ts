import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from '@google/generative-ai'

interface RequestBody {
  title: string
  category?: string
  draftHeadline?: string
  vibe: string
}

export async function POST(req: NextRequest) {
  let body: RequestBody

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { title, category, draftHeadline, vibe } = body

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
    'You are writing a one-line hook for a Nigerian event flyer or ticket page. ' +
    'Output exactly one sentence. Max 120 characters. No punctuation at the end. ' +
    `Tone must match strictly: ${vibe.trim()}. ` +
    'HARD RULES — breaking any of these fails the task: ' +
    'One sentence only. No period, exclamation mark, or question mark at the end. ' +
    'No em dash (—). No en dash (–). No colon (:). No asterisks. No quote marks. ' +
    'Banned words — do not use any of these: elevate, experience, join us, embark, curated, vibrant, seamless, testament. ' +
    'Write like it belongs on a flyer someone would reshare on Instagram. ' +
    'If a draft headline is provided, improve it, do not ignore it. ' +
    'If event category is provided, the hook should feel relevant to that type of event.'

  const userPrompt = [
    `Event Title: ${title.trim()}`,
    category?.trim() ? `Category: ${category.trim()}` : null,
    draftHeadline?.trim() ? `Draft Headline: ${draftHeadline.trim()}` : null,
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
    const headline = result.response.text().trim()

    return NextResponse.json({ headline })
  } catch (err) {
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

    console.error('[ai/generate-headline] Gemini error:', {
      message: debugMessage,
      httpStatus,
      errorDetails,
    })

    const isDev = process.env.NODE_ENV === 'development'

    return NextResponse.json(
      {
        error: 'Failed to generate headline. Please try again.',
        ...(isDev && {
          debug: { message: debugMessage, httpStatus, errorDetails },
        }),
      },
      { status: 500 },
    )
  }
}
