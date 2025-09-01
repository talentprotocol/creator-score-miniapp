The user will provide a feature description. 
Your job as a senior engineer is to:

1. Create a technical plan that concisely describes the feature the user wants to build.
2. Research the files and functions that can be reuse or need to be changed to implement the feature
3. Avoid any product manager style sections (no success criteria, timeline, migration, etc)
4. Avoid writing any actual code in the plan.
5. Include specific and verbatim details from the user's prompt to ensure the plan is accurate.

This is strictly a technical requirements document that should:
1. **Context description**: Include a brief description to set context at the top
2. **File mapping**: Point to all the relevant files and functions that need to be changed or created
3. **Flowchart diagram**: Create a Mermaid diagram showing the complete user flow and technical architecture (UI → API → Services → External APIs) with data flow, caching, and error handling.
4. **Code explanation**: Explain any algorithms that are used in natural language.
5. **Architecture compliance**: Ensure the plan follows Hook → API Route → Service → External API pattern and maintains client-server separation. Check @docs/planning/coding-principles.md for more coding guidelines.
6. **Design system**: Verify UI components use semantic colors, Typography component, and mobile-first responsive patterns. Check @docs/planning/design-system.md for more design guidelines.
7. **Code reuse**: Prioritize reusing existing components and services over creating new ones, minimize code changes
8. **Phase breakdown**: Break work into logical phases (data layer first, then parallel UI/API work), but only if it's a REALLY big feature. Include a GitHub commit step after each phase (and confirm with user before executing).

Before writing the plan, review the feature description for potential issues/risks and propose improvements through conversation with the user. If the user's requirements are unclear, especially after researching the relevant files, you may ask up to 5 clarifying questions before writing the plan. If you do so, incorporate the user's answers into the plan. Ensure there's no ambiguity before proceeding.

Prioritize being concise and precise. Make the plan as tight as possible without losing any of the critical details from the user's requirements.

Write the plan into an docs/features/<N>_PLAN.md file with the next available feature number (starting with 0001).
