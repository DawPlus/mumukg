export const foodCategories = ['한식', '중식', '일식', '양식', '디저트', '기타'] as const;

export type FoodCategory = (typeof foodCategories)[number];

const categoryIcons: Record<FoodCategory, string> = {
  한식: '1f35a',
  중식: '1f95f',
  일식: '1f363',
  양식: '1f354',
  디저트: '1f370',
  기타: '1f437',
};

export function normalizeFoodCategory(value: unknown): FoodCategory {
  if (typeof value === 'string' && (foodCategories as readonly string[]).includes(value)) {
    return value as FoodCategory;
  }
  return '기타';
}

export function getFoodCategory(categoryName: string, groupCode?: string) {
  const path = categoryName.split('>').map((part) => part.trim());
  if (groupCode === 'CE7' || path.includes('카페')) return '디저트';
  const category = path[0] === '음식점' ? path[1] : path[0];
  return foodCategories.find((item) => item === category) ?? '기타';
}

export function getFoodSubcategory(categoryName: string) {
  return categoryName.split('>').pop()?.trim() ?? categoryName;
}

export function getCategoryIconCode(category: string) {
  return categoryIcons[normalizeFoodCategory(category)];
}

export function getFoodIcon(categoryName: string) {
  return `/food-icons/${getCategoryIconCode(getFoodCategory(categoryName))}.svg`;
}
