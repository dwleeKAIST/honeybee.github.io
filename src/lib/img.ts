// public/images/ 에 파일이 있으면 경로를, 없으면 null을 돌려줍니다.
// 사진을 나중에 올려도 되도록, 파일이 없으면 그 자리를 비워 둡니다.
// 빌드는 프로젝트 루트에서 실행되므로 cwd 기준으로 확인합니다.
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export function img(file: string): string | null {
  return existsSync(join(process.cwd(), 'public/images', file))
    ? `/images/${file}`
    : null;
}

/**
 * 사이트에서 쓰는 사진 파일명.
 * public/images/ 에 아래 이름으로 올리면 해당 위치에 자동으로 표시됩니다.
 */
export const photos = {
  /** 의료진 2인 사진 — 홈 히어로, 의료진 소개 */
  together: 'doctors-together.jpg',
  /** 접수 데스크 — 오시는 길 */
  reception: 'clinic-reception.jpg',
  /** 진료실 상담 — 의료진 소개 */
  consult: 'consult-room.jpg',
  /** 김은미 대표원장 */
  kimEunmi: 'doctor-kim-eunmi.jpg',
  /** 박종규 진료원장 */
  parkJonggyu: 'doctor-park-jonggyu.jpg',
  /** 진료시간표 이미지 — 의료진 소개 */
  schedule: 'schedule.jpg',
} as const;
