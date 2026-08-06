/**
 * Giant Objects Database for Weight Comparison
 * For serious lifters who want impressive comparisons!
 * 
 * Categories:
 * - Space: Rockets, satellites, space stations
 * - Military: Aircraft carriers, submarines, tanks
 * - Engineering: Bridges, buildings, monuments
 * - Transport: Jumbo jets, trains, ships
 * - Nature: Whales, dinosaurs, natural formations
 * - HumanScale: People, animals, everyday objects (20-200kg range for PRs)
 */

export interface GiantObject {
    name: string;
    icon: string;
    weightKg: number;
    weightDesc: string;
    description: string;
    funFact: string;
    category: 'space' | 'military' | 'engineering' | 'transport' | 'nature' | 'human_scale';
}

// 🚀 SPACE - For the ultimate "out of this world" feeling
const SPACE_OBJECTS: GiantObject[] = [
    {
        name: "Saturn V Rocket",
        icon: "🚀",
        weightKg: 2970000,
        weightDesc: "2,970 tons",
        description: "Most powerful rocket ever flown (Apollo missions)",
        funFact: "Still holds the record for heaviest payload to LEO - your lifts are astronomical!",
        category: "space"
    },
    {
        name: "Space Shuttle",
        icon: "🛰️",
        weightKg: 2000000,
        weightDesc: "2,000 tons",
        description: "NASA's reusable spacecraft",
        funFact: "Each mission cost $450M - your dedication is priceless!",
        category: "space"
    },
    {
        name: "Falcon Heavy",
        icon: "🚀",
        weightKg: 1420000,
        weightDesc: "1,420 tons",
        description: "SpaceX's most powerful operational rocket",
        funFact: "Can lift a 737 jet into orbit - just like you're lifting mountains!",
        category: "space"
    },
    {
        name: "International Space Station",
        icon: "🛸",
        weightKg: 420000,
        weightDesc: "420 tons",
        description: "Largest structure ever built in space",
        funFact: "Took 40+ missions to assemble - you've built strength mission by mission!",
        category: "space"
    },
    {
        name: "James Webb Telescope",
        icon: "🔭",
        weightKg: 6500,
        weightDesc: "6.5 tons",
        description: "Most powerful space telescope ever built",
        funFact: "$10B project - your health investment pays better dividends!",
        category: "space"
    },
    {
        name: "Hubble Telescope",
        icon: "🔭",
        weightKg: 11000,
        weightDesc: "11 tons",
        description: "Revolutionary space telescope",
        funFact: "Has made over 1.5M observations - you've made even more reps!",
        category: "space"
    },
    {
        name: "Sputnik 1",
        icon: "🛰️",
        weightKg: 83.6,
        weightDesc: "83.6 kg",
        description: "First artificial satellite (1957)",
        funFact: "Started the space race - you started your own strength journey!",
        category: "space"
    }
];

// ⚓ MILITARY - For the "unstoppable force" vibe
const MILITARY_OBJECTS: GiantObject[] = [
    {
        name: "USS Gerald R. Ford",
        icon: "🚢",
        weightKg: 100000000,
        weightDesc: "100,000 tons",
        description: "World's largest aircraft carrier",
        funFact: "Can carry 75+ aircraft - your strength carries you through anything!",
        category: "military"
    },
    {
        name: "Nimitz-class Carrier",
        icon: "🚢",
        weightKg: 97000000,
        weightDesc: "97,000 tons",
        description: "US Navy's nuclear-powered carrier",
        funFact: "Powered by 2 nuclear reactors - your power is nuclear too!",
        category: "military"
    },
    {
        name: "Ohio-class Submarine",
        icon: "🔱",
        weightKg: 18700000,
        weightDesc: "18,700 tons",
        description: "Nuclear-powered ballistic missile sub",
        funFact: "Can stay underwater for 3 months - your endurance is unmatched!",
        category: "military"
    },
    {
        name: "B-2 Spirit Bomber",
        icon: "✈️",
        weightKg: 71700,
        weightDesc: "71.7 tons",
        description: "Stealth strategic bomber",
        funFact: "Costs $2.1B each - you're building billion-dollar strength!",
        category: "military"
    },
    {
        name: "M1 Abrams Tank",
        icon: "🎖️",
        weightKg: 62000,
        weightDesc: "62 tons",
        description: "US main battle tank",
        funFact: "Heaviest tank in US service - you're a heavyweight too!",
        category: "military"
    },
    {
        name: "Tiger Tank (WWII)",
        icon: "🔥",
        weightKg: 57000,
        weightDesc: "57 tons",
        description: "Legendary German heavy tank",
        funFact: "Feared on the battlefield - opponents fear you in the gym!",
        category: "military"
    }
];

