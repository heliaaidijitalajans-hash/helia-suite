export type LearnCategory = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  accent: string;
};

export type Course = {
  id: string;
  title: string;
  instructor: string;
  price: number;
  /** 0–5 */
  rating: number;
  categoryId: string;
  image: string;
  isPopular: boolean;
  isRecommended: boolean;
};

export const learnCategories: LearnCategory[] = [
  {
    id: "design",
    name: "Design",
    tagline: "Craft, systems, and visual taste",
    description: "Product UI, brand systems, and motion for modern apps.",
    image:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80",
    accent: "from-fuchsia-500/20 via-white/0 to-violet-500/15",
  },
  {
    id: "ai",
    name: "AI",
    tagline: "Models, agents, and intelligent UX",
    description: "Practical AI literacy for builders and product teams.",
    image:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80",
    accent: "from-sky-500/18 via-white/0 to-violet-500/14",
  },
  {
    id: "business",
    name: "Business",
    tagline: "Strategy, growth, and leadership",
    description: "GTM, pricing, and storytelling for ambitious teams.",
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
    accent: "from-amber-500/16 via-white/0 to-orange-500/12",
  },
];

export const courses: Course[] = [
  {
    id: "c-ui-systems",
    title: "Product UI Systems",
    instructor: "Maya Chen",
    price: 129,
    rating: 4.8,
    categoryId: "design",
    image:
      "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80",
    isPopular: true,
    isRecommended: true,
  },
  {
    id: "c-motion",
    title: "Motion for Interfaces",
    instructor: "Jordan Lee",
    price: 99,
    rating: 4.7,
    categoryId: "design",
    image:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    isPopular: true,
    isRecommended: false,
  },
  {
    id: "c-brand",
    title: "Brand Systems in Figma",
    instructor: "Sofia Alvarez",
    price: 89,
    rating: 4.6,
    categoryId: "design",
    image:
      "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80",
    isPopular: false,
    isRecommended: true,
  },
  {
    id: "c-llm-apps",
    title: "LLM Apps for Product Teams",
    instructor: "Alex Park",
    price: 149,
    rating: 4.9,
    categoryId: "ai",
    image:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80",
    isPopular: true,
    isRecommended: true,
  },
  {
    id: "c-prompt",
    title: "Prompt Engineering Studio",
    instructor: "Priya Nair",
    price: 79,
    rating: 4.5,
    categoryId: "ai",
    image:
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80",
    isPopular: true,
    isRecommended: false,
  },
  {
    id: "c-ml-ux",
    title: "Human-Centered ML UX",
    instructor: "Noah Kim",
    price: 119,
    rating: 4.7,
    categoryId: "ai",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
    isPopular: false,
    isRecommended: true,
  },
  {
    id: "c-gtm",
    title: "GTM for SaaS Launches",
    instructor: "Riley Brooks",
    price: 139,
    rating: 4.8,
    categoryId: "business",
    image:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80",
    isPopular: true,
    isRecommended: true,
  },
  {
    id: "c-pricing",
    title: "Pricing & Packaging Strategy",
    instructor: "Emma Wright",
    price: 109,
    rating: 4.6,
    categoryId: "business",
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80",
    isPopular: false,
    isRecommended: false,
  },
  {
    id: "c-story",
    title: "Founder Storytelling",
    instructor: "Marcus Cole",
    price: 69,
    rating: 4.5,
    categoryId: "business",
    image:
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80",
    isPopular: false,
    isRecommended: true,
  },
];

export function getLearnCategoryById(id: string) {
  return learnCategories.find((c) => c.id === id);
}

export function getCourseById(id: string) {
  return courses.find((c) => c.id === id);
}

export function getCoursesByCategoryId(categoryId: string) {
  return courses.filter((c) => c.categoryId === categoryId);
}
