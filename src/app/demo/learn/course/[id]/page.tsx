import { CourseDetailView } from "@/components/learn/CourseDetailView";
import { getCourseById } from "@/data/learn-courses";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const course = getCourseById(id);
  return {
    title: course?.title ?? "Course",
    description: course
      ? `${course.title} — Helia Learn demo course.`
      : "Course on Helia Learn.",
  };
}

export default async function DemoLearnCoursePage({ params }: Props) {
  const { id } = await params;
  return <CourseDetailView courseId={id} />;
}
