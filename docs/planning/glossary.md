# Glossary

- **Talent UUID**: Canonical unique identifier for a user across systems.
- **Account**: External account linked to a user (wallet, Farcaster, GitHub).
- **Handle**: Public, human-readable identifier (e.g., Farcaster fname, ENS).
- **Credential**: Talent API data point scored within a Score.
- **Score**: Aggregate of Credentials representing overall builder status.
- **Readable Value**: Display-friendly formatted value from Talent API.
- **UOM**: Unit of measure, displayed with the readable value.
- **API Client**: Abstraction over external APIs with validation and retries.
- **Service**: Domain logic and data transformation module.
- **Route Handler**: HTTP endpoint under `app/api/*` used by clients/webhooks.
- **Hook**: Client-side data fetching/state logic.
- **Server Component**: Default Next.js component executed on the server.
- **Cache Tag**: Named key to group cached responses for invalidation.