// 🏗️ ENGINEERING - Human achievements
const ENGINEERING_OBJECTS: GiantObject[] = [
    {
        name: "Eiffel Tower",
        icon: "🗼",
        weightKg: 10000000,
        weightDesc: "10,000 tons",
        description: "Iconic Paris landmark",
        funFact: "Built in 2 years 2 months - your gains took dedication too!",
        category: "engineering"
    },
    {
        name: "Statue of Liberty",
        icon: "🗽",
        weightKg: 225000,
        weightDesc: "225 tons",
        description: "Symbol of freedom and democracy",
        funFact: "Was the tallest iron structure when built - you're reaching new heights!",
        category: "engineering"
    },
    {
        name: "Golden Gate Bridge",
        icon: "🌉",
        weightKg: 805000,
        weightDesc: "805 tons (main cables)",
        description: "Iconic San Francisco bridge",
        funFact: "Strong enough to support both directions of traffic - you're that strong!",
        category: "engineering"
    },
    {
        name: "Hoover Dam",
        icon: "🏗️",
        weightKg: 6600000000,
        weightDesc: "6.6 million tons",
        description: "Concrete arch-gravity dam",
        funFact: "Contains enough concrete to build a highway across the US - you build greatness!",
        category: "engineering"
    },
    {
        name: "Great Pyramid of Giza",
        icon: "🔺",
        weightKg: 6000000000,
        weightDesc: "6 million tons",
        description: "Ancient wonder of the world",
        funFact: "Built 4,500 years ago - your legacy will last too!",
        category: "engineering"
    },
    {
        name: "CN Tower",
        icon: "📡",
        weightKg: 130000,
        weightDesc: "130,000 tons",
        description: "Toronto's iconic communications tower",
        funFact: "Tallest free-standing structure in Western Hemisphere - you stand tall!",
        category: "engineering"
    }
];

// ✈️ TRANSPORT - Massive vehicles
const TRANSPORT_OBJECTS: GiantObject[] = [
    {
        name: "Boeing 747",
        icon: "✈️",
        weightKg: 183500,
        weightDesc: "183.5 tons (max takeoff)",
        description: "Queen of the skies",
        funFact: "Can fly 600+ passengers - you carry that weight with ease!",
        category: "transport"
    },
    {
        name: "Airbus A380",
        icon: "🛫",
        weightKg: 575000,
        weightDesc: "575 tons (max takeoff)",
        description: "World's largest passenger airliner",
        funFact: "Largest passenger capacity in the world - your capacity is limitless!",
        category: "transport"
    },
    {
        name: "Concorde",
        icon: "✈️",
        weightKg: 185070,
        weightDesc: "185 tons",
        description: "Supersonic passenger jet",
        funFact: "Flew faster than sound - you break barriers too!",
        category: "transport"
    },
    {
        name: "Burj Khalifa",
        icon: "🏢",
        weightKg: 500000,
        weightDesc: "500,000 tons",
        description: "World's tallest building (Dubai)",
        funFact: "Took 6 years to build - consistency built this AND your strength!",
        category: "engineering"
    },
    {
        name: "Queen Mary 2",
        icon: "🚢",
        weightKg: 76000000,
        weightDesc: "76,000 tons",
        description: "Luxury ocean liner",
        funFact: "Can carry 2,600 passengers in style - you travel in strength!",
        category: "transport"
    }
];

