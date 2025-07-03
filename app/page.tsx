import { redirect } from "next/navigation";
import { FarcasterGate } from "@/components/FarcasterGate";

export default function Home() {
  redirect("/leaderboard");
}
