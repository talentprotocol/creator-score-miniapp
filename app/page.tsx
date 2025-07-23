import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/app-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const pageMetadata = getPageMetadata();

  return {
    title: pageMetadata.title,
    description: pageMetadata.description,
    openGraph: {
      title: pageMetadata.ogTitle,
      description: pageMetadata.ogDescription,
      images: [pageMetadata.ogImage],
      type: "website",
      url: "https://www.creatorscore.app",
    },
    twitter: {
      card: "summary_large_image",
      title: pageMetadata.title,
      description: pageMetadata.description,
      images: [pageMetadata.ogImage],
    },
    icons: {
      icon: "/favicon-64.png",
      shortcut: "/favicon-64.png",
      apple: "/favicon-64.png",
    },
  };
}

export default function Home() {
  redirect("/leaderboard");
}
