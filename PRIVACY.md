# Privacy Policy

**Is It Safe? — Travel Safety**  
*Last Updated: March 2026*

## Overview

Is It Safe? is a travel safety tool that provides real-time safety data for cities and countries, including official government travel advisories, conflict data, and news analysis. The widget runs in your browser within ChatGPT's sandboxed iframe. We are committed to protecting your privacy and being transparent about our data practices.

## Data Collection

### What We Collect

We follow the principle of **collection minimization** — we gather only the minimum data required to perform the tool's function.

- **Search queries**: The city, country, or region names you search for (as provided by you via the tool's input parameters). These are used solely to retrieve relevant safety data and are not linked to your identity.
- **Usage analytics**: Anonymous, aggregated usage data limited to: tool invocation counts, response times, and event types (e.g., "search", "vote"). No personally identifiable information is included.
- **Session data**: Temporary session identifiers for MCP connection management, discarded when the session ends.
- **Error logs**: Anonymous error messages (without user data) to improve reliability.
- **Email address** (optional, only if you subscribe to alerts): If you opt in to location safety alerts via Buttondown, your email address and chosen alert topics are stored by Buttondown (our third-party email provider) to deliver those alerts.
- **Community sentiment votes** (optional): Anonymous safe/unsafe votes per location, with no user identifiers attached.

### What We Do NOT Collect

- Personal identification information (name, physical address, government IDs)
- Financial or payment information
- Health information
- Precise user location or GPS coordinates
- User-agent strings, IP addresses, or device information
- Chat history, conversation transcripts, prompt text, or any text from the user's conversation with ChatGPT
- Browsing history or behavioral profiles
- Locale, language, or timezone information
- Any data from OpenAI's `_meta` context (e.g., `openai/userLocation`, `openai/locale`, `openai/userAgent`)

### Data Returned in Tool Responses

The tool response sent back to ChatGPT contains only:
- **Location fields**: The city, country, or region relevant to your query (as explicitly provided by the model in the tool's input parameters — not inferred from chat text)
- **Ready flag**: A boolean indicating the widget is ready

No diagnostic metadata, session identifiers, timestamps, user-agent strings, device categories, locale information, tracking fields, or any user-related data are included in tool responses.

### Data Boundaries

In compliance with OpenAI's App Submission Guidelines:
- We do **not** request or use raw location fields from the client's side channel (e.g., `openai/userLocation`). Location is obtained only from the tool's explicit input parameters.
- We do **not** pull, reconstruct, or infer the user's chat log. We operate only on the explicit `location`, `country`, and `city` parameters the model provides via the tool call.
- We do **not** read `openai/userAgent`, `openai/locale`, or any other user context metadata from MCP `_meta`.

## Data Processing

Safety data retrieval and display is performed:
- **Client-side**: The widget renders safety data in your browser within ChatGPT's sandboxed iframe
- **Server-side**: Our server fetches safety data from public government and open-data APIs on your behalf (US State Department, UK Foreign Office, ACLED, GDELT)
- **Ephemerally**: No user-specific data is persisted on our servers beyond anonymous analytics logs

## Third-Party Data Sources

We retrieve publicly available safety data from:
- **US State Department**: Travel advisories
- **UK Foreign, Commonwealth & Development Office**: Travel advice
- **ACLED** (Armed Conflict Location & Event Data): Conflict event data
- **GDELT** (Global Database of Events, Language, and Tone): News analysis
- **Nominatim/OpenStreetMap**: Location geocoding (no user data is sent, only location query strings)

These services have their own privacy policies. We do not share any user data with them — only the location query string necessary to retrieve safety data.

## Third-Party Services

- **Buttondown** (email alerts): If you subscribe to alerts, your email address and topic preferences are stored by Buttondown under their [privacy policy](https://buttondown.email/privacy). You can unsubscribe at any time.

## Data Storage

- **Server logs**: Anonymous analytics logs (tool invocation counts, response times, event types) are retained for up to 30 days, then deleted.
- **Sentiment data**: Anonymous community votes are stored on the server with no user identifiers.
- **Email subscriptions**: Managed by Buttondown; you can unsubscribe at any time.

## Third-Party Sharing

We do not sell, rent, or share your data with third parties for marketing or advertising purposes. Anonymous, aggregated analytics may be used internally to improve the service.

## Data Retention

- **Server logs**: Retained for up to 30 days, then automatically deleted
- **Sentiment votes**: Retained indefinitely as anonymous, aggregated data
- **Email subscriptions**: Retained by Buttondown until you unsubscribe

## Your Rights

You can:
- Use the tool without providing any personal information
- Unsubscribe from email alerts at any time
- Contact us to request deletion of any data associated with your email
- Clear your browser's localStorage at any time

## Security

- All communications use HTTPS encryption
- The widget runs in a sandboxed iframe with strict Content Security Policy
- No sensitive personal data is transmitted or stored on our servers
- Server-side logs contain no personally identifiable information

## Children's Privacy

This service is not directed at children under 13. We do not knowingly collect information from children.

## Changes to This Policy

We may update this policy periodically. Significant changes will be noted in the app documentation.

## Contact

For privacy questions, support, or data deletion requests:
- **Email**: support@layer3labs.io
- **Deletion requests**: Include the UTC timestamp of your ChatGPT session; we will delete associated logs within 7 business days.

**Note:** Please contact us via email for all support inquiries. GitHub issues are not monitored for support requests.

---

*This privacy policy complies with OpenAI's ChatGPT App Submission Guidelines.*
