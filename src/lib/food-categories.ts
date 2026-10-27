export const foodCategories = ['한식', '중식', '일식', '양식', '디저트', '기타'];

const categoryIcons: Record<string, string> = {
  한식: '1f35a',
  중식: '1f95f',
  일식: '1f363',
  양식: '1f354',
  디저트: '1f370',
  기타: '1f437',
};

export function getFoodCategory(categoryName: string, groupCode?: string) {
  const path = categoryName.split('>').map((part) => part.trim());
  if (groupCode === 'CE7' || path.includes('카페')) return '디저트';
  const category = path[0] === '음식점' ? path[1] : path[0];
  return foodCategories.find((item) => item === category) ?? '기타';
}

export function getFoodSubcategory(categoryName: string) {
  return categoryName.split('>').pop()?.trim() ?? categoryName;
}

export function getFoodIcon(categoryName: string) {
  return `/food-icons/${categoryIcons[getFoodCategory(categoryName)]}.svg`;
}
