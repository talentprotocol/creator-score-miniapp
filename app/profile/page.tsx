import { ProfileScreen } from "@/components/profile/ProfileScreen";
import { RequireFarcasterUser } from "@/components/navigation/RequireFarcasterUser";

export default function ProfilePage() {
  return (
    <RequireFarcasterUser>
      <ProfileScreen />
    </RequireFarcasterUser>
  );
}
