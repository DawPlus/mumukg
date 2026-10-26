/** Local Twemoji SVG under /food-icons/{code}.svg */

const icon = (code: string) => `/food-icons/${code}.svg`;
const DEFAULT_ICON = icon('1f37d');

/**
 * 더 구체적인 규칙을 위에 둔다.
 * 예: 양고기 → 소고기 → 돼지고기 → 닭 → 일반 고기
 */
const rules: [RegExp, string][] = [
  // —— 육류 (동물별) ——
  [/양고기|양갈비|양꼬치|양곱창|램\b|램고기|mutton|lamb/i, icon('1f411')],
  [/소고기|한우|우삼겹|차돌|소갈비|소불고기|육회|육사시미|로스트비프|티본|안심스테이크|등심스테이크|채끝|양지|사태|우족|곰탕|설렁탕|beef/i, icon('1f42e')],
  [/스테이크|립아이|토마호크/, icon('1f969')],
  [/베이컨|bacon/i, icon('1f953')],
  [/돼지고기|삼겹|목살|제육|돼지갈비|항정|가브리|앞다리|뒷다리|보쌈|족발|두루치기|수육|편육|돼지국밥|pork/i, icon('1f437')],
  [/오리|오리고기|훈제오리|duck/i, icon('1f986')],
  [/칠면조|turkey/i, icon('1f983')],
  [/치킨|닭강정|후라이드|양념치킨|간장치킨|닭발|닭갈비|닭볶음|닭곰탕|삼계탕|백숙|닭도리|닭고기|닭\b|chicken/i, icon('1f357')],

  // —— 해산물 ——
  [/장어|민물장어|바다장어/, icon('1f421')],
  [/연어|salmon/i, icon('1f41f')],
  [/참치|tuna/i, icon('1f41f')],
  [/문어|낙지|주꾸미|오징어/, icon('1f419')],
  [/게장|꽃게|대게|킹크랩|crab/i, icon('1f980')],
  [/랍스터|lobster/i, icon('1f99e')],
  [/새우|쉬림프|대하|shrimp/i, icon('1f990')],
  [/조개|홍합|전복|굴\b|바지락|oyster/i, icon('1f9aa')],
  [/초밥|스시|사시미|회\b|모듬회|광어|우럭|sushi/i, icon('1f363')],
  [/생선|생선구이|고등어|갈치|삼치|생선까스|fish/i, icon('1f41f')],
  [/어묵|오뎅|물고기빵/, icon('1f365')],

  // —— 찌개 / 국 / 탕 / 전골 ——
  [/김치찌개|된장찌개|순두부|부대찌개|청국장|동태찌개|짜글이|찌개/, icon('1f372')],
  [/국밥|설렁탕|곰탕|갈비탕|육개장|미역국|북어국|황태국|토란국|국\b/, icon('1f372')],
  [/전골|샤브|나베|탕\b|해물탕|알탕|대구탕|매운탕/, icon('1f372')],
  [/스프|수프|죽\b|스프커리|soup/i, icon('1f963')],
  [/찌개|국물/, icon('1f372')],

  // —— 면 / 분식 ——
  [/떡볶|떡보끼/, icon('1f362')],
  [/김밥/, icon('1f371')],
  [/만두|교자|딤섬|왕만두/, icon('1f95f')],
  [/라면|우동|국수|냉면|칼국수|쫄면|잔치국수|막국수|비빔국수|콩국수|소바|쌀국수|짜장면|짬뽕|울면/, icon('1f35c')],
  [/파스타|스파게티|알리오|까르보나라|볼로네제|페투치니|링귀니/, icon('1f35d')],
  [/돈까스|돈가스|돈카츠|커틀릿|로스가스|생선가스/, icon('1f969')],
  [/핫도그|소시지/, icon('1f32d')],
  [/튀김|오징어튀김|김말이/, icon('1f35f')],
  [/순대|분식/, icon('1f371')],
  [/감자튀김|감튀|프라이|프렌치프라이|웨지감자/, icon('1f35f')],

  // —— 밥 / 한식 메인 ——
  [/주먹밥|삼각김밥|오니기리|rice ball/i, icon('1f359')],
  [/비빔밥|덮밥|볶음밥/, icon('1f35a')],
  [/도시락|벤토|정식|백반|한식/, icon('1f371')],
  [/카레/, icon('1f35b')],
  [/필라프|리조또/, icon('1f373')],
  [/흰죽|전복죽|호박죽|죽\b/, icon('1f963')],
  [/밥\b|공기밥|햇반/, icon('1f35a')],

  // —— 중식 / 기타 아시아 ——
  [/마라|탕수육|깐풍|유린기|양장피|중식|중국집|마파두부/, icon('1f961')],
  [/월남쌈|분짜|팟타이|태국|베트남/, icon('1f961')],

  // —— 패스트푸드 / 양식 ——
  [/피자/, icon('1f355')],
  [/햄버거|버거|수제버거/, icon('1f354')],
  [/타코|멕시칸|부리또|부리토|퀘사디아|나초/, icon('1f32e')],
  [/케밥|집싸|집싸브레드|팔라펠/, icon('1f959')],
  [/샌드위치|서브웨이|클럽샌드|베이글샌드/, icon('1f96a')],
  [/브런치|오믈렛|스크램블/, icon('1f373')],

  // —— 빵 / 베이커리 ——
  [/크로와상|크루아상|croissant/i, icon('1f950')],
  [/바게트|식빵|빵\b|토스트|베이글|치아바타/, icon('1f35e')],
  [/프레첼|pretzel/i, icon('1f968')],
  [/파이\b|애플파이|호박파이/, icon('1f967')],

  // —— 디저트 / 스위트 ——
  [/도넛|도너츠|도나스|donut|doughnut/i, icon('1f369')],
  [/컵케이크|cupcake/i, icon('1f9c1')],
  [/케이크|생크림|티라미수|치즈케이크|초코케이크|생일케이크|케이크트/, icon('1f370')],
  [/마카롱|푸딩|커스터드|젤리/, icon('1f36e')],
  [/쿠키|비스킷|스콘/, icon('1f36a')],
  [/초콜릿|초코|브라우니/, icon('1f36b')],
  [/사탕|캔디|젤리빈/, icon('1f36c')],
  [/아이스크림|젤라토|소프트콘|빙수|팥빙수|설빙/, icon('1f368')],
  [/샤베트|셔벗|빙과/, icon('1f367')],
  [/와플|팬케이크|핫케이크|호떡|크레페/, icon('1f95e')],
  [/붕어빵|잉어빵|계란빵/, icon('1f41f')],
  [/디저트|디저/, icon('1f370')],
  [/꿀|허니/, icon('1f36f')],

  // —— 음료 ——
  [/버블티|타피오카/, icon('1f9cb')],
  [/커피|아메리카노|라떼|에스프레소|콜드브루|카푸치노|모카|바닐라라떼|카페/, icon('2615')],
  [/밀크티|녹차|홍차|보리차|아이스티|차\b|티\b|tea/i, icon('1f375')],
  [/주스|스무디|에이드|레몬에이드|오렌지주스|착즙/, icon('1f964')],
  [/우유|두유|요거트|요구르트|milk/i, icon('1f95b')],
  [/맥주|소주|막걸리|와인|칵테일|하이볼|위스키|사케|술\b|포차|호프/, icon('1f37b')],
  [/탄산|콜라|사이다|환타|제로콜라|soda/i, icon('1f964')],

  // —— 채소 / 샐러드 / 사이드 ——
  [/샐러드|채소|야채|그린샐러드/, icon('1f957')],
  [/김치|겉절이|석박지/, icon('1f345')],
  [/감자|고구마|해시브라운/, icon('1f954')],
  [/옥수수|콘\b|콘버터/, icon('1f33d')],
  [/버섯|표고|느타리|새송이/, icon('1f344')],
  [/아보카도/, icon('1f951')],
  [/양파|마늘|고추|피망/, icon('1f9c5')],

  // —— 과일 ——
  [/딸기|스트로베리/, icon('1f353')],
  [/수박/, icon('1f349')],
  [/사과|애플/, icon('1f34e')],
  [/바나나/, icon('1f34c')],
  [/포도/, icon('1f347')],
  [/오렌지|귤|감귤/, icon('1f34a')],
  [/레몬/, icon('1f34b')],
  [/복숭아|피치/, icon('1f351')],
  [/체리/, icon('1f352')],
  [/망고|파인애플|키위|과일|과일컵/, icon('1f353')],

  // —— 유제품 / 기타 재료 ——
  [/치즈|치즈볼|치즈스틱/, icon('1f9c0')],
  [/버터|마가린/, icon('1f9c8')],
  [/달걀|계란|에그|계란말이|계란찜|스크램블에그/, icon('1f95a')],
  [/견과|땅콩|아몬드|호두/, icon('1f95c')],
  [/팝콘/, icon('1f37f')],
  [/통조림|캔\b/, icon('1f96b')],
  [/곱창|막창|대창|내장/, icon('1f356')],
  [/고기|구이|바비큐|bbq|BBQ/, icon('1f356')],
];

