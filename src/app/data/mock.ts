export const IMGS = {
  burger: "https://images.unsplash.com/photo-1610440042657-612c34d95e9f?w=800&q=80",
  pizza: "https://images.unsplash.com/photo-1727198826083-6693684e4fc1?w=800&q=80",
  sushi: "https://images.unsplash.com/photo-1689039234540-d335a43ca28a?w=800&q=80",
  pho: "https://images.unsplash.com/photo-1701480253822-1842236c9a97?w=800&q=80",
  coffee: "https://images.unsplash.com/photo-1583124688253-60c350bc90d7?w=800&q=80",
  salad: "https://images.unsplash.com/photo-1649531794884-b8bb1de72e68?w=800&q=80",
  dessert: "https://images.unsplash.com/photo-1759426016293-1b8be5849a72?w=800&q=80",
  restaurant: "https://images.unsplash.com/photo-1762087577613-978bf9066d39?w=800&q=80",
  driver: "https://images.unsplash.com/photo-1777828827442-c488eed5626b?w=800&q=80",
  chicken: "https://images.unsplash.com/photo-1670688866261-db6697858df8?w=800&q=80",
  tacos: "https://images.unsplash.com/photo-1698854632964-c1d4cea0a0a4?w=800&q=80",
  ramen: "https://images.unsplash.com/photo-1627900440398-5db32dba8db1?w=800&q=80",
};

export const restaurants = [
  { id: "1", name: "Burger Republic", image: IMGS.burger, category: "Burgers", rating: 4.8, reviews: 1240, distance: "0.8 km", deliveryTime: "15-25 min", deliveryFee: "$1.99", promo: "20% OFF", tags: ["Burgers", "American"] },
  { id: "2", name: "Pizza Palazzo", image: IMGS.pizza, category: "Pizza", rating: 4.7, reviews: 890, distance: "1.2 km", deliveryTime: "20-30 min", deliveryFee: "Free", promo: "Buy 1 Get 1", tags: ["Pizza", "Italian"] },
  { id: "3", name: "Sushi Zen", image: IMGS.sushi, category: "Japanese", rating: 4.9, reviews: 567, distance: "1.5 km", deliveryTime: "25-35 min", deliveryFee: "$2.99", promo: null, tags: ["Sushi", "Japanese"] },
  { id: "4", name: "Pho House", image: IMGS.pho, category: "Vietnamese", rating: 4.6, reviews: 734, distance: "0.5 km", deliveryTime: "10-20 min", deliveryFee: "$0.99", promo: "15% OFF", tags: ["Vietnamese", "Noodles"] },
  { id: "5", name: "Brew & Bites", image: IMGS.coffee, category: "Café", rating: 4.5, reviews: 412, distance: "0.3 km", deliveryTime: "10-15 min", deliveryFee: "Free", promo: null, tags: ["Coffee", "Brunch"] },
  { id: "6", name: "Green Bowl", image: IMGS.salad, category: "Healthy", rating: 4.7, reviews: 289, distance: "1.0 km", deliveryTime: "15-20 min", deliveryFee: "$1.49", promo: "10% OFF", tags: ["Healthy", "Salads"] },
  { id: "7", name: "Sweet Dreams", image: IMGS.dessert, category: "Desserts", rating: 4.8, reviews: 621, distance: "1.8 km", deliveryTime: "20-30 min", deliveryFee: "$1.99", promo: null, tags: ["Desserts", "Bakery"] },
  { id: "8", name: "Ramen House", image: IMGS.ramen, category: "Asian", rating: 4.9, reviews: 445, distance: "2.1 km", deliveryTime: "20-30 min", deliveryFee: "Free", promo: "New!", tags: ["Ramen", "Japanese"] },
];

export const menuCategories = [
  {
    name: "Popular",
    items: [
      { id: "1", name: "Classic Smash Burger", price: 12.99, image: IMGS.burger, desc: "Double beef patty, cheddar, caramelized onions, house sauce", rating: 4.9, cal: 650 },
      { id: "2", name: "BBQ Bacon Burger", price: 14.99, image: IMGS.chicken, desc: "Crispy bacon, BBQ sauce, jalapeños, pickles", rating: 4.8, cal: 720 },
    ],
  },
  {
    name: "Burgers",
    items: [
      { id: "3", name: "Veggie Supreme", price: 11.99, image: IMGS.salad, desc: "Plant-based patty, avocado, sprouts, chipotle mayo", rating: 4.6, cal: 480 },
      { id: "4", name: "Truffle Mushroom", price: 16.99, image: IMGS.ramen, desc: "Wild mushrooms, truffle aioli, aged parmesan", rating: 4.9, cal: 580 },
    ],
  },
  {
    name: "Sides",
    items: [
      { id: "5", name: "Crispy Fries", price: 4.99, image: IMGS.chicken, desc: "Golden fries with sea salt and herbs", rating: 4.7, cal: 320 },
      { id: "6", name: "Onion Rings", price: 5.99, image: IMGS.tacos, desc: "Beer-battered onion rings, ranch dipping sauce", rating: 4.5, cal: 380 },
    ],
  },
  {
    name: "Drinks",
    items: [
      { id: "7", name: "Craft Lemonade", price: 3.99, image: IMGS.coffee, desc: "Fresh squeezed with mint and ginger", rating: 4.8, cal: 120 },
      { id: "8", name: "Milkshake", price: 5.99, image: IMGS.dessert, desc: "Thick shake in chocolate, vanilla, or strawberry", rating: 4.9, cal: 450 },
    ],
  },
];

