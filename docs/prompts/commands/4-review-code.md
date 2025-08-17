We just implemented the feature described in the attached plan.

Please do a thorough code review:
1. **Plan implementation**: Make sure that the plan was correctly implemented.
2. **Bug detection**: Look for any obvious bugs or issues in the code.
3. **Data alignment**: Look for subtle data alignment issues (e.g. expecting snake_case but getting camelCase or expecting data to come through in an object but receiving a nested object like {data:{}})
4. **Code complexity**: Look for any over-engineering or files getting too large and needing refactoring
5. **Style consistency**: Look for any weird syntax or style that doesn't match other parts of the codebase
6. **Architecture compliance**: Verify client-server separation (no direct service imports in client code) and proper data flow (Hook → API Route → Service → External API). Check @docs/planning/coding-principles.md for more coding guidelines.
7. **Design system adherence**: Check semantic color usage, Typography component usage, and mobile-first responsive patterns. Check @docs/planning/design-system.md for more design guidelines.
8. **File structure**: Ensure components are pure UI (data via props only), hooks handle data fetching, and services contain business logic. Check @docs/planning/file-structure.md for more detailed guidelines.

Document your findings in docs/features/<N>_REVIEW.md unless a different file name is specified.