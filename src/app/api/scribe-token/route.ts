import { NextResponse } from 'next/server'

/**
 * Generate ElevenLabs single-use token for Scribe real-time transcription
 */
export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY

  if (!apiKey || apiKey === 'your_api_key_here') {
    console.error('ELEVENLABS_API_KEY not configured')
    return NextResponse.json(
      {
        error: 'ELEVENLABS_API_KEY not configured',
        message: 'Please set ELEVENLABS_API_KEY in .env.local'
      },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(
      'https://api.elevenlabs.io/v1/single-use-token/realtime_scribe',
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      let errorData: Record<string, unknown> = {}
      try {
        const text = await response.text()
        errorData = text ? JSON.parse(text) : {}
      } catch {
        errorData = { message: 'Failed to parse error response' }
      }

      console.error('ElevenLabs API error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
      })

      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          {
            error: 'Authentication failed',
            message: 'Invalid API key or missing permissions for Scribe',
            details: errorData,
          },
          { status: response.status }
        )
      }

      return NextResponse.json(
        {
          error: 'Failed to get token',
          message: (errorData.message as string) || 'Unknown error',
          details: errorData,
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (!data.token) {
      console.error('No token in response:', data)
      return NextResponse.json(
        { error: 'Invalid response format, no token found' },
        { status: 500 }
      )
    }

    return NextResponse.json({ token: data.token })
  } catch (error) {
    console.error('Error getting token:', error)
    return NextResponse.json(
      {
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
