const demoAvatar = (seed: string) =>
  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=ff66b3,ffd6e8,f3f4f6&textColor=111827`;

// All people, biographies, ratings, statistics, reviews, and avatars below are
// fictional fixtures created solely for this portfolio prototype.
export const tutor = {
  id: "maya-r-demo",
  name: "Maya R.",
  avatar: demoAvatar("Maya R demo tutor"),
  country: "Portugal",
  rating: 4.8,
  reviewCount: 38,
  lessonCount: 1240,
  lessonRating: {
    reassurance: 4.8,
    clarity: 4.8,
    progress: 4.7,
    preparation: 4.9,
    basedOn: 38,
  },
  pricePerLesson: 24,
  bio: "I help adult learners build confidence in practical English conversations for work, travel, and everyday life. Sessions combine structured speaking practice, clear feedback, and realistic scenarios.",
  teflCertified: true,
  yearsExperience: 6,
  specialties: [
    "Conversational English",
    "Business English",
    "Intensive English",
    "English for traveling",
    "English job interview prep",
  ],
};

export const students = [
  {
    id: "learner-a",
    name: "Learner A",
    avatar: demoAvatar("Learner A"),
    review: "The structured speaking rounds made it easier to participate and notice what I could improve.",
    date: "Synthetic example",
  },
  {
    id: "learner-b",
    name: "Learner B",
    avatar: demoAvatar("Learner B"),
    review: "The role-play prompts felt realistic and helped me practice language I can use at work.",
    date: "Synthetic example",
  },
  {
    id: "learner-c",
    name: "Learner C",
    avatar: demoAvatar("Learner C"),
    review: "I liked having a clear turn to speak and a focused feedback summary after the session.",
    date: "Synthetic example",
  },
  {
    id: "learner-d",
    name: "Learner D",
    avatar: demoAvatar("Learner D"),
    review: "The small group format gave me more speaking time while still feeling social and supportive.",
    date: "Synthetic example",
  },
  {
    id: "learner-e",
    name: "Learner E",
    avatar: demoAvatar("Learner E"),
    review: "The tutor kept the conversation moving and the timer helped everyone contribute equally.",
    date: "Synthetic example",
  },
  {
    id: "learner-f",
    name: "Learner F",
    avatar: demoAvatar("Learner F"),
    review: "The feedback was concise, specific, and easy to turn into a goal for the next session.",
    date: "Synthetic example",
  },
];

// Helper to create a date relative to now
const hoursFromNow = (hours: number) => {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  d.setMinutes(0, 0, 0);
  return d.toISOString();
};

export const sharedSessions = [
  {
    id: "travel-cafe",
    theme: "Travel",
    scenario: "Ordering at a café abroad",
    language: "English",
    level: "B1",
    duration: "45 min",
    price: 16,
    tutor: tutor,
    spotsLeft: 2,
    maxSpots: 2,
    nextSession: "Tomorrow, 2:00 PM",
    scheduledAt: hoursFromNow(24),
    meetLink: "https://meet.google.com/abc-defg-hij",
    description: "Practice ordering food and drinks, asking for recommendations, and handling common café situations in English.",
  },
  {
    id: "workplace-smalltalk",
    theme: "Workplace",
    scenario: "Office small talk & networking",
    language: "English",
    level: "B2–C1",
    duration: "45 min",
    price: 16,
    tutor: tutor,
    spotsLeft: 1,
    maxSpots: 2,
    nextSession: "Mon, 10:00 AM",
    scheduledAt: hoursFromNow(48),
    meetLink: "https://meet.google.com/klm-nopq-rst",
    description: "Master professional conversations: water cooler chat, meeting intros, and building workplace relationships.",
  },
  {
    id: "social-bar",
    theme: "Social",
    scenario: "Bar talk & making friends",
    language: "English",
    level: "B2",
    duration: "60 min",
    price: 16,
    tutor: tutor,
    spotsLeft: 2,
    maxSpots: 2,
    nextSession: "Sat, 6:00 PM",
    scheduledAt: hoursFromNow(72),
    meetLink: "https://meet.google.com/uvw-xyza-bcd",
    description: "Learn casual conversation starters, idioms, and social expressions for relaxed environments.",
  },
  {
    id: "interview-prep",
    theme: "Workplace",
    scenario: "Job interview practice",
    language: "English",
    level: "B2–C1",
    duration: "60 min",
    price: 16,
    tutor: tutor,
    spotsLeft: 1,
    maxSpots: 2,
    nextSession: "Wed, 3:00 PM",
    scheduledAt: hoursFromNow(1), // 1 hour from now — for demo/testing
    meetLink: "https://meet.google.com/efg-hijk-lmn",
    description: "Practice answering common interview questions, professional vocabulary, and making a strong impression.",
  },
  {
    id: "travel-directions",
    theme: "Travel",
    scenario: "Asking for directions & transport",
    language: "English",
    level: "B1",
    duration: "45 min",
    price: 16,
    tutor: tutor,
    spotsLeft: 2,
    maxSpots: 2,
    nextSession: "Thu, 4:00 PM",
    scheduledAt: hoursFromNow(96),
    meetLink: "https://meet.google.com/opq-rstu-vwx",
    description: "Navigate cities confidently: asking for directions, using public transport, and handling travel situations.",
  },
  {
    id: "social-dinner",
    theme: "Social",
    scenario: "Dinner party conversations",
    language: "English",
    level: "B2",
    duration: "60 min",
    price: 16,
    tutor: tutor,
    spotsLeft: 2,
    maxSpots: 2,
    nextSession: "Fri, 7:00 PM",
    scheduledAt: hoursFromNow(120),
    meetLink: "https://meet.google.com/yza-bcde-fgh",
    description: "Perfect your social English: discussing interests, telling stories, and engaging in group conversations.",
  },
];