const emojiRules: [RegExp, string][] = [
  [/양고기|양꼬치|램/, '🐑'],
  [/소고기|한우|우삼겹|차돌|소갈비|육회|곰탕|설렁탕/, '🐮'],
  [/스테이크/, '🥩'],
  [/베이컨/, '🥓'],
  [/돼지고기|삼겹|목살|제육|족발|보쌈|돼지/, '🐷'],
  [/오리/, '🦆'],
  [/치킨|닭|후라이드|삼계탕/, '🍗'],
  [/떡볶/, '🍢'],
  [/돈까스|돈가스|커틀릿/, '🥩'],
  [/피자/, '🍕'],
  [/햄버거|버거/, '🍔'],
  [/초밥|스시|회|사시미/, '🍣'],
  [/라면|우동|국수|면|짜장|짬뽕|쌀국수/, '🍜'],
  [/파스타|스파게티/, '🍝'],
  [/찌개|국밥|탕|전골|국물/, '🍲'],
  [/밥|덮밥|비빔밥|정식/, '🍚'],
  [/김밥|분식|도시락/, '🍱'],
  [/마라|중식|탕수육/, '🥡'],
  [/카페|커피|아메리카노|라떼/, '☕'],
  [/도넛|도너츠|도나스/, '🍩'],
  [/케이크|디저트|티라미수/, '🍰'],
  [/쿠키/, '🍪'],
  [/아이스크림|빙수/, '🍨'],
  [/빵|토스트|베이글/, '🍞'],
  [/맥주|소주|술|와인/, '🍻'],
  [/샐러드|채소/, '🥗'],
  [/샌드위치/, '🥪'],
  [/타코|멕시칸/, '🌮'],
  [/카레/, '🍛'],
  [/감자튀김|감튀|프라이/, '🍟'],
  [/핫도그/, '🌭'],
  [/새우/, '🦐'],
  [/계란|달걀/, '🥚'],
  [/치즈/, '🧀'],
  [/과일|딸기|사과/, '🍓'],
];

