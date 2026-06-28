import { cookies } from "next/headers";
import CategoryTreeClient from "./CategoryTreeClient";
import { RENDER_COUNT_COOKIE, RENDER_COUNT_DEFAULT, clampCount } from "./config";

// 서버 컴포넌트: 요청 쿠키에서 저장된 렌더링 행 수를 읽어 초기값으로 전달
// → 첫 렌더부터 저장값으로 그려져 2000→N 깜빡임이 없음
export default async function Page() {
  const store = await cookies();
  const raw = store.get(RENDER_COUNT_COOKIE)?.value;
  const initialCount = raw ? clampCount(parseInt(raw, 10)) : RENDER_COUNT_DEFAULT;

  return <CategoryTreeClient initialCount={initialCount} />;
}
