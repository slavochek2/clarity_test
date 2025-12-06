import { NextRequest, NextResponse } from 'next/server';
import { summarizeScore } from '@/lib/ai/evaluationPipeline';
import type { EvaluationMetrics } from '@/lib/ai/evaluationPipeline';

const logger = {
  info: (message: string, data?: any) => {
    console.log(`[API /api/ai/summarize INFO] ${new Date().toISOString()} - ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[API /api/ai/summarize ERROR] ${new Date().toISOString()} - ${message}`, error || '');
  },
};

export async function POST(request: NextRequest) {
  try {
    logger.info('Received summarize request');
    
    const body = await request.json();
    const { metricsHistory } = body;

    if (!metricsHistory || !Array.isArray(metricsHistory)) {
      logger.error('Missing or invalid metricsHistory', { metricsHistory });
      return NextResponse.json(
        { error: 'Missing required field: metricsHistory (array)' },
        { status: 400 }
      );
    }

    logger.info('Summarizing scores', {
      metricsCount: metricsHistory.length,
    });

    const summary = summarizeScore(metricsHistory as EvaluationMetrics[]);

    logger.info('Summary complete', {
      summaryScore: summary.summary_score,
      dominantTraits: summary.dominant_traits,
    });

    return NextResponse.json({
      summary,
    });
  } catch (error) {
    logger.error('Error summarizing scores', error);
    return NextResponse.json(
      {
        error: 'Failed to summarize scores',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

