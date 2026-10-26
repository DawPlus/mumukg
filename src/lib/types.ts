export type Restaurant = { id: string; name: string; category: string; latitude: number; longitude: number; note: string; visited: boolean; createdAt: string; placeId?: string; address?: string; phone?: string; placeUrl?: string };

export type FoodStory = {
  id: string;
  name: string;
  eatenAt: string;
  place: string;
  note: string;
  rating: number | null;
  amount: number | null;
  /** Twemoji code under /food-icons/{code}.svg */
  icon: string;
  createdAt: string;
};

export type FoodRank = {
  name: string;
  count: number;
  totalAmount: number;
  icon: string;
};
