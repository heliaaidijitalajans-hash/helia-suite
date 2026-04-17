export type HealthCategory = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  accent: string;
};

export type Workout = {
  id: string;
  title: string;
  durationMin: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  caloriesKcal: number;
  categoryId: string;
  image: string;
  isRecommended: boolean;
  isTodaysPlan: boolean;
};

export const healthCategories: HealthCategory[] = [
  {
    id: "strength",
    name: "Strength",
    tagline: "Build power and lean muscle",
    description: "Progressive overload, tempo, and form-first programming.",
    image:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80",
    accent: "from-emerald-500/16 via-white/0 to-violet-500/10",
  },
  {
    id: "cardio",
    name: "Cardio",
    tagline: "Endurance, intervals, and conditioning",
    description: "Heart-rate-friendly workouts you can repeat weekly.",
    image:
      "https://images.unsplash.com/photo-1554284126-aa88f22d8b74?auto=format&fit=crop&w=800&q=80",
    accent: "from-sky-500/14 via-white/0 to-cyan-500/10",
  },
  {
    id: "yoga",
    name: "Yoga",
    tagline: "Mobility and recovery",
    description: "Breath-led flows and strength through range of motion.",
    image:
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80",
    accent: "from-fuchsia-500/14 via-white/0 to-violet-500/10",
  },
  {
    id: "fatloss",
    name: "Fat Loss",
    tagline: "Efficient sessions, high output",
    description: "Metabolic circuits designed for consistency and recovery.",
    image:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
    accent: "from-amber-500/14 via-white/0 to-orange-500/10",
  },
];

export const workouts: Workout[] = [
  {
    id: "w-fullbody-burn",
    title: "Full Body Burn",
    durationMin: 20,
    difficulty: "Beginner",
    caloriesKcal: 180,
    categoryId: "fatloss",
    image:
      "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=800&q=80",
    isRecommended: true,
    isTodaysPlan: true,
  },
  {
    id: "w-strength-foundations",
    title: "Strength Foundations",
    durationMin: 30,
    difficulty: "Beginner",
    caloriesKcal: 220,
    categoryId: "strength",
    image:
      "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=800&q=80",
    isRecommended: false,
    isTodaysPlan: true,
  },
  {
    id: "w-cardio-intervals",
    title: "Cardio Intervals",
    durationMin: 24,
    difficulty: "Intermediate",
    caloriesKcal: 260,
    categoryId: "cardio",
    image:
      "https://images.unsplash.com/photo-1526401485004-2aa7f3c99a00?auto=format&fit=crop&w=800&q=80",
    isRecommended: true,
    isTodaysPlan: false,
  },
  {
    id: "w-yoga-reset",
    title: "Yoga Reset Flow",
    durationMin: 18,
    difficulty: "Beginner",
    caloriesKcal: 90,
    categoryId: "yoga",
    image:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
    isRecommended: true,
    isTodaysPlan: false,
  },
  {
    id: "w-hamstrings-core",
    title: "Hamstrings + Core",
    durationMin: 22,
    difficulty: "Intermediate",
    caloriesKcal: 170,
    categoryId: "strength",
    image:
      "https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=800&q=80",
    isRecommended: false,
    isTodaysPlan: false,
  },
  {
    id: "w-lowimpact-hiit",
    title: "Low-Impact HIIT",
    durationMin: 16,
    difficulty: "Beginner",
    caloriesKcal: 150,
    categoryId: "fatloss",
    image:
      "https://images.unsplash.com/photo-1518611012118-f0c5f1cdb1c6?auto=format&fit=crop&w=800&q=80",
    isRecommended: true,
    isTodaysPlan: false,
  },
  {
    id: "w-zone2",
    title: "Zone 2 Endurance",
    durationMin: 35,
    difficulty: "Intermediate",
    caloriesKcal: 320,
    categoryId: "cardio",
    image:
      "https://images.unsplash.com/photo-1546484959-f7ad3f9c5d63?auto=format&fit=crop&w=800&q=80",
    isRecommended: false,
    isTodaysPlan: false,
  },
  {
    id: "w-mobility",
    title: "Mobility & Recovery",
    durationMin: 12,
    difficulty: "Beginner",
    caloriesKcal: 60,
    categoryId: "yoga",
    image:
      "https://images.unsplash.com/photo-1599447421416-3414985a6928?auto=format&fit=crop&w=800&q=80",
    isRecommended: true,
    isTodaysPlan: false,
  },
];

export function getWorkoutById(id: string) {
  return workouts.find((w) => w.id === id);
}

export function getHealthCategoryById(id: string) {
  return healthCategories.find((c) => c.id === id);
}

export function getWorkoutsByCategoryId(categoryId: string) {
  return workouts.filter((w) => w.categoryId === categoryId);
}

