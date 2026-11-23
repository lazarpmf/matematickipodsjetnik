import type { Lesson } from '@/lib/types';
import { getLessons } from './actions/lessons';
import HomeClient from './HomeClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function Home() {
  let initialLessons: Lesson[] = [];

  try {
    initialLessons = await getLessons();
  } catch (error) {
    console.error('Failed to load lessons on server:', error);
  }

  return <HomeClient initialLessons={initialLessons} />;
}