export const testimonials = [
  { name: "Sarah Chen", role: "Food Enthusiast", avatar: "SC", text: "Savour changed the way I eat! The AI recommendations are spot-on and delivery is always on time. I've tried restaurants I never would have found otherwise.", rating: 5 },
  { name: "Marcus Johnson", role: "Busy Professional", avatar: "MJ", text: "The group ordering feature is a game-changer for office lunches. We use Savour every single day. The tracking is super accurate.", rating: 5 },
  { name: "Anh Nguyen", role: "Foodie Blogger", avatar: "AN", text: "As someone who reviews food for a living, Savour's social community is incredible. The creator ecosystem is growing fast and the rewards are generous!", rating: 5 },
];

export const faqItems = [
  { q: "How fast is delivery?", a: "Most orders arrive within 15-35 minutes. Our AI optimizes routes in real-time to ensure the fastest possible delivery." },
  { q: "What payment methods are accepted?", a: "We accept cash, all major credit/debit cards, and popular e-wallets including Apple Pay, Google Pay, and PayPal." },
  { q: "Can I track my order in real-time?", a: "Yes! Once your order is placed, you can track the preparation status and your driver's live location on the map." },
  { q: "How do I become a restaurant partner?", a: "Sign up through our Partner portal. We'll review your application within 24 hours and get you set up with full onboarding support." },
  { q: "Is there a minimum order amount?", a: "Minimum order amounts vary by restaurant, typically starting at $5. No minimums for platform fees." },
  { q: "How does the rewards program work?", a: "Earn Savour Points on every order. Reach milestones to unlock badges, exclusive discounts, and priority delivery." },
];

export const revenueData = [
  { month: "Jan", revenue: 12400, orders: 342 },
  { month: "Feb", revenue: 15800, orders: 421 },
  { month: "Mar", revenue: 18200, orders: 512 },
  { month: "Apr", revenue: 16900, orders: 467 },
  { month: "May", revenue: 22100, orders: 634 },
  { month: "Jun", revenue: 25400, orders: 712 },
  { month: "Jul", revenue: 28900, orders: 845 },
];

export const topDishes = [
  { name: "Classic Smash Burger", sold: 284, revenue: 3688, trend: "+12%" },
  { name: "BBQ Bacon Burger", sold: 198, revenue: 2971, trend: "+8%" },
  { name: "Truffle Mushroom", sold: 156, revenue: 2647, trend: "+23%" },
  { name: "Crispy Fries", sold: 445, revenue: 2220, trend: "+5%" },
  { name: "Milkshake", sold: 312, revenue: 1866, trend: "+18%" },
];

export const adminOrders = [
  { id: "#ORD-7721", customer: "Emily Park", restaurant: "Burger Republic", driver: "Alex K.", amount: "$34.90", status: "delivered", time: "2 min ago" },
  { id: "#ORD-7720", customer: "James Woo", restaurant: "Pizza Palazzo", driver: "Maria S.", amount: "$28.50", status: "on_way", time: "8 min ago" },
  { id: "#ORD-7719", customer: "Priya Sharma", restaurant: "Sushi Zen", driver: "Tom H.", amount: "$52.00", status: "preparing", time: "12 min ago" },
  { id: "#ORD-7718", customer: "Lucas Brown", restaurant: "Green Bowl", driver: "Kai L.", amount: "$19.99", status: "delivered", time: "18 min ago" },
  { id: "#ORD-7717", customer: "Sophie Chen", restaurant: "Pho House", driver: "Raj M.", amount: "$22.75", status: "cancelled", time: "25 min ago" },
];

export const categories = [
  { icon: "🍕", label: "Pizza" },
  { icon: "🍔", label: "Burger" },
  { icon: "🍜", label: "Vietnamese" },
  { icon: "☕", label: "Coffee" },
  { icon: "🍰", label: "Dessert" },
  { icon: "🥗", label: "Healthy" },
  { icon: "🍣", label: "Asian" },
  { icon: "🍟", label: "Fast Food" },
  { icon: "🌮", label: "Mexican" },
  { icon: "🍝", label: "Pasta" },
];
