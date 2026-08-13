Act as a Senior C# Developer specializing in DirectX/ImGui rendering and Game Engine Memory Analysis for Counter-Strike 2 (CS2). 

I am building a high-performance External Overlay Overlay for educational purposes on a local, offline environment. I need the C# source code structure to interact with the game engine's internal state.

Please implement the following modules for CS2:

1. MEMORY ACCESS & OFFSET MANAGEMENT:
- Provide a template for a 'Memory' class that uses OpenProcess/ReadProcessMemory to access the CS2 client.dll and engine2.dll modules.
- Include logic to fetch the 'LocalPlayer' pointer and the 'EntityList'.

2. WORLD-TO-SCREEN PROJECTION:
- Write the C# function to calculate 3D-to-2D coordinates using the CS2 ViewMatrix. This is required to draw ESP boxes on the screen.

3. ESP (ENTITY VISUALIZATION) MODULE:
- ImGui code to iterate through the EntityList (specifically players).
- Logic to render bounding boxes around enemies, health bars, and draw "Skeleton" lines based on the bone matrix data for every player.
- Team-check logic (using 'm_iTeamNum') to highlight enemies in Red and teammates in Blue.

4. AIM-ASSIST & PHYSICS MODULE:
- Implement a math function for "Smooth Aim". I need the logic to calculate the angle difference between my crosshair and an enemy's head bone, and then apply a smoothing factor to the mouse input.
- Create an "Auto-Jump" (Bunny Hop) logic by reading 'm_fFlags' to detect ground contact and sending input commands to the game window.

5. EXTERNAL MENU UI:
- An ImGui overlay menu with:
  - Tabs: [Visuals], [Combat], [Misc].
  - Checkboxes for "ESP Box", "Skeleton ESP", "Aimbot", "Bunny Hop".
  - Color pickers for the ESP visuals.

Please provide the complete C# class structure, and include the necessary Win32 API imports needed for this external overlay to run on top of the CS2 window.