// 🐋 NATURE - The biggest creatures and formations
const NATURE_OBJECTS: GiantObject[] = [
    {
        name: "Blue Whale",
        icon: "🐋",
        weightKg: 150000,
        weightDesc: "150 tons",
        description: "Largest animal to ever exist",
        funFact: "Tongue alone weighs 2.7 tons - you lift that for warm-up!",
        category: "nature"
    },
    {
        name: "Argentinosaurus",
        icon: "🦕",
        weightKg: 70000000,
        weightDesc: "70,000 tons",
        description: "Largest known land animal (dinosaur)",
        funFact: "Lived 95 million years ago - your strength is timeless!",
        category: "nature"
    },
    {
        name: "T-Rex",
        icon: "🦖",
        weightKg: 9000,
        weightDesc: "9 tons",
        description: "King of the dinosaurs",
        funFact: "Bite force of 12,800 pounds - your grip strength rivals it!",
        category: "nature"
    },
    {
        name: "Giant Sequoia",
        icon: "🌲",
        weightKg: 2000000,
        weightDesc: "2,000 tons",
        description: "Largest tree species on Earth",
        funFact: "General Sherman tree - you're the general of the gym!",
        category: "nature"
    },
    {
        name: "African Elephant",
        icon: "🐘",
        weightKg: 6000,
        weightDesc: "6 tons",
        description: "Largest living land animal",
        funFact: "Can lift 300kg with its trunk - you lift way more!",
        category: "nature"
    }
];

