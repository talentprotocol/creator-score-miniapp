import { redirect } from "next/navigation";
import { ExplorePageContent } from "./ExplorePageContent";

interface ExploreTabPageProps {
  params: {
    tab: string;
  };
}

// Valid tab options
const VALID_TABS = ["all", "friends", "featured"];

export default function ExploreTabPage({ params }: ExploreTabPageProps) {
  const { tab } = params;

  // Redirect invalid tabs to /explore/all
  if (!VALID_TABS.includes(tab)) {
    redirect("/explore/all");
  }

  return <ExplorePageContent activeTab={tab} />;
}

// Generate static params for valid tabs
export function generateStaticParams() {
  return VALID_TABS.map((tab) => ({
    tab,
  }));
}
