import { redirect } from "next/navigation";

interface ProfileScorePageProps {
  params: { identifier: string };
}

export default function ProfileScorePage({ params }: ProfileScorePageProps) {
  redirect(`/${params.identifier}/stats`);
}