// 🏋️ HUMAN SCALE - For single PR comparisons (20-200kg range)
const HUMAN_SCALE_OBJECTS: GiantObject[] = [
    // People
    {
        name: "Average Adult Male",
        icon: "👨",
        weightKg: 75,
        weightDesc: "75 kg",
        description: "Typical adult male weight",
        funFact: "You're lifting a whole person! Impressive strength!",
        category: "human_scale"
    },
    {
        name: "Average Adult Female",
        icon: "👩",
        weightKg: 65,
        weightDesc: "65 kg",
        description: "Typical adult female weight",
        funFact: "That's a person-sized weight! You're crushing it!",
        category: "human_scale"
    },
    {
        name: "Arnold Schwarzenegger (Prime)",
        icon: "💪",
        weightKg: 107,
        weightDesc: "107 kg",
        description: "7x Mr. Olympia, bodybuilding legend",
        funFact: "You're lifting more than Arnold's competition weight!",
        category: "human_scale"
    },
    {
        name: "Dwayne 'The Rock' Johnson",
        icon: "🪨",
        weightKg: 118,
        weightDesc: "118 kg",
        description: "Professional wrestler and actor",
        funFact: "The People's Champion would be proud of this lift!",
        category: "human_scale"
    },
    {
        name: "Eddie Hall (World's Strongest Man)",
        icon: "🏆",
        weightKg: 164,
        weightDesc: "164 kg",
        description: "2017 World's Strongest Man winner",
        funFact: "500kg deadlift world record holder - you're following his path!",
        category: "human_scale"
    },
    {
        name: "Hafthor Bjornsson (The Mountain)",
        icon: "🗻",
        weightKg: 180,
        weightDesc: "180 kg",
        description: "Actor, World's Strongest Man winner",
        funFact: "Game of Thrones' The Mountain - you're reaching legendary status!",
        category: "human_scale"
    },
    // Animals
    {
        name: "Gray Wolf",
        icon: "🐺",
        weightKg: 40,
        weightDesc: "40 kg",
        description: "Large alpha male wolf",
        funFact: "You're lifting an apex predator! Alpha energy!",
        category: "human_scale"
    },
    {
        name: "German Shepherd",
        icon: "🐕",
        weightKg: 35,
        weightDesc: "35 kg",
        description: "Large working dog breed",
        funFact: "A strong loyal companion - just like your spotter!",
        category: "human_scale"
    },
    {
        name: "Golden Retriever",
        icon: "🦮",
        weightKg: 30,
        weightDesc: "30 kg",
        description: "Popular family dog",
        funFact: "Man's best friend - your strength is their entire weight!",
        category: "human_scale"
    },
    {
        name: "Cheetah",
        icon: "🐆",
        weightKg: 60,
        weightDesc: "60 kg",
        description: "Fastest land animal",
        funFact: "0-60mph in 3 seconds - your lift was just as explosive!",
        category: "human_scale"
    },
    {
        name: "Leopard",
        icon: "🐆",
        weightKg: 70,
        weightDesc: "70 kg",
        description: "Powerful big cat",
        funFact: "Can drag prey 3x its weight up a tree - you're that strong!",
        category: "human_scale"
    },
    {
        name: "Kangaroo",
        icon: "🦘",
        weightKg: 85,
        weightDesc: "85 kg",
        description: "Large red kangaroo",
        funFact: "Can jump 3x their body length - you're jumping to new PRs!",
        category: "human_scale"
    },
    {
        name: "Mountain Lion",
        icon: "🦁",
        weightKg: 100,
        weightDesc: "100 kg",
        description: "Powerful North American predator",
        funFact: "Can take down prey 4x their size - beast mode!",
        category: "human_scale"
    },
    {
        name: "Wild Boar",
        icon: "🐗",
        weightKg: 100,
        weightDesc: "100 kg",
        description: "Fierce wild pig",
        funFact: "Known for explosive power - just like your lift!",
        category: "human_scale"
    },
    {
        name: "Black Bear",
        icon: "🐻",
        weightKg: 135,
        weightDesc: "135 kg",
        description: "Medium-sized North American bear",
        funFact: "Can flip 300+ pound rocks - you're bear-strong!",
        category: "human_scale"
    },
    {
        name: "Panda",
        icon: "🐼",
        weightKg: 110,
        weightDesc: "110 kg",
        description: "Giant panda bear",
        funFact: "Eats 12+ hours a day - you earned this meal!",
        category: "human_scale"
    },
    {
        name: "Reindeer",
        icon: "🦌",
        weightKg: 100,
        weightDesc: "100 kg",
        description: "Large Arctic deer",
        funFact: "Pulls Santa's sleigh - you're pulling serious weight!",
        category: "human_scale"
    },
    // Sports equipment
    {
        name: "Bobsled (2-person)",
        icon: "🛷",
        weightKg: 170,
        weightDesc: "170 kg",
        description: "Olympic bobsled",
        funFact: "Hits 90+ mph - your lift had that explosive power!",
        category: "human_scale"
    },
    {
        name: "Rowing Shell (8-person)",
        icon: "🚣",
        weightKg: 100,
        weightDesc: "100 kg",
        description: "Olympic racing shell",
        funFact: "Crew teams train 6+ hours daily - you put in the work too!",
        category: "human_scale"
    },
    {
        name: "Shot Put (16lb)",
        icon: "⚪",
        weightKg: 7.26,
        weightDesc: "7.26 kg",
        description: "Men's Olympic shot put",
        funFact: "World record: 23.12m - you're throwing up serious weight!",
        category: "human_scale"
    },
    {
        name: "Olympic Barbell + Plates (315lb)",
        icon: "🏋️",
        weightKg: 143,
        weightDesc: "143 kg",
        description: "Three plates per side setup",
        funFact: "The classic '3 plates' milestone - you're in the club!",
        category: "human_scale"
    },
    // Everyday objects
    {
        name: "Refrigerator",
        icon: "❄️",
        weightKg: 150,
        weightDesc: "150 kg",
        description: "Full-size home refrigerator",
        funFact: "Moving day? You could lift this solo!",
        category: "human_scale"
    },
    {
        name: "Washing Machine",
        icon: "🧺",
        weightKg: 70,
        weightDesc: "70 kg",
        description: "Standard washing machine",
        funFact: "Spin cycle strong - just like your core!",
        category: "human_scale"
    },
    {
        name: "Motorcycle",
        icon: "🏍️",
        weightKg: 200,
        weightDesc: "200 kg",
        description: "Average sport motorcycle",
        funFact: "You're lifting a Harley! That's legendary!",
        category: "human_scale"
    },
    {
        name: "Large TV (85 inch)",
        icon: "📺",
        weightKg: 55,
        weightDesc: "55 kg",
        description: "Big screen TV",
        funFact: "That's a big screen - and an even bigger lift!",
        category: "human_scale"
    },
    {
        name: "Bag of Cement",
        icon: "🧱",
        weightKg: 50,
        weightDesc: "50 kg",
        description: "Standard construction cement bag",
        funFact: "Construction workers respect this weight!",
        category: "human_scale"
    },
    {
        name: "Filled Water Cooler",
        icon: "💧",
        weightKg: 20,
        weightDesc: "20 kg",
        description: "Office water jug",
        funFact: "Stay hydrated - you earned it!",
        category: "human_scale"
    },
    {
        name: "Gym Dumbbell Rack",
        icon: "🏋️",
        weightKg: 100,
        weightDesc: "100 kg",
        description: "Rack with full dumbbell set",
        funFact: "You're lifting the whole rack!",
        category: "human_scale"
    },
    {
        name: "Keg of Beer (full)",
        icon: "🍺",
        weightKg: 72,
        weightDesc: "72 kg",
        description: "Standard half-barrel keg",
        funFact: "Time to celebrate this PR! Responsibly!",
        category: "human_scale"
    }
];

