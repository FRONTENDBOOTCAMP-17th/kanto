import { getActiveMeetups } from "@/services/go/go";
import GoClient from "./_components/GoClient";

// 로그인 사용자 쿠키를 읽는 화면이므로 항상 동적 렌더링한다.
// (명시하지 않으면 try/catch로 감싼 cookies() 호출이 빌드 시 정적 렌더링으로 잘못 굳을 수 있다)
export const dynamic = "force-dynamic";

export default async function GoPage() {
  const initialMeetups = await getActiveMeetups().catch(() => []);
  return <GoClient initialMeetups={initialMeetups} />;
}
