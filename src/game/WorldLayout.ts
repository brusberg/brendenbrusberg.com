/**
 * WorldLayout - Defines positions of all game world elements
 * 
 * EXPANDED WORLD (4800x3600) - 3x scale for readability
 * 
 * Layout:
 *                              [Resume - top right]
 *                                    
 *     [Projects]    [Fountain]     
 *          \            |         
 *           \   [LightSwitch][Stats]
 *            \          |          
 *   [House]---[Wizard]--[YOU]------
 *                  \     |     
 *            [Gallery] [Inspo] [Mentors]
 *                   \    |    /
 *               [Trees/Grass/Flowers]
 */

import type { Vector2 } from '@/types';

// World dimensions (2x original for more exploration space)
export const WORLD_WIDTH = 4800;
export const WORLD_HEIGHT = 3600;

// Center of the world (player spawn point)
export const WORLD_CENTER: Vector2 = {
  x: WORLD_WIDTH / 2,
  y: WORLD_HEIGHT / 2,
};

// Main interactive locations
export interface WorldLocation {
  id: string;
  position: Vector2;
  type: 'interactive' | 'decoration' | 'todo';
  label?: string;
}

/**
 * Interactive elements the player can interact with
 * Positions scaled and spread out for larger world
 */
export const INTERACTIVE_LOCATIONS: WorldLocation[] = [
  // Light switch - near center, slightly above and left
  {
    id: 'lightswitch',
    position: { x: WORLD_CENTER.x - 100, y: WORLD_CENTER.y - 150 },
    type: 'interactive',
    label: 'Light Switch',
  },
  // Resume - top right area
  {
    id: 'resume',
    position: { x: WORLD_CENTER.x + 900, y: WORLD_CENTER.y - 600 },
    type: 'interactive',
    label: 'Resume',
  },
  // Wizard - left of center
  {
    id: 'wizard',
    position: { x: WORLD_CENTER.x - 500, y: WORLD_CENTER.y },
    type: 'interactive',
    label: 'Wizard Battle',
  },
  // Fountain - center top area
  {
    id: 'fountain',
    position: { x: WORLD_CENTER.x, y: WORLD_CENTER.y - 400 },
    type: 'decoration',
    label: 'Fountain',
  },
  // Stats Billboard - to the right of the light switch
  {
    id: 'statsbillboard',
    position: { x: WORLD_CENTER.x + 250, y: WORLD_CENTER.y - 150 },
    type: 'decoration',
    label: 'Stats',
  },
];

/**
 * TODO areas - Coming soon sections (spread out more)
 */
export const TODO_LOCATIONS: WorldLocation[] = [
  // Projects - upper left
  {
    id: 'projects',
    position: { x: WORLD_CENTER.x - 700, y: WORLD_CENTER.y - 500 },
    type: 'todo',
    label: 'Projects',
  },
  // Art/Poetry Gallery - south left
  {
    id: 'gallery',
    position: { x: WORLD_CENTER.x - 400, y: WORLD_CENTER.y + 500 },
    type: 'todo',
    label: 'Art & Poetry',
  },
  // House - far left
  {
    id: 'house',
    position: { x: WORLD_CENTER.x - 1000, y: WORLD_CENTER.y },
    type: 'todo',
    label: 'House',
  },
  // Inspiration - south center
  {
    id: 'inspiration',
    position: { x: WORLD_CENTER.x, y: WORLD_CENTER.y + 500 },
    type: 'todo',
    label: 'Inspiration',
  },
  // Mentors - south right
  {
    id: 'mentors',
    position: { x: WORLD_CENTER.x + 400, y: WORLD_CENTER.y + 500 },
    type: 'todo',
    label: 'Mentors',
  },
];

/**
 * Decoration positions (trees, grass, flowers) - spread throughout larger world
 */
export interface DecorationPlacement {
  type: 'tree' | 'grass' | 'flower';
  position: Vector2;
  scale?: number;
}