// Combine all objects
const ALL_GIANT_OBJECTS = [
    ...SPACE_OBJECTS,
    ...MILITARY_OBJECTS,
    ...ENGINEERING_OBJECTS,
    ...TRANSPORT_OBJECTS,
    ...NATURE_OBJECTS,
    ...HUMAN_SCALE_OBJECTS
];

/**
 * Get random giant objects for comparison
 * Returns objects where the count is reasonable (0.01 to 1000)
 */
export function getGiantComparisons(totalTons: number, count: number = 3): Array<{
    object: GiantObject;
    count: number;
    countFormatted: string;
}> {
    const totalKg = totalTons * 1000;
    const results: Array<{ object: GiantObject; count: number; countFormatted: string }> = [];
    
    // Shuffle objects for variety
    const shuffled = [...ALL_GIANT_OBJECTS].sort(() => 0.5 - Math.random());
    
    for (const obj of shuffled) {
        if (results.length >= count) break;
        
        const exactCount = totalKg / obj.weightKg;
        
        // Only include if count is visually meaningful (0.01 to 1000)
        if (exactCount >= 0.01 && exactCount <= 1000) {
            let countFormatted: string;
            
            if (exactCount < 1) {
                countFormatted = `${(exactCount * 100).toFixed(1)}%`;
            } else if (exactCount < 10) {
                countFormatted = exactCount.toFixed(2);
            } else if (exactCount < 100) {
                countFormatted = exactCount.toFixed(1);
            } else {
                countFormatted = Math.round(exactCount).toString();
            }
            
            results.push({
                object: obj,
                count: exactCount,
                countFormatted
            });
        }
    }
    
    return results;
}

/**
 * Get single impressive comparison (best for small displays)
 */
export function getBestGiantComparison(totalTons: number): {
    object: GiantObject;
    count: number;
    countFormatted: string;
} | null {
    const comparisons = getGiantComparisons(totalTons, 10);
    if (comparisons.length === 0) return null;
    
    // Prefer counts between 1 and 100 for best visual impact
    const best = comparisons.find(c => c.count >= 1 && c.count <= 100) || 
                 comparisons.find(c => c.count >= 0.1 && c.count < 1) ||
                 comparisons[0];
    
    return best;
}

/**
 * Get category-specific comparisons
 */
export function getComparisonsByCategory(
    totalTons: number, 
    category: GiantObject['category'], 
    count: number = 2
) {
    const categoryObjects = ALL_GIANT_OBJECTS.filter(o => o.category === category);
    const totalKg = totalTons * 1000;
    
    return categoryObjects
        .map(obj => {
            const exactCount = totalKg / obj.weightKg;
            let countFormatted: string;
            
            if (exactCount < 1) {
                countFormatted = `${(exactCount * 100).toFixed(1)}%`;
            } else if (exactCount < 10) {
                countFormatted = exactCount.toFixed(2);
            } else if (exactCount < 100) {
                countFormatted = exactCount.toFixed(1);
            } else {
                countFormatted = Math.round(exactCount).toString();
            }
            
            return { object: obj, count: exactCount, countFormatted };
        })
        .filter(c => c.count >= 0.01 && c.count <= 1000)
        .slice(0, count);
}

export { ALL_GIANT_OBJECTS, SPACE_OBJECTS, MILITARY_OBJECTS, ENGINEERING_OBJECTS, TRANSPORT_OBJECTS, NATURE_OBJECTS };
