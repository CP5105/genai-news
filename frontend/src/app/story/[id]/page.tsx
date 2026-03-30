import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { fetchStoryDetail } from "@/lib/news-api";
import StoryDetailContent from "@/components/story-detail-content";
import { SITE_NAME } from "@/lib/site";

type StoryDetailPageProps = {
  params: Promise<{ id: string }>;
};

const getStoryDetail = cache((id: string) => fetchStoryDetail(id));

export async function generateMetadata({
  params,
}: StoryDetailPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const story = await getStoryDetail(id);
    const description =
      story.timeline?.[0]?.summary?.[0] ??
      "Read the latest curated GenAI story coverage.";

    return {
      title: story.headline,
      description,
      alternates: {
        canonical: `/story/${id}`,
      },
      openGraph: {
        title: story.headline,
        description,
        type: "article",
      },
      twitter: {
        card: "summary",
        title: story.headline,
        description,
      },
    };
  } catch {
    return {
      title: `Story | ${SITE_NAME}`,
      description: "Read the latest curated GenAI story coverage.",
      robots: {
        index: false,
        follow: true,
      },
    };
  }
}

export default async function StoryDetailPage({
  params,
}: StoryDetailPageProps) {
  const { id } = await params;

  let story;
  try {
    story = await getStoryDetail(id);
  } catch (error) {
    if (error instanceof Error && error.message.includes("(404)")) {
      notFound();
    }
    throw error;
  }

  return (
    <div className="min-h-screen">
      <StoryDetailContent story={story} />
    </div>
  );
}
