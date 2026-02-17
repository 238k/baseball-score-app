import type { Metadata } from 'next';
import { ScoreInputPage } from '@/components/score-input/ScoreInputPage';

export const metadata: Metadata = {
  title: 'スコア入力 | 野球スコアブック',
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ScorePage({ params }: Props) {
  const { id } = await params;
  return <ScoreInputPage gameId={id} />;
}
