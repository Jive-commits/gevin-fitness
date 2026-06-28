import { PageHeader } from '@/components/page-header';
import { ProgramView } from '@/components/program/program-view';
import { getProgram, getProgramDays, getAllExercises } from '@/lib/queries';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function ProgramPage() {
  const [program, blocks, allExercises, settings] = await Promise.all([
    getProgram(),
    getProgramDays(),
    getAllExercises(),
    getSettings(),
  ]);

  return (
    <>
      <PageHeader title="Program" eyebrow="Both training blocks" />
      {program ? (
        <ProgramView
          blocks={blocks}
          allExercises={allExercises}
          settings={{
            availableEquipment: settings.availableEquipment,
            backSafeOnly: settings.backSafeOnly,
            myEquipmentOnly: settings.myEquipmentOnly,
          }}
          programName={program.name}
          programAuthor={program.author}
          programDescription={program.description}
        />
      ) : (
        <div className="px-6 py-20 text-center text-text-dim">No program seeded yet.</div>
      )}
    </>
  );
}
