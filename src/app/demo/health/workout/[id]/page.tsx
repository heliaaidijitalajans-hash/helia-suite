import { WorkoutDetailView } from "@/components/health/WorkoutDetailView";
import { getWorkoutById } from "@/data/health-workouts";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const workout = getWorkoutById(id);
  return {
    title: workout?.title ?? "Workout",
    description: workout
      ? `${workout.title} — Helia Health demo workout.`
      : "Workout on Helia Health.",
  };
}

export default async function DemoHealthWorkoutPage({ params }: Props) {
  const { id } = await params;
  return <WorkoutDetailView workoutId={id} />;
}

