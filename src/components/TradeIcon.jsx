import {
  Sparkles, Baby, Car, ChefHat, Zap, Wrench, Leaf, ShieldCheck, Boxes,
  Hammer, Truck, Scissors, Shirt, Utensils, Dog, GraduationCap, Stethoscope,
  Paintbrush, Droplets, Wind, Flame, Sun, Building2, Package, Camera, Laptop,
  Music, Palette, BookOpen, HeartPulse, Bike, Warehouse, Key, Baseline,
} from 'lucide-react'

/**
 * Icônes proposées à l'administration pour une catégorie de métier.
 * Le nom est stocké tel quel dans `trade_settings.icon` : ajouter une entrée
 * ici suffit à l'offrir au choix, sans migration.
 */
const MAP = {
  Sparkles, Baby, Car, ChefHat, Zap, Wrench, Leaf, ShieldCheck, Boxes,
  Hammer, Truck, Scissors, Shirt, Utensils, Dog, GraduationCap, Stethoscope,
  Paintbrush, Droplets, Wind, Flame, Sun, Building2, Package, Camera, Laptop,
  Music, Palette, BookOpen, HeartPulse, Bike, Warehouse, Key, Baseline,
}

export const ICON_NAMES = Object.keys(MAP)

export default function TradeIcon({ name, className = 'h-5 w-5' }) {
  const Cmp = MAP[name] || Boxes
  return <Cmp className={className} strokeWidth={1.5} />
}
