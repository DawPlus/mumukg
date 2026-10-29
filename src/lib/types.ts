export type RestaurantVisitFeedback = { date: string; rating: 'satisfied' | 'unsatisfied'; reason: string };

export type Restaurant = { id: string; name: string; category: string; latitude: number; longitude: number; note: string; satisfaction?: RestaurantVisitFeedback['rating']; rating?: number; visited: boolean; visitDates?: string[]; visitFeedback?: RestaurantVisitFeedback[]; createdAt: string; placeId?: string; address?: string; phone?: string; placeUrl?: string; kakaoPlace?: { id: string; place_name: string; category_name: string; category_group_code: string; category_group_name?: string; address_name: string; road_address_name: string; phone: string; place_url: string; distance: string; x: string; y: string } };

export type MapMemory = {
  id: string;
  placeId: string;
  userId: string;
  nickname: string;
  memory: string;
  nextMenu?: string;
  tags: string[];
  visited: boolean;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
  visits: MapVisit[];
};

export type MapVisit = {
  id: string;
  memoryId?: string;
  userId?: string;
  nickname?: string;
  date: string;
  stars?: number;
  revisit?: 'yes' | 'maybe' | 'no';
  menu: string;
  reason: string;
  highlights?: string[];
  legacySatisfaction?: RestaurantVisitFeedback['rating'];
  sourceId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type MapPlace = Omit<Restaurant, 'visited' | 'rating' | 'satisfaction' | 'visitDates' | 'visitFeedback'> & {
  kakaoPlaceId?: string;
  createdBy: string;
  creatorNickname: string;
  memories: MapMemory[];
};

export type MapImportItem = {
  place: Omit<MapPlace, 'memories' | 'createdBy' | 'creatorNickname'>;
  memory: Omit<MapMemory, 'id' | 'placeId' | 'userId' | 'nickname' | 'createdAt' | 'updatedAt' | 'visits'> & { visits: MapVisit[] };
  visits: (MapVisit & { sourceId: string })[];
};

export type FoodStory = {
  id: string;
  /** Optional detail label; falls back to category when empty. */
  name: string;
  /** Same set as map registration: 한식/중식/일식/양식/디저트/기타 */
  category: string;
  eatenAt: string;
  place: string;
  note: string;
  rating: number | null;
  amount: number | null;
  /** Twemoji code under /food-icons/{code}.svg — derived from category */
  icon: string;
  createdAt: string;
};

export type FoodRank = {
  name: string;
  count: number;
  totalAmount: number;
  icon: string;
};

export type CategoryRank = {
  category: string;
  count: number;
  icon: string;
};
