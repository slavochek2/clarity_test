import { NextRequest, NextResponse } from 'next/server';
import { generatePersonaOptions } from '@/lib/ai/evaluationPipeline';

const logger = {
  info: (message: string, data?: any) => {
    console.log(`[API /api/ai/personas INFO] ${new Date().toISOString()} - ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[API /api/ai/personas ERROR] ${new Date().toISOString()} - ${message}`, error || '');
  },
};

export async function POST(request: NextRequest) {
  try {
    logger.info('Received persona generation request');
    
    const body = await request.json();
    const { topics, userProfile } = body;

    logger.info('Generating personas', {
      topics: topics || [],
      userProfile: userProfile || {},
    });

    const personas = generatePersonaOptions(
      topics || [],
      userProfile || {}
    );

    logger.info('Personas generated', {
      count: personas.length,
      personaIds: personas.map(p => p.id),
    });

    return NextResponse.json({
      personas,
    });
  } catch (error) {
    logger.error('Error generating personas', error);
    return NextResponse.json(
      {
        error: 'Failed to generate personas',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    logger.info('Received GET request for personas');
    
    // Generate default personas
    const personas = generatePersonaOptions([], {});

    logger.info('Default personas returned', {
      count: personas.length,
    });

    return NextResponse.json({
      personas,
    });
  } catch (error) {
    logger.error('Error getting personas', error);
    return NextResponse.json(
      {
        error: 'Failed to get personas',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

