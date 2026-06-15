import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

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
    'You are an expert event copywriter and promoter. ' +
    'Write a highly engaging, high-converting event description based on the provided details. ' +
    `The tone/vibe should strictly match: ${vibe.trim()}. ` +
    'Keep it concise (max 2-3 short paragraphs). ' +
    'Make it exciting but professional. ' +
    'Do not use overly cheesy emojis. ' +
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
      model: 'gemini-1.5-flash',
      systemInstruction,
    })

    const result = await model.generateContent(userPrompt)
    const description = result.response.text().trim()

    return NextResponse.json({ description })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[ai/generate-description] Gemini error:', message)
    return NextResponse.json(
      { error: 'Failed to generate description. Please try again.' },
      { status: 500 },
    )
  }
}
