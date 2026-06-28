// 렌더링 행 수 데모 설정 — 서버 page.tsx(쿠키 읽기)와 클라이언트 양쪽에서 사용
export const RENDER_COUNT_COOKIE = "category_tree_max_rows"; // 쿠키명(콜론 등 불가, 토큰 문자만)
export const RENDER_COUNT_MIN = 1000;
export const RENDER_COUNT_MAX = 200000;
export const RENDER_COUNT_DEFAULT = 10000;
export const RENDER_COUNT_STEP = 1000;

// 100 단위로 반올림 후 범위 클램프. NaN 이면 기본값.
export function clampCount(n: number): number {
  if (Number.isNaN(n)) return RENDER_COUNT_DEFAULT;
  return Math.min(RENDER_COUNT_MAX, Math.max(RENDER_COUNT_MIN, Math.round(n / 100) * 100));
}
