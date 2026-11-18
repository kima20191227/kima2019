// 임원단 소개 페이지 사진 — 이름 → 이미지 경로.
// 사진은 public/images/leaders/ 에 3:4(반명함 비율) 360×480 JPG로 둔다.
// 사진을 추가하려면 파일을 넣고 아래에 한 줄을 추가하면 된다. 없는 임원은 이름 첫 글자로 표시된다.
// (같은 사람이 여러 직책에 있으면 이름이 같으므로 한 번만 등록하면 모두에 적용된다.)

const DIR = '/images/leaders'

export const LEADER_PHOTOS: Readonly<Record<string, string>> = {
  // 직접 받은 사진 (2026 포럼 책자 폴더)
  남양규: `${DIR}/nam-yang-gyu.jpg`,
  문창선: `${DIR}/mun-chang-seon.jpg`,
  서기원: `${DIR}/seo-gi-won.jpg`,
  오승재: `${DIR}/o-seung-jae.jpg`,
  정노화: `${DIR}/jeong-no-hwa.jpg`,
  정재훈: `${DIR}/jeong-jae-hun.jpg`,
  최고수: `${DIR}/choe-go-su.jpg`,
  허은열: `${DIR}/heo-eun-yeol.jpg`,
  홍광표: `${DIR}/hong-gwang-pyo.jpg`,

  // 웹에서 수집한 임시 사진 — 본인 제공 사진을 받으면 같은 파일명으로 교체할 것
  강하전: `${DIR}/gang-ha-jeon.jpg`,
  김광현: `${DIR}/kim-gwang-hyeon.jpg`,
  노인국: `${DIR}/no-in-guk.jpg`,
  박용수: `${DIR}/bak-yong-su.jpg`,
  박찬식: `${DIR}/bak-chan-sik.jpg`,
  손승호: `${DIR}/son-seung-ho.jpg`,
  신상록: `${DIR}/sin-sang-rok.jpg`,
  안정호: `${DIR}/an-jeong-ho.jpg`,
  이승주: `${DIR}/yi-seung-ju.jpg`,
  이정혁: `${DIR}/yi-jeong-hyeok.jpg`,
  장인식: `${DIR}/jang-in-sik.jpg`,
  최경식: `${DIR}/choe-gyeong-sik.jpg`,
  하니프: `${DIR}/ha-ni-peu.jpg`,
}

export function getLeaderPhoto(name: string): string | null {
  return LEADER_PHOTOS[name.trim()] ?? null
}
