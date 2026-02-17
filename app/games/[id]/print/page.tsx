import type { Metadata } from 'next';
import { PrintView } from '@/components/print/PrintView';

export const metadata: Metadata = {
  title: '印刷 | 野球スコアブック',
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PrintPage({ params }: Props) {
  const { id } = await params;
  return <PrintView gameId={id} />;
}
