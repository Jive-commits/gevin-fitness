import { PageHeader } from '@/components/page-header';
import { LibraryView } from '@/components/library/library-view';
import { getAllExercises } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function LibraryPage() {
  const exercises = await getAllExercises();
  return (
    <>
      <PageHeader title="Library" eyebrow={`${exercises.length} exercises`} />
      <LibraryView exercises={exercises} />
    </>
  );
}
