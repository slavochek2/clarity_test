import { NextRequest, NextResponse } from 'next/server';
import { generateNextQuestion, refinePersona } from '@/lib/ai/evaluationPipeline';
import type { Persona, DialogueMessage } from '@/lib/ai/evaluationPipeline';

const logger = {
  info: (message: string, data?: any) => {
    console.log(`[API /api/ai/generate-question INFO] ${new Date().toISOString()} - ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[API /api/ai/generate-question ERROR] ${new Date().toISOString()} - ${message}`, error || '');
  },
};

export async function POST(request: NextRequest) {
  try {
    logger.info('Received generate question request');
    
    const body = await request.json();
    const { persona, dialogueHistory, score } = body;

    if (!persona) {
      logger.error('Missing required field: persona');
      return NextResponse.json(
        { error: 'Missing required field: persona' },
        { status: 400 }
      );
    }

    logger.info('Generating question', {
      personaId: persona.id,
      dialogueHistoryLength: dialogueHistory?.length || 0,
      score: score || 0,
    });

    // Refine persona if needed
    const refinedPrompt = refinePersona(persona as Persona);
    
    // Generate next question
    const nextQuestion = generateNextQuestion(
      refinedPrompt,
      (dialogueHistory || []) as DialogueMessage[],
      score || 0
    );

    logger.info('Question generated', {
      questionLength: nextQuestion.length,
    });

    return NextResponse.json({
      question: nextQuestion,
      refinedPrompt,
    });
  } catch (error) {
    logger.error('Error generating question', error);
    return NextResponse.json(
      {
        error: 'Failed to generate question',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