export type FoodIconOption = {
  code: string;
  label: string;
  group: string;
};

/** 등록 폼에서 고를 수 있는 아이콘 목록 */
export const foodIconOptions: FoodIconOption[] = [
  // 육류
  { code: '1f42e', label: '소', group: '육류' },
  { code: '1f404', label: '소(전신)', group: '육류' },
  { code: '1f437', label: '돼지', group: '육류' },
  { code: '1f416', label: '돼지(전신)', group: '육류' },
  { code: '1f953', label: '베이컨', group: '육류' },
  { code: '1f411', label: '양', group: '육류' },
  { code: '1f40f', label: '숫양', group: '육류' },
  { code: '1f357', label: '닭/치킨', group: '육류' },
  { code: '1f414', label: '닭', group: '육류' },
  { code: '1f986', label: '오리', group: '육류' },
  { code: '1f983', label: '칠면조', group: '육류' },
  { code: '1f969', label: '스테이크', group: '육류' },
  { code: '1f356', label: '고기구이', group: '육류' },
  // 해산물
  { code: '1f41f', label: '생선', group: '해산물' },
  { code: '1f363', label: '초밥/회', group: '해산물' },
  { code: '1f990', label: '새우', group: '해산물' },
  { code: '1f364', label: '튀김새우', group: '해산물' },
  { code: '1f980', label: '게', group: '해산물' },
  { code: '1f99e', label: '랍스터', group: '해산물' },
  { code: '1f419', label: '문어', group: '해산물' },
  { code: '1f991', label: '오징어', group: '해산물' },
  { code: '1f9aa', label: '조개', group: '해산물' },
  { code: '1f365', label: '어묵', group: '해산물' },
  // 한식/국물
  { code: '1f372', label: '찌개/탕', group: '한식' },
  { code: '1f35a', label: '밥', group: '한식' },
  { code: '1f359', label: '주먹밥', group: '한식' },
  { code: '1f371', label: '도시락/김밥', group: '한식' },
  { code: '1f362', label: '떡볶이', group: '한식' },
  { code: '1f95f', label: '만두', group: '한식' },
  { code: '1f35c', label: '라면/국수', group: '한식' },
  { code: '1f35b', label: '카레', group: '한식' },
  { code: '1f963', label: '죽/수프', group: '한식' },
  { code: '1f373', label: '볶음/오믈렛', group: '한식' },
  { code: '1f961', label: '중식/포장', group: '한식' },
  // 양식/분식
  { code: '1f355', label: '피자', group: '양식' },
  { code: '1f354', label: '버거', group: '양식' },
  { code: '1f35d', label: '파스타', group: '양식' },
  { code: '1f32d', label: '핫도그', group: '양식' },
  { code: '1f35f', label: '감자튀김', group: '양식' },
  { code: '1f32e', label: '타코', group: '양식' },
  { code: '1f32f', label: '부리또', group: '양식' },
  { code: '1f96a', label: '샌드위치', group: '양식' },
  { code: '1f959', label: '케밥', group: '양식' },
  { code: '1f957', label: '샐러드', group: '양식' },
  // 빵/디저트
  { code: '1f35e', label: '빵', group: '디저트' },
  { code: '1f950', label: '크로와상', group: '디저트' },
  { code: '1f369', label: '도넛', group: '디저트' },
  { code: '1f370', label: '케이크', group: '디저트' },
  { code: '1f382', label: '생일케이크', group: '디저트' },
  { code: '1f9c1', label: '컵케이크', group: '디저트' },
  { code: '1f36a', label: '쿠키', group: '디저트' },
  { code: '1f36b', label: '초콜릿', group: '디저트' },
  { code: '1f368', label: '아이스크림', group: '디저트' },
  { code: '1f366', label: '소프트콘', group: '디저트' },
  { code: '1f367', label: '빙수', group: '디저트' },
  { code: '1f95e', label: '와플/호떡', group: '디저트' },
  { code: '1f36e', label: '푸딩', group: '디저트' },
  { code: '1f967', label: '파이', group: '디저트' },
  // 음료
  { code: '2615', label: '커피', group: '음료' },
  { code: '1f375', label: '차', group: '음료' },
  { code: '1f9cb', label: '버블티', group: '음료' },
  { code: '1f964', label: '주스/탄산', group: '음료' },
  { code: '1f95b', label: '우유', group: '음료' },
  { code: '1f37a', label: '맥주', group: '음료' },
  { code: '1f37b', label: '건배', group: '음료' },
  { code: '1f377', label: '와인', group: '음료' },
  { code: '1f378', label: '칵테일', group: '음료' },
  { code: '1f376', label: '사케', group: '음료' },
  // 과일/채소
  { code: '1f353', label: '딸기', group: '과일채소' },
  { code: '1f34e', label: '사과', group: '과일채소' },
  { code: '1f34c', label: '바나나', group: '과일채소' },
  { code: '1f349', label: '수박', group: '과일채소' },
  { code: '1f347', label: '포도', group: '과일채소' },
  { code: '1f34a', label: '오렌지', group: '과일채소' },
  { code: '1f345', label: '토마토', group: '과일채소' },
  { code: '1f954', label: '감자', group: '과일채소' },
  { code: '1f33d', label: '옥수수', group: '과일채소' },
  { code: '1f951', label: '아보카도', group: '과일채소' },
  { code: '1f95a', label: '계란', group: '과일채소' },
  { code: '1f9c0', label: '치즈', group: '과일채소' },
  // 기타
  { code: '1f37d', label: '식사', group: '기타' },
  { code: '1f374', label: '수저', group: '기타' },
  { code: '1f37f', label: '팝콘', group: '기타' },
  { code: '1f525', label: '매운맛', group: '기타' },
];

export const foodIconGroups = [
  '육류',
  '해산물',
  '한식',
  '양식',
  '디저트',
  '음료',
  '과일채소',
  '기타',
] as const;

const optionCodes = new Set(foodIconOptions.map((o) => o.code));

export function foodIconPath(code: string) {
  return icon(code);
}

export function isFoodIconCode(value: string) {
  return optionCodes.has(value) || /^[0-9a-f]{2,8}$/i.test(value);
}

export function codeFromIconSrc(src: string) {
  const match = src.match(/\/food-icons\/([^/.]+)\.svg$/);
  return match?.[1] ?? '1f37d';
}

export function suggestIconCode(name: string) {
  return codeFromIconSrc(foodIconSrc(name));
}

export function resolveFoodIconSrc(name: string, iconCode?: string | null) {
  if (iconCode && isFoodIconCode(iconCode)) return foodIconPath(iconCode);
  return foodIconSrc(name);
}

export function foodIconSrc(name: string) {
  for (const [pattern, src] of rules) {
    if (pattern.test(name)) return src;
  }
  return DEFAULT_ICON;
}

export function foodEmoji(name: string) {
  for (const [pattern, emoji] of emojiRules) {
    if (pattern.test(name)) return emoji;
  }
  return '🍽️';
}
