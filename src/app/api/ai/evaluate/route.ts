import { NextRequest, NextResponse } from 'next/server';
import { evaluateResponse, metricsToTips, metricsToScore } from '@/lib/ai/evaluationPipeline';

const logger = {
  info: (message: string, data?: any) => {
    console.log(`[API /api/ai/evaluate INFO] ${new Date().toISOString()} - ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[API /api/ai/evaluate ERROR] ${new Date().toISOString()} - ${message}`, error || '');
  },
};

export async function POST(request: NextRequest) {
  try {
    logger.info('Received evaluation request');
    
    const body = await request.json();
    const { agentMessage, userResponse } = body;

    if (!agentMessage || !userResponse) {
      logger.error('Missing required fields', { agentMessage: !!agentMessage, userResponse: !!userResponse });
      return NextResponse.json(
        { error: 'Missing required fields: agentMessage and userResponse' },
        { status: 400 }
      );
    }

    logger.info('Evaluating response', {
      agentMessageLength: agentMessage.length,
      userResponseLength: userResponse.length,
    });

    // Evaluate the response
    const metrics = evaluateResponse(agentMessage, userResponse);
    const tips = metricsToTips(metrics);
    const score = metricsToScore(metrics);

    logger.info('Evaluation complete', {
      score,
      metrics,
      tipsCount: tips.length,
    });

    return NextResponse.json({
      metrics,
      tips,
      score,
    });
  } catch (error) {
    logger.error('Error evaluating response', error);
    return NextResponse.json(
      {
        error: 'Failed to evaluate response',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

