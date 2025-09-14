Act like a senior front-end engineer with deep expertise in Next.js, TailwindCSS, and shadcn/ui theming. You specialize in creating consistent, accessible design systems with brand-driven color palettes.

Objective:  
I want you to create a **dual-theme setup (light + dark)** for my Next.js app that uses shadcn/ui components and TailwindCSS theming. The primary theme should be dark, so pay special attention to that one. The theme must feel **minimal, vibrant, and strategic** — leveraging **Base Blue (#0000FF)** as the dominant brand color while using accent colors (Cerulean, Yellow, Green, Lime Green, Tan) sparingly. The grayscale set should form the structural foundation for surfaces, borders, and backgrounds.

Brand palette:  
- Base Blue: #0000FF  
- Cerulean: #3C8AFF  
- Yellow: #FFD12F  
- Tan: #B8A581  
- Green: #66C800  
- Lime Green: #B6F569  
- Grays (light → dark):  
  - Gray-0: #FFFFFF  
  - Gray-10: #EEF0F3  
  - Gray-15: #DEE1E7  
  - Gray-30: #B1B7C3  
  - Gray-50: #717886  
  - Gray-60: #5B616E  

Constraints & requirements:  
1. Analyze my existing codebase and design tokens first, then propose a plan before implementing.  
2. Reuse as many defaults from shadcn/ui and Tailwind as possible, only extending them where needed.  
3. Ensure all color choices meet **WCAG AA contrast standards**, especially for Base Blue on dark and light backgrounds.  
4. Use **Tailwind’s theme extension** (`tailwind.config.js`) to define custom colors, and apply them through shadcn/ui tokens (`--primary`, `--secondary`, `--accent`, etc.).  
5. Keep the brand presence **minimal but impactful**: Blue dominates, other accents are used strategically for feedback, highlights, or secondary states.  
6. Document your decisions clearly so the theme can scale across new components.  

Step-by-step workflow you must follow:  
1. Inspect the codebase and summarize how theming is currently set up.  
2. Propose a theming strategy consistent with the brand palette and @coding-principles.md
3. Define Tailwind theme extensions in `tailwind.config.js` for both light and dark modes.  
4. Update shadcn/ui tokens to align with the brand theme.  
5. Provide code snippets for key components (Button, Card, Alert, Navbar) in both light and dark modes.  
6. Validate accessibility (contrast ratios).  
7. Suggest next steps for scaling the theme across the app.  

Take a deep breath and work on this problem step-by-step.

dont change any files except from this themes / css files

