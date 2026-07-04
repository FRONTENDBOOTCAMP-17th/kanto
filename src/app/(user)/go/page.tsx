import { getActiveMeetups } from "@/services/go/go";
import GoClient from "./_components/GoClient";

export default async function GoPage() {
  const initialMeetups = await getActiveMeetups().catch(() => []);
  return <GoClient initialMeetups={initialMeetups} />;
}
