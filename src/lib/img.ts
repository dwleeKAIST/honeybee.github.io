// public/images/ 에 파일이 있으면 경로를, 없으면 null을 돌려줍니다.
// 사진을 나중에 올려도 되도록, 파일이 없으면 그 자리를 비워 둡니다.
// 빌드는 프로젝트 루트에서 실행되므로 cwd 기준으로 확인합니다.
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// 확장자를 신경 쓰지 않아도 되도록, 이름이 같으면 아래 순서로 찾습니다.
const EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.JPG', '.JPEG', '.PNG'];

/**
 * 파일명을 확장자 없이 넘기면 알아서 찾습니다.
 *   img('doctors-together')  →  '/images/doctors-together.png' (있는 것)
 * 확장자를 붙여 넘기면 그 파일만 찾습니다.
 */
export function img(name: string): string | null {
  const dir = join(process.cwd(), 'public/images');
  const candidates = /\.[a-zA-Z0-9]+$/.test(name)
    ? [name]
    : EXTS.map((e) => name + e);
  for (const file of candidates) {
    if (existsSync(join(dir, file))) return `/images/${file}`;
  }
  return null;
}

/**
 * 사이트에서 쓰는 사진 이름. 확장자는 적지 않습니다.
 * public/images/ 에 아래 이름으로 올리면 해당 위치에 자동으로 표시됩니다.
 * (jpg · jpeg · png · webp 무엇이든 됩니다)
 */
export const photos = {
  /** 의료진 2인 사진 — 홈 히어로, 의료진 소개 */
  together: 'doctors-together',
  /** 접수 데스크 — 오시는 길 */
  reception: 'clinic-reception',
  /** 진료실 상담 — 의료진 소개 */
  consult: 'consult-room',
  /** 김은미 대표원장 */
  kimEunmi: 'doctor-kim-eunmi',
  /** 박종규 진료원장 */
  parkJonggyu: 'doctor-park-jonggyu',
  /** 진료시간표 이미지 — 의료진 소개 */
  schedule: 'schedule',
} as const;
