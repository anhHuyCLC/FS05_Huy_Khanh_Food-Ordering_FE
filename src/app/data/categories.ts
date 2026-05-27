export interface QuickCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  /** Keywords used to match against restaurant category names from the API */
  keywords: string[];
}

export const quickCategories: QuickCategory[] = [
  {
    id: "all",
    name: "Tất cả",
    slug: "all",
    icon: "🍽️",
    keywords: [],
  },
  {
    id: "food",
    name: "Đồ ăn",
    slug: "food",
    icon: "🍚",
    keywords: ["Món Việt", "Cơm", "Food", "Vietnamese", "Asian"],
  },
  {
    id: "drinks",
    name: "Đồ uống",
    slug: "drinks",
    icon: "🥤",
    keywords: ["Drinks", "Beverage", "Juice", "Smoothie"],
  },
  {
    id: "vegetarian",
    name: "Đồ chay",
    slug: "vegetarian",
    icon: "🥗",
    keywords: ["Chay", "Vegetarian", "Healthy", "Salad", "Vegan"],
  },
  {
    id: "cake",
    name: "Bánh kem",
    slug: "cake",
    icon: "🎂",
    keywords: ["Bánh", "Cake", "Bakery", "Pastry"],
  },
  {
    id: "dessert",
    name: "Tráng miệng",
    slug: "dessert",
    icon: "🍰",
    keywords: ["Dessert", "Tráng miệng", "Ice Cream", "Sweets", "Bakery"],
  },
  {
    id: "pizza-burger",
    name: "Pizza/Burger",
    slug: "pizza-burger",
    icon: "🍕",
    keywords: ["Pizza", "Burger", "Fast Food", "American"],
  },
  {
    id: "hotpot",
    name: "Món lẩu",
    slug: "hotpot",
    icon: "🍲",
    keywords: ["Lẩu", "Hotpot", "BBQ", "Grill"],
  },
  {
    id: "sushi",
    name: "Sushi",
    slug: "sushi",
    icon: "🍣",
    keywords: ["Sushi", "Japanese", "Asian", "Seafood"],
  },
  {
    id: "pho",
    name: "Mì phở",
    slug: "pho",
    icon: "🍜",
    keywords: ["Pho", "Ramen", "Noodles", "Mì", "Vietnamese"],
  },
  {
    id: "rice-box",
    name: "Cơm hộp",
    slug: "rice-box",
    icon: "🍱",
    keywords: ["Cơm", "Rice", "Món Việt", "Vietnamese"],
  },
  {
    id: "fried-chicken",
    name: "Gà rán",
    slug: "fried-chicken",
    icon: "🍗",
    keywords: ["Chicken", "Gà", "Fried", "Fast Food"],
  },
  {
    id: "milk-tea",
    name: "Trà sữa",
    slug: "milk-tea",
    icon: "🧋",
    keywords: ["Trà sữa", "Milk Tea", "Tea", "Boba", "Drinks"],
  },
  {
    id: "coffee",
    name: "Cafe",
    slug: "coffee",
    icon: "☕",
    keywords: ["Coffee", "Cafe", "Cà phê", "Brunch"],
  },
  {
    id: "healthy",
    name: "Healthy",
    slug: "healthy",
    icon: "🥑",
    keywords: ["Healthy", "Salad", "Chay", "Vegetarian", "Clean"],
  },
  {
    id: "fast-food",
    name: "Fast Food",
    slug: "fast-food",
    icon: "🍟",
    keywords: ["Fast Food", "Burger", "Chicken", "Pizza", "American"],
  },
];

/** Resolve a slug to matching API category names using keyword fuzzy matching */
export function resolveSlugToKeywords(slug: string): string[] {
  if (slug === "all") return [];
  const cat = quickCategories.find((c) => c.slug === slug);
  return cat?.keywords ?? [];
}