export const DECORATION_PLACEMENTS: DecorationPlacement[] = [
  // Trees scattered around the world
  { type: 'tree', position: { x: WORLD_CENTER.x - 800, y: WORLD_CENTER.y + 400 } },
  { type: 'tree', position: { x: WORLD_CENTER.x + 800, y: WORLD_CENTER.y + 350 } },
  { type: 'tree', position: { x: WORLD_CENTER.x - 600, y: WORLD_CENTER.y + 700 } },
  { type: 'tree', position: { x: WORLD_CENTER.x + 500, y: WORLD_CENTER.y + 650 } },
  { type: 'tree', position: { x: WORLD_CENTER.x - 300, y: WORLD_CENTER.y + 800 } },
  { type: 'tree', position: { x: WORLD_CENTER.x + 200, y: WORLD_CENTER.y + 760 } },
  { type: 'tree', position: { x: WORLD_CENTER.x - 1100, y: WORLD_CENTER.y - 200 } },
  { type: 'tree', position: { x: WORLD_CENTER.x + 1200, y: WORLD_CENTER.y - 100 } },
  { type: 'tree', position: { x: WORLD_CENTER.x - 400, y: WORLD_CENTER.y - 800 } },
  { type: 'tree', position: { x: WORLD_CENTER.x + 450, y: WORLD_CENTER.y - 850 } },
  { type: 'tree', position: { x: WORLD_CENTER.x - 1200, y: WORLD_CENTER.y + 600 } },
  { type: 'tree', position: { x: WORLD_CENTER.x + 1300, y: WORLD_CENTER.y + 550 } },

  // Grass tufts spread throughout
  { type: 'grass', position: { x: WORLD_CENTER.x - 200, y: WORLD_CENTER.y + 300 } },
  { type: 'grass', position: { x: WORLD_CENTER.x + 160, y: WORLD_CENTER.y + 360 } },
  { type: 'grass', position: { x: WORLD_CENTER.x - 400, y: WORLD_CENTER.y + 500 } },
  { type: 'grass', position: { x: WORLD_CENTER.x + 360, y: WORLD_CENTER.y + 440 } },
  { type: 'grass', position: { x: WORLD_CENTER.x - 100, y: WORLD_CENTER.y + 600 } },
  { type: 'grass', position: { x: WORLD_CENTER.x + 60, y: WORLD_CENTER.y + 560 } },
  { type: 'grass', position: { x: WORLD_CENTER.x - 640, y: WORLD_CENTER.y + 200 } },
  { type: 'grass', position: { x: WORLD_CENTER.x + 700, y: WORLD_CENTER.y + 240 } },
  { type: 'grass', position: { x: WORLD_CENTER.x - 900, y: WORLD_CENTER.y + 600 } },
  { type: 'grass', position: { x: WORLD_CENTER.x + 900, y: WORLD_CENTER.y + 560 } },
  { type: 'grass', position: { x: WORLD_CENTER.x, y: WORLD_CENTER.y + 700 } },
  { type: 'grass', position: { x: WORLD_CENTER.x - 500, y: WORLD_CENTER.y + 360 } },
  { type: 'grass', position: { x: WORLD_CENTER.x + 250, y: WORLD_CENTER.y + 150 } },
  { type: 'grass', position: { x: WORLD_CENTER.x - 150, y: WORLD_CENTER.y + 200 } },
  { type: 'grass', position: { x: WORLD_CENTER.x + 600, y: WORLD_CENTER.y - 200 } },
  { type: 'grass', position: { x: WORLD_CENTER.x - 550, y: WORLD_CENTER.y - 300 } },

  // Flowers near fountain and paths
  { type: 'flower', position: { x: WORLD_CENTER.x - 120, y: WORLD_CENTER.y - 320 } },
  { type: 'flower', position: { x: WORLD_CENTER.x + 120, y: WORLD_CENTER.y - 320 } },
  { type: 'flower', position: { x: WORLD_CENTER.x - 160, y: WORLD_CENTER.y - 450 } },
  { type: 'flower', position: { x: WORLD_CENTER.x + 160, y: WORLD_CENTER.y - 450 } },
  { type: 'flower', position: { x: WORLD_CENTER.x - 60, y: WORLD_CENTER.y + 200 } },
  { type: 'flower', position: { x: WORLD_CENTER.x + 60, y: WORLD_CENTER.y + 200 } },
  { type: 'flower', position: { x: WORLD_CENTER.x - 300, y: WORLD_CENTER.y + 120 } },
  { type: 'flower', position: { x: WORLD_CENTER.x + 300, y: WORLD_CENTER.y + 120 } },
  { type: 'flower', position: { x: WORLD_CENTER.x - 200, y: WORLD_CENTER.y - 600 } },
  { type: 'flower', position: { x: WORLD_CENTER.x + 200, y: WORLD_CENTER.y - 600 } },
  { type: 'flower', position: { x: WORLD_CENTER.x - 80, y: WORLD_CENTER.y - 750 } },
  { type: 'flower', position: { x: WORLD_CENTER.x + 80, y: WORLD_CENTER.y - 750 } },
];

/**
 * Get all locations for a specific type
 */
export function getLocationsByType(type: WorldLocation['type']): WorldLocation[] {
  return [...INTERACTIVE_LOCATIONS, ...TODO_LOCATIONS].filter(loc => loc.type === type);
}

/**
 * Find a location by ID
 */
export function getLocationById(id: string): WorldLocation | undefined {
  return [...INTERACTIVE_LOCATIONS, ...TODO_LOCATIONS].find(loc => loc.id === id);
}

/**
 * Get all world locations
 */
export function getAllLocations(): WorldLocation[] {
  return [...INTERACTIVE_LOCATIONS, ...TODO_LOCATIONS];
}
