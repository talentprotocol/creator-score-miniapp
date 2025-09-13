import { redirect } from "next/navigation";

interface ProfilePostsPageProps {
  params: { identifier: string };
}

export default function ProfilePostsPage({ params }: ProfilePostsPageProps) {
  redirect(`/${params.identifier}/stats`);
}
