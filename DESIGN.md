# MOSSBOUND · 숲의 수호자

The game scene is the main visual: handcrafted pixel spirits inhabit a continuous, dimensional woodland village. The reference direction combines crisp 2D actors, tactile 3D architecture, cinematic light and a miniature lens. No Pokémon assets, names, sprites, or source code are reused.

Palette: forest #244b39, leaf #7fab60, meadow #91a56c, path #c5b88e, timber #71513b, moon #263e53, paper #fffdf5. Keep the existing Korean navigation, compact wordmark and paper controls. Let the landscape carry the visual change; avoid new decorative UI around it.

Actors: original 48×64 raster drawings with stepped outlines and limited palettes. Four directional rows and four walk frames form a 192×256 RGBA atlas. Nearest-neighbor sampling, no mipmaps, and vertical camera-facing planes keep pixels crisp. Moru carries a branch staff beneath moss antlers, Lumi has petal wings and a lantern, Doto wears a spotted mushroom cap and carries a small flask. Enemy silhouettes must be distinguishable by shape as well as color.

World: a 120×120m playable area with rolling ground, a river and three bridges, six cottages, a turning waterwheel, fences, a well, a stone arch, clustered grass and a surrounding forest. Warm timber and plaster give the village a sense of scale. Use instanced trees and grass to keep the expanded landscape affordable. Dither trees that obscure the player during combat.

Lighting: directional sun and shadow, cool hemisphere fill, warm lanterns, true planar river reflections, and restrained HDR bloom. Depth-aware DOF focuses on the player's depth and softly blurs nearer and more distant geometry; never blur the HTML HUD. Moonlight cools the environment while lantern windows and will-o'-wisps glow. Low quality disables postprocessing, real-time reflections and shadow maps.

Camera: a tilted perspective follows the player in combat. The lobby supports orbit/zoom, including an expanded landscape view. Use the minimap to make the enlarged world navigable. Respect reduced-motion preferences for waterwheel and ambient animation. Growth at levels 4 and 7 enlarges the pixel actor and adds rings; retain readable attack and charge telegraphs.

Terrain now forms visible village terraces and highlands rather than only distant hills. Keep the central plaza level, bridge landings low, and building pads flat; use continuous walkable slopes, stone treads and contour colors to communicate elevation. The opening encounter surrounds the player with 18 enemies and regular batches build into large hordes. Spatial separation, particle budgets and lightweight enemy contact shadows preserve readability as the crowd grows.
