import {
    Globe, Sparkles, Sun, Star, Moon, Map, Compass, Mountain, Waves,
    Droplets, Droplet, Crown, Flag, Layers, Trees, Building2, Home,
    Tent, Skull, Landmark, HelpCircle, Anchor, Sword, Cross, Pickaxe,
    Shield, Flame, Wind, Snowflake, Fish, Eye, ZapOff, LayoutGrid
} from "lucide-react";

export const LOCATION_TYPES = [
    {
        group: "Space / Celestial Object",
        items: [
            { value: "Universe", label: "Universe", icon: Globe },
            { value: "Galaxy", label: "Galaxy", icon: Sparkles },
            { value: "Nebula", label: "Nebula", icon: Sparkles },
            { value: "Solar System", label: "Solar System", icon: Sun },
            { value: "Star", label: "Star / Sun", icon: Star },
            { value: "Planet", label: "Planet", icon: Globe },
            { value: "Moon", label: "Moon / Satellite", icon: Moon },
            { value: "Asteroid Field", label: "Asteroid Field / Belt", icon: Sparkles },
            { value: "Black Hole", label: "Black Hole", icon: ZapOff },
            { value: "Wormhole", label: "Wormhole / Portal", icon: Eye },
            { value: "Space Station", label: "Space Station", icon: LayoutGrid },
            { value: "Other Space", label: "Other Celestial Object", icon: Globe },
        ],
    },
    {
        group: "Land Geography",
        items: [
            { value: "Continent", label: "Continent", icon: Map },
            { value: "Island", label: "Island", icon: Compass },
            { value: "Peninsula", label: "Peninsula / Isthmus", icon: Compass },
            { value: "Plateau", label: "Plateau / Mesa", icon: Mountain },
            { value: "Valley", label: "Valley / Canyon", icon: Mountain },
            { value: "Plain", label: "Plain / Meadow", icon: Map },
            { value: "Tundra", label: "Tundra / Arctic", icon: Snowflake },
            { value: "Badlands", label: "Badlands / Crater", icon: Flame },
            { value: "Cliffs", label: "Cliffs / Escarpment", icon: Mountain },
        ],
    },
    {
        group: "Wetlands",
        items: [
            { value: "Swamp", label: "Swamp / Bog", icon: Droplets },
            { value: "Marsh", label: "Marsh / Wetland", icon: Droplets },
            { value: "Mangrove", label: "Mangrove", icon: Trees },
        ],
    },
    {
        group: "Body of Water",
        items: [
            { value: "Ocean", label: "Ocean / Sea", icon: Waves },
            { value: "Bay", label: "Bay / Gulf / Strait", icon: Waves },
            { value: "Lake", label: "Lake / Pond", icon: Droplets },
            { value: "River", label: "River / Stream", icon: Droplet },
            { value: "Waterfall", label: "Waterfall", icon: Droplet },
            { value: "Glacier", label: "Glacier / Ice Sheet", icon: Snowflake },
        ],
    },
    {
        group: "Underwater",
        items: [
            { value: "Reef", label: "Reef / Coral", icon: Fish },
            { value: "UnderwaterCave", label: "Underwater Cave", icon: Compass },
            { value: "Trench", label: "Ocean Trench / Abyss", icon: Waves },
            { value: "SunkenCity", label: "Sunken City / Wreck", icon: Anchor },
        ],
    },
    {
        group: "Underground",
        items: [
            { value: "Cave", label: "Cave / Cavern", icon: Compass },
            { value: "Catacomb", label: "Catacomb / Tomb", icon: Skull },
            { value: "Tunnel", label: "Tunnel Network", icon: Layers },
            { value: "Underdark", label: "Underdark / Deep", icon: Eye },
        ],
    },
    {
        group: "Natural Landmarks",
        items: [
            { value: "Mountain", label: "Mountain / Peak", icon: Mountain },
            { value: "Volcano", label: "Volcano", icon: Flame },
            { value: "Forest", label: "Forest / Jungle", icon: Trees },
            { value: "Desert", label: "Desert / Wasteland", icon: Sun },
            { value: "HotSpring", label: "Hot Spring / Geyser", icon: Wind },
        ],
    },
    {
        group: "Political",
        items: [
            { value: "Empire", label: "Empire / Federation", icon: Crown },
            { value: "Kingdom", label: "Kingdom / Realm", icon: Crown },
            { value: "Country", label: "Country / State", icon: Flag },
            { value: "Colony", label: "Colony / Territory", icon: Flag },
            { value: "Province", label: "Province / Prefecture", icon: Layers },
            { value: "Tribe", label: "Tribe / Clan", icon: Tent },
            { value: "Region", label: "Region", icon: Map },
        ],
    },
    {
        group: "Settlements",
        items: [
            { value: "City", label: "City / Metropolis", icon: Building2 },
            { value: "Town", label: "Town", icon: Home },
            { value: "Village", label: "Village", icon: Tent },
            { value: "Camp", label: "Camp / Outpost", icon: Tent },
            { value: "Port", label: "Port / Harbor", icon: Anchor },
        ],
    },
    {
        group: "Structures",
        items: [
            { value: "Castle", label: "Castle / Fortress", icon: Shield },
            { value: "Temple", label: "Temple / Shrine", icon: Cross },
            { value: "Tower", label: "Tower / Lighthouse", icon: Building2 },
            { value: "Prison", label: "Prison / Dungeon", icon: Skull },
            { value: "Mine", label: "Mine / Quarry", icon: Pickaxe },
            { value: "Building", label: "Building (Generic)", icon: Building2 },
        ],
    },
    {
        group: "Landmarks & Points of Interest",
        items: [
            { value: "Monument", label: "Monument / Landmark", icon: Landmark },
            { value: "Battlefield", label: "Battlefield", icon: Sword },
            { value: "Graveyard", label: "Graveyard / Necropolis", icon: Skull },
            { value: "Ruin", label: "Ruin / Abandoned Site", icon: Landmark },
            { value: "Crossroads", label: "Crossroads / Waypoint", icon: Compass },
            { value: "Other", label: "Other", icon: HelpCircle },
        ],
    },
    {
        group: "Planar / Dimensional",
        items: [
            { value: "AstralPlane", label: "Astral Plane", icon: Eye },
            { value: "SpiritRealm", label: "Spirit Realm", icon: Sparkles },
            { value: "PocketDimension", label: "Pocket Dimension", icon: ZapOff },
            { value: "Void", label: "Void / The Between", icon: ZapOff },
        ],
    },
];

export default LOCATION_TYPES;
