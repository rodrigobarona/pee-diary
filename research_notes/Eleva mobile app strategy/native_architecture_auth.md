# Native iOS (Swift/SwiftUI) and Android (Kotlin/Compose) architecture on a Better Auth backend: one app versus two

Research date: 11 November 2026. Shape A = standalone offline-first bladder diary app plus a separate full Eleva Care app. Shape B = one all-in-one app. Primary docs were fetched directly where possible. The web-search budget for this session ran out before every topic was closed, so each section lists what could not be verified. Claims in "Cited Findings" carry a source; anything in "Inferences" is my reasoning and is not sourced.

## 1. Better Auth with native (non-JavaScript) mobile clients

### Takeaway
As of November 2026 Better Auth ships no official Swift or Kotlin SDK; the only native-mobile integration it documents is the Expo (React Native) plugin, and the only Swift client is a small community package. Two server-supported routes exist for Swift/Kotlin: (1) call the REST endpoints directly and use the `bearer` plugin's session token, or (2) turn Better Auth into an OAuth 2.1 authorization server with `@better-auth/oauth-provider` and run Authorization Code + PKCE through ASWebAuthenticationSession / Auth Tab, which gives rotating refresh tokens and standard revocation.

### Cited Findings

Versions and release pace
- Latest stable is v1.7.20 and latest pre-release is v1.8.0-beta.7, both dated "10 Nov" (the releases page does not print the year; given today's date this is presumably 2026). Six stable patch releases (1.7.15 to 1.7.20) shipped between 1 and 10 November — [Better Auth releases](https://github.com/better-auth/better-auth/releases)
- Recent patches are security-relevant for sessions: v1.7.16 "stops revoked sessions staying usable via secondary storage or the cookie cache"; v1.7.15–1.7.19 fix revocation edge cases — [Better Auth releases](https://github.com/better-auth/better-auth/releases)
- v1.8.0 betas contain breaking changes: passkey `userVerification: "required"` now rejects responses lacking user verification and passkey registration requires a session still active in the store (beta.5); OAuth provider adds DPoP key binding for token exchange and rejects repeated parameters in form-POST authorization requests (beta.6) — [Better Auth releases](https://github.com/better-auth/better-auth/releases)
- The release notes contain nothing about Swift, Kotlin, iOS or Android; the closest native item is Electron desktop sign-in — [Better Auth releases](https://github.com/better-auth/better-auth/releases)

Bearer plugin
- It "enables authentication using Bearer tokens as an alternative to browser cookies". After sign-in the client reads a session token from the `set-auth-token` response header and sends it as `Authorization: Bearer` — [Bearer plugin docs](https://www.better-auth.com/docs/plugins/bearer)
- The docs warn to use it with caution: "it is intended only for APIs that don't support cookies or require Bearer tokens" and "Improper implementation could easily lead to security vulnerabilities." The only option is `requireSignature` (default false). The page does not mention mobile or native apps, and its storage example is browser `localStorage` — [Bearer plugin docs](https://www.better-auth.com/docs/plugins/bearer)
- A third-party guide states the bearer plugin handles opaque HMAC session tokens only and does not validate JWTs — [Capgo guide](https://capgo.app/blog/how-to-use-better-auth-in-capacitor-apps/)

JWT plugin (JWKS)
- "This plugin is not meant as a replacement for the session." It exposes `/token` (returns `{ token }`) and a JWKS endpoint at `/jwks` (path configurable) so other services can verify tokens "without the need for an additional verify call or database check" — [JWT plugin docs](https://www.better-auth.com/docs/plugins/jwt)
- Defaults: EdDSA with Ed25519; expiry 15 minutes; key rotation off by default (`rotationInterval` undefined), `gracePeriod` 30 days. Verifiers should check issuer and audience against the base URL and refetch JWKS on an unknown `kid` — [JWT plugin docs](https://www.better-auth.com/docs/plugins/jwt)
- When the OAuth provider or MCP plugin is used, the docs recommend disabling the `/token` endpoint and the `set-auth-jwt` header, because session JWTs share signing keys with OAuth access tokens and a resource server could accept them by mistake — [JWT plugin docs](https://www.better-auth.com/docs/plugins/jwt)

OAuth 2.1 provider / OIDC / MCP plugins
- `@better-auth/oauth-provider` "turns your Better Auth server into an authorization server that implements OAuth 2.1, OpenID Connect Core, and RFC 8414 metadata" — [OAuth Provider docs](https://www.better-auth.com/docs/plugins/oauth-provider)
- Grants: authorization code, client credentials, rotating refresh tokens (issued with `offline_access`); device code via `oauthDeviceAuthorization()`. Implicit and password grants are not built in — [OAuth Provider docs](https://www.better-auth.com/docs/plugins/oauth-provider)
- PKCE is required by default, S256 only. Public clients register with `token_endpoint_auth_method: "none"` and authenticate "with PKCE alone". Redirect URIs are exact-match; "A native client may vary the loopback port" — [OAuth Provider docs](https://www.better-auth.com/docs/plugins/oauth-provider)
- Revocation (RFC 7009), introspection (RFC 7662), dynamic client registration (RFC 7591), protected-resource metadata (RFC 9728), RP-initiated and back-channel logout are supported. Access tokens are "JWT (RFC 9068) when the request names a resource and the JWT plugin is enabled. Otherwise opaque." — [OAuth Provider docs](https://www.better-auth.com/docs/plugins/oauth-provider)
- "`mcp()` replaces `oauthProvider()`, so do not register both." The page does not mention the older `oidc-provider` plugin — [OAuth Provider docs](https://www.better-auth.com/docs/plugins/oauth-provider)

Expo plugin and why it does not transfer to Swift/Kotlin
- It is a JavaScript client plugin: session data and cookies are cached in `expo-secure-store`; for custom requests you must "retrieve the session cookie from `SecureStore` and manually add it to your request headers"; relative callback URLs are converted with `Linking.createURL`; the app scheme must be in the server's `trustedOrigins`. The page does not mention Swift or Kotlin — [Expo integration docs](https://www.better-auth.com/docs/integrations/expo)
- A community Flutter client reproduces this by sending the deep-link scheme in an `expo-origin` header, i.e. non-JS clients imitate the Expo plugin's wire behaviour rather than using a documented native protocol — [better_auth_flutter_client](https://pub.dev/documentation/better_auth_flutter_client/1.0.0/)

Swift and Kotlin SDKs
- BetterAuthSwift (ouwargui) is a community package ("community-driven", author not affiliated with Better Auth), MIT, about 76 stars, 84 commits, install pinned from 2.0.0 (Swift Package Index lists v2.1.1). It documents Two Factor, Username, Anonymous, Phone Number, Magic Link, Email OTP and Passkey; Organization, API Key, Bearer and others are listed without docs. README states "BetterAuthSwift only supports the latest better-auth version." Session storage and social sign-in mechanics are not described — [BetterAuthSwift on GitHub](https://github.com/ouwargui/BetterAuthSwift); [Swift Package Index](https://swiftpackageindex.com/ouwargui/BetterAuthSwift)
- I found no official or community Kotlin/Android or KMP client for Better Auth. Searches returned only generic libraries (for example kotlin-multiplatform-oidc, a generic OIDC/OAuth 2.0 library for Android and iOS) and other vendors' SDKs — [kotlin-multiplatform-oidc listing](https://awesome.ecosyste.ms/projects/github.com%2Fkalinjul%2Fkotlin-multiplatform-oidc)
- Community threads asking how to use Better Auth from Swift/iOS exist but are questions, not documented solutions — [Answer Overflow thread](https://www.answeroverflow.com/m/1377873299744358481)

Authorization Code + PKCE on each platform
- iOS: `ASWebAuthenticationSession` shows a modal telling the user which domain the app is authenticating with; on iOS the browser is "a secure, embedded web view"; the session "ensures that only the calling app's session receives the authentication callback, even when more than one app registers the same callback URL scheme" — [Apple: ASWebAuthenticationSession](https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession)
- iOS 17.4+ supports HTTPS callbacks: `callback: .https(host:path:)`, where "the host must be a member of a domain associated with the app" (Associated Domains) — [Apple: Callback.https(host:path:)](https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession/callback/https(host:path:))
- `prefersEphemeralWebBrowserSession` (default `false`): set `true` "to request that the browser doesn't share cookies or other browsing data between the authentication session and the user's normal browser session" — [Apple: prefersEphemeralWebBrowserSession](https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession/prefersephemeralwebbrowsersession)
- Android: Chrome's Auth Tab is a purpose-built Custom Tabs flow for OAuth, available from Chrome 132; "from Chrome 137, Auth Tab can directly replace existing Custom Tabs authentication integrations"; unsupported devices fall back to Custom Tabs (`CustomTabsClient#isAuthTabSupported()`) — [Chrome: Auth Tab guide](https://developer.chrome.com/docs/android/custom-tabs/guide-auth-tab)
- `androidx.browser` 1.10.0 is listed as released (RC dated 11 March 2026); Auth Tab APIs were marked experimental since 1.9.0 and I could not confirm the label was removed — [AndroidX browser releases](https://developer.android.com/jetpack/androidx/releases/browser)

Origin / CSRF behaviour for native callers
- Better Auth validates `Origin`/`Referer` against `trustedOrigins` whenever present. Requests with neither Fetch Metadata nor `Origin`/`Referer` ("server-to-server and non-browser tooling") get permissive handling. For mobile apps, add the custom scheme (for example `myapp://`) to `trustedOrigins` — [Better Auth security reference](https://www.better-auth.com/docs/reference/security)
- Session cookies default to `SameSite=Lax`, `HttpOnly`, and `Secure` on https; `crossSubDomainCookies` shares them across subdomains — [Better Auth security reference](https://www.better-auth.com/docs/reference/security)

Sessions, refresh and revocation
- Sessions expire after 7 days by default and slide: "whenever the session is used and the `updateAge` is reached, the session expiration is updated to the current time plus the `expiresIn` value." `freshAge` defaults to 1 day — [Session management docs](https://www.better-auth.com/docs/concepts/session-management)
- `listSessions`, `revokeSession` (by token), `revokeOtherSessions`, `revokeSessions` are provided. With cookie caching, revoked sessions may stay active on other devices until the cache expires — [Session management docs](https://www.better-auth.com/docs/concepts/session-management)

Token storage
- iOS Keychain: `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly` items are available after first unlock (recommended for background access) and "do not migrate to a new device" — [Apple: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly](https://developer.apple.com/documentation/security/ksecattraccessibleafterfirstunlockthisdeviceonly)
- Android: every API in Jetpack Security Crypto (including `EncryptedSharedPreferences`) was deprecated in 1.1.0 with no further releases planned; the replacement pattern is Jetpack DataStore with Tink encryption and an Android Keystore-held key; there is no official EncryptedDataStore — [Include Security, Aug 2026](https://blog.includesecurity.com/2026/08/encryptedsharedpreferences-is-dead-heres-what-you-should-use-instead/); [ProAndroidDev 2026 migration guide](https://proandroiddev.com/goodbye-encryptedsharedpreferences-a-2026-migration-guide-4b819b4a537a)

### Inferences
- Route 1 (direct REST + bearer) is the least server work today because Eleva already enables `bearer` and `jwt`, but each login method (email, magic link, 2FA, passkey, Google, Microsoft, Apple) needs native UI and request code written twice (Swift and Kotlin), against endpoints that are not published as a stable native contract. There is no refresh token: the "token" is the 7-day sliding session token, so theft of it equals session theft until revoked.
- Route 2 (OAuth provider + PKCE in the system browser) moves all login UI to the existing web pages, so passkeys, 2FA, magic link and social providers work without native code per method, and it yields standard rotating refresh tokens, revocation and (with a `resource` parameter) JWT access tokens the API can verify via JWKS. It also gives browser-cookie SSO between two apps for free. Cost: server-side change, a consent step whose skipping for first-party clients is undocumented, and a less "native" login screen.
- A hybrid is plausible: OAuth/PKCE for session establishment plus native Sign in with Apple / Google ID-token and native passkey buttons later as polish.
- With two apps (Shape A), each app is a separate OAuth public client or a separate bearer session; with one app (Shape B) this is simply one client. The auth build is largely a one-off cost that is shared if it lives in a common Swift package / Gradle module (see section 6).
- Better Auth's patch cadence (six stable releases in ten days) plus BetterAuthSwift's "latest version only" policy make a thin, self-owned client generated from the OpenAPI spec lower risk than depending on the community SDK.
- Cookie-session pitfalls in native apps (not found in a single source, reasoning from the docs above): `SameSite=Lax` cookies on `.eleva.care` live in the system browser's jar, not in the app's `URLSession`/OkHttp jar; cookie stores on device are not hardware-backed secret storage; if the app sends an `Origin` header it must be whitelisted; and the cookie cache can keep a revoked session alive briefly.

### Gaps
- Could not verify whether the OAuth provider accepts custom-URI-scheme redirect URIs (for example `care.eleva.app:/callback`) or how to skip consent for trusted first-party clients; the main docs page mentions neither. Default access/refresh token lifetimes and refresh-token reuse detection are on a "Tokens and scopes" sub-page I did not fetch.
- Could not verify the stability label (beta/stable) of `@better-auth/oauth-provider` or the deprecation status of the older `oidc-provider` plugin.
- No Better Auth documentation or GitHub discussion was found that officially describes a Swift/Kotlin integration path; "no official native SDK" is based on absence in docs, release notes and search results.
- Whether `bearer` with `requireSignature` is advisable for mobile, and whether magic-link verification returns `set-auth-token` when opened via universal link in a native app, were not verified.

## 2. Sign in with Apple and Google natively against Better Auth, and App Review guideline 4.8

### Takeaway
Better Auth accepts provider ID tokens directly (`signIn.social` with `idToken`), so native Sign in with Apple and Google Credential Manager sign-in work without a browser redirect, provided the server is configured with the app bundle IDs / platform client IDs as accepted audiences. Because Eleva offers Google and Microsoft login, guideline 4.8 requires an equivalent privacy-preserving login on iOS (Sign in with Apple satisfies it) unless the iOS app offers only Eleva's own sign-in.

### Cited Findings
- Apple ID-token sign-in: pass `provider: "apple"` with `idToken: { token, nonce?, accessToken? }`; "If ID token is provided no redirection will happen, and the user will be signed in directly." — [Better Auth Apple docs](https://www.better-auth.com/docs/authentication/apple)
- "On native iOS, it doesn't use the service ID but the app ID (bundle ID) as client ID." Using the service ID fails with `JWTClaimValidationFailed: unexpected "aud" claim value`; set `appBundleIdentifier`. For several audiences (Service ID plus one or more bundle IDs) "prefer `clientId: string[]` or `audience: string[]`" — [Better Auth Apple docs](https://www.better-auth.com/docs/authentication/apple)
- `https://appleid.apple.com` must be added to `trustedOrigins` — [Better Auth Apple docs](https://www.better-auth.com/docs/authentication/apple)
- Google ID-token sign-in: `idToken: { token, accessToken }`; pass an array to `clientId` to accept ID tokens from web, iOS and Android client IDs; "The array only expands ID token audience verification" while the code flow still uses the first entry with the single `clientSecret` — [Better Auth Google docs](https://www.better-auth.com/docs/authentication/google)
- The Expo docs state "only google, apple and facebook are supported for idToken signIn" — [Expo integration docs](https://www.better-auth.com/docs/integrations/expo)
- Guideline 4.8 (verbatim): apps that use a third-party or social login "to set up or authenticate the user's primary account with the app must also offer as an equivalent option another login service" that limits data collection to name and email, lets users keep their email private, and "does not collect interactions with your app for advertising purposes without consent." Not required if "Your app exclusively uses your company's own account setup and sign-in systems" (four other exceptions cover marketplaces, education/enterprise accounts, government eID, and third-party-service clients) — [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- Guideline 5.1.1(v): "If your app doesn't include significant account-based features, let people use it without a login. If your app supports account creation, you must also offer account deletion within the app." — [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- Guideline 4.3(a): "Don't create multiple Bundle IDs of the same app" — [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- On Android, Sign in with Google is implemented through Credential Manager alongside passkeys — [Android Credential Manager prerequisites](https://developer.android.com/identity/credential-manager/prerequisites)

### Inferences
- Microsoft is not in the documented ID-token list, so Microsoft sign-in in a native app would have to go through the browser-based flow (ASWebAuthenticationSession / Auth Tab) even if Apple and Google are native.
- Shape A doubles the audience configuration: two iOS bundle IDs and two Android package/client IDs must be accepted by the Apple and Google provider blocks. This is configuration, not code, but it is one more place to get wrong.
- 4.8 applies whether Google/Microsoft buttons are native or rendered in the web login inside ASWebAuthenticationSession, since the trigger is the app using a third-party login for the primary account. Adding the Apple provider server-side is therefore effectively mandatory for either shape if social login is kept on iOS.
- 5.1.1(v) supports the diary's no-account mode and also implies that in Shape B the diary should remain usable without login; in-app account deletion must exist in every app that can create an account (twice in Shape A unless the diary app defers account creation to the main app or web).
- 4.3(a) is a low but non-zero risk in Shape A: the two apps must be clearly different products rather than a re-skinned subset.

### Gaps
- Did not verify nonce requirements for Apple ID tokens in Better Auth beyond "optional", nor Android `GetGoogleIdOption` specifics.
- Did not find an authoritative statement on whether Microsoft ID-token sign-in is supported by Better Auth.

## 3. Passkeys in native apps tied to the eleva.care relying party

### Takeaway
One RP ID (`eleva.care`) can serve the website and any number of iOS and Android apps: iOS lists each app ID under `webcredentials` in the AASA file, Android lists each package in `assetlinks.json`, and the server must accept each Android app's `android:apk-key-hash:` origin. A passkey created on the web or in one app is then usable in the other app.

### Cited Findings
- iOS: add the Associated Domains capability with the `webcredentials` service and ensure the AASA file on the domain "contains an entry for this app's App ID for the `webcredentials` service" — [Apple: Connecting to a service with passkeys](https://developer.apple.com/documentation/authenticationservices/connecting-to-a-service-with-passkeys)
- AASA format: `"webcredentials": { "apps": [ "ABCDE12345.com.example.app" ] }` where `apps` is an array of `<Application Identifier Prefix>.<Bundle Identifier>`; the `applinks` example lists two app IDs. File must be at `https://<fully qualified domain>/.well-known/apple-app-site-association`, served over https "with a valid certificate and with no redirects" — [Apple: Supporting associated domains](https://developer.apple.com/documentation/xcode/supporting-associated-domains)
- "If your site uses multiple subdomains ... each requires its own entry in the Associated Domains Entitlement, and each must serve its own `apple-app-site-association` file." The system downloads and verifies the file when the app is installed — [Apple: Supporting associated domains](https://developer.apple.com/documentation/xcode/supporting-associated-domains)
- Android: Digital Asset Links are "required for passkeys". `assetlinks.json` is a JSON array; each entry has relations `delegate_permission/common.handle_all_urls` and `delegate_permission/common.get_login_creds` and a target with `package_name` and `sha256_cert_fingerprints`. "To register different app versions ... add multiple entries to the array ... each with a distinct package name." Host at `https://<domain>/.well-known/assetlinks.json` with `Content-Type: application/json` and HTTP 200; "Verification fails if the response has a 301 or 302 HTTP redirect" — [Android: Credential Manager prerequisites](https://developer.android.com/identity/credential-manager/prerequisites)
- Android server check: the app origin is `android:apk-key-hash:<base64url SHA-256 of signing cert>`; "If you have multiple signing certificates ... or multiple apps, then repeat the process and accept all the origins as valid on the app server." Minimum Android 9 (API 28). Docs currently show `androidx.credentials:credentials:1.7.0-alpha03` — [Android: Create passkeys](https://developer.android.com/identity/passkeys/create-passkeys)
- Better Auth passkey plugin (`@better-auth/passkey`): `rpID` plus `origin`, which is "The origin, or list of origins, where passkey registration and authentication run"; endpoints include `POST /sign-in/passkey` and `POST /passkey/add-passkey`; `auth.api.generatePasskeyRegistrationOptions` exists for passkey-first flows. The only mobile guidance is an Expo `cookiePrefix` note — [Better Auth passkey docs](https://www.better-auth.com/docs/plugins/passkey)
- Chrome and Edge cap the number of distinct origins in WebAuthn related-origin requests (around 5 per RP), so very large app families may need to partition RP IDs — [web.dev: RP ID across domains and apps](https://web.dev/articles/webauthn-rp-id)

### Inferences
- Because the RP ID is `eleva.care` (apex), the two well-known files must be served from `https://eleva.care/.well-known/...` with no redirect. If the apex currently redirects to `www.eleva.care` or a localized path, native passkeys will silently fail; this is a web-infrastructure prerequisite independent of one-versus-two apps.
- Shape A adds one AASA entry, one assetlinks entry and one extra allowed origin per additional app. Marginal cost is small, and it buys cross-app passkey sign-in: a user with a passkey can sign into the second app with one biometric prompt, which is the cleanest "SSO" on Android.
- The Better Auth `origin` array should be able to hold the Android `android:apk-key-hash:...` strings, but this is not documented; it must be tested, especially under 1.8's stricter user-verification and "active session required for registration" rules.
- Passkey registration from a native app requires an authenticated call to the registration-options endpoint, so the bearer/OAuth session must already work natively; passkey is not a way around building the base session layer.

### Gaps
- Not verified: that Better Auth's passkey plugin accepts `android:apk-key-hash:` origins, and the exact HTTP paths for generating registration/authentication options from a non-JS client.
- Apple's CDN caching behaviour and refresh timing for AASA files was not confirmed from a primary source.

## 4. Single sign-on across two apps from the same developer

### Takeaway
On iOS, silent SSO between two apps of one team is an officially supported pattern via a shared Keychain access group. Android has no equivalent first-class mechanism; the realistic options are a signature-protected ContentProvider (requires both apps to share the same Play app-signing key), browser-cookie SSO through Custom Tabs/Auth Tab, or passkeys/Credential Manager, each with some user-visible step or setup constraint.

### Cited Findings
- iOS Keychain sharing: "you can share credentials, so that logging into one of your apps automatically grants the user access to all of your apps. This kind of sharing doesn't require interaction with or permission from the user, but limits sharing to apps that are delivered by a single development team." — [Apple: Sharing access to keychain items among a collection of apps](https://developer.apple.com/documentation/security/sharing-access-to-keychain-items-among-a-collection-of-apps)
- Mechanics: enable the Keychain Sharing capability in each app and add a common group (Xcode prefixes it with the team ID). App group names can also be used as keychain access group names "without adding them to the Keychain access groups entitlement"; app groups additionally give a shared container — [Apple: Sharing access to keychain items among a collection of apps](https://developer.apple.com/documentation/security/sharing-access-to-keychain-items-among-a-collection-of-apps)
- Browser SSO on iOS: with a non-ephemeral ASWebAuthenticationSession the system shows a consent alert ("... wants to use <domain> to sign in") and there is "no method to silently clear browser cookies in a non-ephemeral session without triggering the system alert"; ephemeral sessions suppress the prompt but do not share cookies — [Auth0 support article](https://support.auth0.com/center/s/article/system-alert-during-logout-when-using-non-ephemeral-sessions-in-ios-swift-sdk)
- Apple forum reports (anecdotal): cookies shared with Safari on device but not in the iOS 26 simulator; session (non-persistent) cookies are not shared, persistent ones are — [Apple forums 801879](https://developer.apple.com/forums/thread/801879); [Apple forums 750904](https://developer.apple.com/forums/thread/750904)
- Android `sharedUserId` is deprecated in AOSP and slated for removal — [AOSP commit mirror](https://gitlab.e.foundation/e/os/android_frameworks_base/-/commit/21dd05fd2c96954bda118b76ae234706b6507706)
- A commercial SDK (Clerk) implements Android cross-app session sharing with a ContentProvider gated by signing certificate, and documents that with Play App Signing "the apps must use the same app signing key; using the same upload key isn't sufficient" — [Clerk: Share sessions across apps (Android)](https://clerk.com/docs/android/reference/native-mobile/shared-session-sync)
- Android Restore Credentials restores sign-in on a new device but is per-app ("supports only one account per app"), requires Android 9+, Play services 24220000+, `androidx.credentials` 1.5.0+ and enabled backup — [Android: Restore Credentials](https://developer.android.com/identity/sign-in/restore-credentials)
- Digital Asset Links let "users ... use the same saved credentials across associated apps and websites" — [Android: Credential Manager prerequisites](https://developer.android.com/identity/credential-manager/prerequisites)
- Better Auth one-time-token plugin: `GET /one-time-token/generate` (requires an active session) and `POST /one-time-token/verify`, which returns "the session that was attached to the token"; tokens are single-use, expire in 3 minutes by default, can be stored hashed, and are "commonly used for across domains authentication" — [Better Auth one-time token docs](https://www.better-auth.com/docs/plugins/one-time-token)
- Deferred deep linking: Firebase Dynamic Links was shut down on 25 August 2025; Android has the Play Install Referrer as a platform mechanism, iOS has no equivalent and vendors (Branch, AppsFlyer, Adjust) fill the gap — [Branch: life after Firebase Dynamic Links](https://www.branch.io/resources/blog/life-after-firebase-dynamic-links-three-paths-to-a-better-deep-linking-stack/); [Linkrunner migration guide 2026](https://linkrunner.io/blog/firebase-dynamic-links-migration-guide-2026-what-to-do-now-that-it-s-shut-down)
- Google's replacement advice after Instant Apps is to use deep links to send users to specific journeys in the regular app — [Android: Google Play Instant notice](https://developer.android.com/topic/google-play-instant)

### Inferences
- Best achievable cross-app experience in Shape A: iOS — second app reads the shared Keychain item at launch and is signed in with zero prompts. Android — either (a) signature-permission ContentProvider (zero prompts, but both apps must be created under the same Play app-signing key, a decision that must be made when the second app is first uploaded), (b) passkey via Credential Manager (one biometric prompt), or (c) Auth Tab against the web session cookie (a brief browser sheet, no typing if the cookie is still valid).
- Sharing the same bearer session token between apps means one revocation logs out both; issuing a separate session per app (via one-time token handoff or a second OAuth grant) gives independent revocation at the cost of an extra round trip.
- App-to-app handoff ("Book a specialist" in the diary opening the main app at the right screen, already signed in) is buildable with universal links / App Links plus the shared credential. If the main app is not installed, the link falls back to the web or the store; carrying context through install on iOS requires a third-party deferred-deep-link vendor or a "resume from server state after login" approach.
- Shape B has none of this cost: SSO, handoff, and deferred deep linking between apps simply do not exist as problems. This is the largest pure-engineering saving of the single-app shape in the auth area.

### Gaps
- No official Android guidance was found on the recommended replacement for `sharedUserId` for shared login; AccountManager-based sharing is described only in forum answers and was not verified against current Android versions.
- Did not verify whether the one-time-token `generate` endpoint works with a bearer header instead of a session cookie.
- Did not verify from Google documentation how to reuse an app-signing key across two Play apps.

## 5. Offline-first diary with optional account

### Takeaway
A local SQLite-backed store with a hand-written REST delta sync (client-generated UUIDs, per-record server version, tombstones, idempotent outbox) is sufficient for a single-user diary and avoids new infrastructure; PowerSync is the only managed sync engine found with GA native Swift and Kotlin SDKs on Postgres. HealthKit and Health Connect both have a water-intake type but neither has a urination/void type, and Apple forbids storing personal health information in iCloud, which rules out CloudKit as the no-account sync.

### Cited Findings

Local persistence
- SwiftData is a layer over Core Data, shares its SQLite store format, and its production failure points are reported as migrations, predicate translation and CloudKit sync; a 2026 field report says it handles realistic queries on iOS 26 but describes a CloudKit problem that disrupted a TestFlight beta — [NativeFirst field notes 2026](https://nativefirst.pages.dev/learn/field-notes/swiftdata-production-2026-cloudkit-gotchas)
- Room: 2.7.0 was the first stable Kotlin Multiplatform release; Room 3.0 is "a major breaking version of the library that focuses on Kotlin Multiplatform", first alpha announced March 2026; Room 2.8.x gets only patch releases — [Android Developers Blog: Room 3.0](https://android-developers.googleblog.com/2026/03/room-30-modernizing-room.html); [Modernizing the Room](https://developer.android.com/blog/posts/modernizing-the-room)
- SQLDelight has been KMP-ready longer; Room derives schema from data classes, SQLDelight generates models from hand-written SQL — [bswen Room vs SQLDelight, March 2026](https://docs.bswen.com/blog/2026-03-14-room-vs-sqldelight-kmp)

Sync engines
- PowerSync: Swift and Kotlin SDKs are listed as GA; it syncs client SQLite with Postgres (logical replication), MongoDB or MySQL — [PowerSync feature status](https://docs.powersync.com/resources/feature-status)
- PowerSync Swift SDK v1.14.0 (May 2026) was rewritten in pure Swift, removing the Kotlin XCFramework dependency — [PowerSync changelog May 2026](https://powersync.com/blog/powersync-changelog-may-2026)
- PowerSync is available as managed cloud, a free source-available self-hosted Open Edition, and an Enterprise self-hosted edition — [PowerSync Open Edition](https://www.powersync.com/blog/powersync-open-edition-release)
- ElectricSQL: "Electric does not do write-path sync"; writes are the application's job (REST plus optimistic state). Documented clients are TypeScript and Elixir plus an HTTP API; no Swift or Kotlin client is mentioned — [Electric: Writes guide](https://electric.ax/docs/guides/writes)
- Zero (Rocicorp) reached 1.0 / GA in March 2026; its documented mobile support is React Native and Expo; I found no native Swift or Kotlin SDK — [InfoQ: Zero 1.0](https://infoq.com/news/2026/06/zero-version-1); [Zero React Native docs](https://zero.rocicorp.dev/docs/react-native)

Custom sync patterns
- Row-level last-write-wins comparing `updated_at`, with remote deletes always winning and tombstones retained so deleted rows are not resurrected — [dev.to: conflict-safe SQLite sync](https://dev.to/sathish_daggula/react-native-offline-first-conflict-safe-sqlite-sync-549a)
- Device clocks skew, so robust LWW uses server receipt time or logical versions; outbox operations should be idempotent and retried until acknowledged — [DZone: offline-first sync conflict resolution](https://dzone.com/articles/offline-first-sync-conflict-resolution)

Anonymous-to-account migration
- Better Auth `anonymous` plugin: `onLinkAccount` receives `anonymousUser` and `newUser` when an anonymous user signs in or up with another method; data migration is the application's responsibility; the anonymous user is deleted on link by default. With two-factor, a sign-in awaiting the second factor does not link and `onLinkAccount` "is not called" — [Better Auth anonymous plugin docs](https://www.better-auth.com/docs/plugins/anonymous)

No-account backup
- Apple guideline 5.1.3(ii): apps "may not store personal health information in iCloud" — [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- Android Auto Backup stores at most 25 MB per app; include/exclude rules are declared in XML (data-extraction-rules for API 31+) — [Android: Auto Backup](https://developer.android.com/identity/data/autobackup); [Android: Large Backups API comparison](https://developer.android.com/identity/data/large-backups)

Health platforms
- HealthKit `HKQuantityTypeIdentifier.dietaryWater`: "measures the amount of water consumed", volume units, cumulative, iOS 9.0+ — [Apple: dietaryWater](https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/dietarywater)
- HealthKit `HKCategoryTypeIdentifier.bladderIncontinence`: "records bladder incontinence as a symptom", values from `HKCategoryValueSeverity`, iOS 14.0+ — [Apple: bladderIncontinence](https://developer.apple.com/documentation/healthkit/hkcategorytypeidentifier/bladderincontinence)
- HealthKit also has `dietaryCaffeine` among quantity identifiers (found in the identifier list alongside `dietaryWater`) — [Apple: HKQuantityTypeIdentifier](https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier)
- Health Connect `HydrationRecord`: interval record, unit Volume, permissions `READ_HYDRATION` / `WRITE_HYDRATION`, aggregate `VOLUME_TOTAL`; Nutrition record includes a caffeine aggregate. The full data-type table (SDK 1.0.0-alpha10+) lists no urination, urine, bladder or incontinence record — [Android: Health Connect data types](https://developer.android.com/health-and-fitness/health-connect/data-types)
- Publishing a Health Connect app requires declaring data-type access in Play Console or users see access errors — [Android: Health Connect data types](https://developer.android.com/health-and-fitness/health-connect/data-types)
- Guideline 5.1.3(i) forbids using health data for advertising or data mining; 5.1.3(ii) forbids writing false or inaccurate data into HealthKit — [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

### Inferences
- Health-platform integration for a bladder diary is limited to fluid intake (write and read water, optionally caffeine) and, on iOS only, an incontinence-severity symptom. Void events, volumes and urgency must stay in Eleva's own schema. This is a small, optional feature in either shape, not a differentiator between them.
- For a single-user append-mostly diary, CRDTs are overkill: conflicts only arise when the same entry is edited on two devices offline, which LWW with a server-assigned version handles acceptably. A custom sync endpoint (`GET /diary/changes?since=cursor`, `POST /diary/batch` with idempotency keys) in the existing API is roughly one backend feature plus one client module per platform, and adds no vendor that would hold health data.
- PowerSync is the credible buy option if richer sync (messages, bookings cache) is wanted later, but it introduces a replication service that must be self-hosted or contracted in the EU and connected to Neon via logical replication; that operational commitment is hard to justify for the diary alone.
- Anonymous-to-account merge can be done without the `anonymous` plugin: keep records keyed by client UUIDs with no owner locally, and on first sign-in push the whole local set through the normal batch endpoint so the server assigns ownership; the server must de-duplicate by client UUID to make retries safe. The 2FA caveat in the anonymous plugin shows why relying on server-side anonymous users adds edge cases.
- Guideline 5.1.3(ii) means the no-account mode's durability on iOS rests on the device (and whatever the system device backup does), not on CloudKit. The honest product message is "sign in to back up and sync"; this strengthens the case for a low-friction optional account in both shapes.
- Shape difference: the diary's data layer is identical in A and B if built as a module (section 6). What differs is that in Shape A the diary app's first-run must work with zero network and zero account, while in Shape B the same module sits behind an app shell that may already have a session.

### Gaps
- No authoritative 2026 comparison of SwiftData versus GRDB versus Core Data was found; GRDB evidence was a single anecdote and is not cited.
- Client-side encryption of the local database (iOS Data Protection classes, SQLCipher, Android Keystore-wrapped keys) was not researched to a citable standard.
- Could not confirm whether Android Auto Backup is end-to-end encrypted, how device-to-device transfer treats app databases, or how guideline 5.1.3(ii) is applied to ordinary iCloud device backups.
- I could not exhaustively enumerate HealthKit identifiers; no urination or void type was found, and a guessed `urinaryIncontinence` identifier returned 404, but absence is not proven. PowerSync pricing and EU hosting were not verified.

## 6. Code sharing between apps and platforms; effort multipliers

### Takeaway
Within each platform, a diary feature can be a local Swift package / Gradle library module consumed by both a standalone app target and the big app, so Shape A does not mean writing the diary twice per platform. Across platforms, Kotlin Multiplatform shared logic with native SwiftUI/Compose UI is stable and widely used in 2026, and OpenAPI generators exist for both languages; no trustworthy number was found for the cost multiplier of two native codebases or for how much AI agents shrink it.

### Cited Findings

Modules shared by two app targets
- Apple documents organizing code as local Swift packages that live in the same repository and are added as dependencies of each app target — [Apple: Organizing your code with local packages](https://developer.apple.com/documentation/xcode/organizing-your-code-with-local-packages)
- A common layout is one local package holding all modules so that extensions, widgets and watch apps import only what they need — [Swift with Majid: microapps architecture](https://swiftwithmajid.com/2022/01/12/microapps-architecture-in-swift-spm-basics/)
- Swift modules are statically linked by default, so code can be duplicated in app-extension binaries; a dynamic framework aggregating the modules is one fix — [Paulo Andrade: Swift modules and code/assets duplication](https://pfandrade-me.pages.dev/blog/swift-modules-and-codeassets-duplication)
- App Clips "use the same Xcode project for your full app and your App Clip" and share code and assets across targets, which is Apple's own precedent for one codebase feeding two binaries — [Apple: Creating an App Clip with Xcode](https://developer.apple.com/documentation/appclip/creating-an-app-clip-with-xcode)

Kotlin Multiplatform and Compose Multiplatform
- Stability table (page dated 10 September 2025): KMP core is Stable on Android, iOS, desktop and server, Beta on watchOS/tvOS/Wasm; Compose Multiplatform is Stable on Android, iOS and desktop, Beta on web — [Kotlin: supported platforms](https://kotlinlang.org/docs/multiplatform/supported-platforms.html)
- State of Kotlin 2026 (JetBrains): KMP's share among cross-platform developers went "from 7% (2024) to 18% (2025)"; KMP in the App Store top 10,000 went "from under 1% (early 2024) to almost 3% (mid-2026)" (Appfigures); "60% of KMP projects share all or almost all of their business logic"; "72% of teams report faster development, 70% higher app quality, and 55% better collaboration between Android and iOS teams"; FAQ claims "KMP teams build 40–80% of their mobile codebase once" and "15–30% faster release cycles than with separate native codebases". Sample sizes are not given on the page — [State of Kotlin 2026](https://kotlinlang.org/state-of-kotlin-2026/)
- Case studies (JetBrains-curated): Forbes shares "over 80% of logic across iOS and Android"; Philips "consolidated all our business logic into shared code"; Down Dog shares most client code while "keeping native-only views"; McDonald's reports "fewer crashes and better performance" and a more unified mobile team; Cash App moved from shared JavaScript to KMP in 2018; Duolingo: "the more that we use Kotlin Multiplatform internally, the more we find ourselves speeding up in terms of shipping"; Bitkey shares 95% of its mobile codebase — [Kotlin Multiplatform case studies](https://kotlinlang.org/case-studies/?type=multiplatform)
- PowerSync's Swift SDK dropped its embedded Kotlin XCFramework for a pure-Swift rewrite in 2026, one data point of a vendor moving away from shipping KMP binaries to Swift developers — [PowerSync changelog May 2026](https://powersync.com/blog/powersync-changelog-may-2026)

Skip and Swift on Android
- Skip became free and open source in January 2026 (engine "skipstone" under AGPL-3.0; license keys no longer required); its Fuse mode builds on the native Swift SDK for Android — [InfoQ: Skip open-sourced](https://www.infoq.com/news/2026/01/swift-skip-open-sourced); [Skip blog](https://skip.tools/blog/skip-2026)
- The official Swift SDK for Android is released (getting-started guide uses Swift 6.4.2; requires matching toolchain, the SDK bundle and NDK LTS 30); Swift modules are packaged as shared libraries and called from Kotlin/Java through swift-java (JNI). The guide does not cover building Android UI in Swift — [swift.org: Swift SDK for Android](https://www.swift.org/documentation/articles/swift-sdk-for-android-getting-started.html)

Typed API clients from OpenAPI
- Apple's swift-openapi-generator is a SwiftPM build plugin: "The code is generated at build-time, so it's always in sync with the OpenAPI document and doesn't need to be committed". Supports OpenAPI 3.0 and 3.1 with preliminary 3.2; client transports for URLSession and AsyncHTTPClient (plus OkHttp and WinHTTP community transports); generated code runs on iOS 13+ and Android; about 2k stars — [apple/swift-openapi-generator](https://github.com/apple/swift-openapi-generator)
- Kotlin: Fabrikt generates Ktor client code with Kotlin Serialization (or Jackson) models and OkHttp/OpenFeign clients — [fabrikt-io/fabrikt](https://github.com/fabrikt-io/fabrikt)
- OpenAPI Generator's Kotlin generator has a multiplatform mode but its docs reference Ktor 1.6.7 and kotlinx.serialization 1.2.1 — [OpenAPI Generator: kotlin](https://openapi-generator.tech/docs/generators/kotlin/)
- Kotlin community feedback: models from OpenAPI Generator are fine but the generated client classes are not trusted; Fabrikt "seems to work better" — [Kotlin Slack thread](https://slack-chats.kotlinlang.org/t/32595902/can-anyone-recommend-something-to-generate-code-from-openapi)
- `openapi-kmp-gen` (v1.3.0, 6 April 2026) generates Kotlin Multiplatform clients for OpenAPI 3.0.0+ — [Gradle plugin portal](https://plugins.gradle.org/plugin/com.kroegerama.openapi-kmp-gen)

Native versus cross-platform experience reports
- Airbnb (2018): "it is exceedingly rare for somebody to be highly competent in Android, iOS, and React"; in React Native they "had to write bridges to all existing infrastructure"; after moving off React Native they still valued writing product code once — [Airbnb: Building a cross-platform mobile team](https://medium.com/airbnb-engineering/building-a-cross-platform-mobile-team-3e1837b40a88); [Airbnb: What's next for mobile](https://medium.com/airbnb-engineering/5e71618576ab)
- Doctolib (EU health booking) continues to hire for React Native on its patient apps as of 2026 — [Doctolib job listing](https://www.welcometothejungle.com/en/companies/doctolib/jobs/staff-mobile-engineer-x-f-m_paris)

AI coding agents
- Xcode 26.3 (announced 3 February 2026, released late February 2026) added agentic coding with Anthropic's Claude Agent and OpenAI's Codex inside the IDE, plus Model Context Protocol support; agents can work with project files, previews and documentation — [9to5Mac](https://9to5mac.com/2026/02/26/apple-releases-xcode-26-3-with-support-for-agentic-coding/); [InfoQ](https://infoq.com/news/2026/02/xcode-26-3-agentic-coding)
- Android Studio's Gemini Agent Mode launched as a preview in June 2025; the January 2026 feature drop added device interaction, multiple threads, remote MCP servers and a choice of other models — [Android Developers Blog, Jan 2026](https://android-developers.googleblog.com/2026/01/llm-flexibility-agent-mode-improvements.html); [Android Studio Agent Mode docs](https://developer.android.com/studio/gemini/agent-mode)

### Inferences
- The decisive structural point for the one-versus-two comparison: build the diary as `DiaryKit` (Swift package) and `:feature:diary` (Gradle library) from day one. Then Shape A = two thin app shells per platform over shared modules (auth, API client, design system, diary); Shape B = one shell. Moving between shapes later is mostly packaging, store listings and SSO work, not a rewrite. The incremental engineering cost of Shape A over B is the second shell, SSO/handoff (section 4), duplicate release pipelines (section 10) and duplicated store compliance, not a second diary implementation.
- KMP for shared business logic (API client, sync engine, validation, diary calculations) with SwiftUI and Compose UI is compatible with the "fully native" decision and is the most evidence-backed way to cut duplicated logic. Costs for a small team: Kotlin tooling on the iOS side, Swift-interop friction, and a build-system dependency. For the sync engine and API layer specifically, the alternative of two generated OpenAPI clients plus two small hand-written sync modules is also reasonable, because the generators remove most of the duplicated boilerplate.
- Skip (Swift to Android) contradicts the stated decision to write Kotlin/Compose and adds a transpilation layer; it is an option only if the team turns out to be Swift-heavy.
- Realistic multiplier: no source gives one. JetBrains' "40–80% built once" and "15–30% faster release cycles" are vendor-reported and compare KMP to separate native codebases; read inversely they suggest fully separate native apps cost meaningfully more than 1x but well under 2x of one platform once API, design and product work are shared. I would treat "about 1.6x–1.9x of a single-platform build for two hand-written native apps, lower with generated clients and agent-assisted porting" as an assumption to validate, not a finding.
- AI agents plausibly reduce the second-platform cost most for mechanical work (porting a finished SwiftUI feature to Compose against the same OpenAPI client and spec), and least for platform-specific integration (passkeys, HealthKit/Health Connect, CallKit, store compliance). Both IDEs now ship first-party agent support, so this is practical in 2026, but no measured productivity figure was found.

### Gaps
- No engineering-blog source with hard numbers for native-versus-cross-platform cost at small-team scale was retrieved (Shopify, Cash App details, Sword Health and the Airbnb "Sunsetting React Native" post were unavailable or returned nothing; the Airbnb post returned HTTP 403).
- No case study quantifying AI-agent-assisted Swift-to-Kotlin feature parity was found.
- Gradle multi-module guidance for two `application` modules sharing feature libraries was not sourced (it is standard practice but uncited here). Swift export status for KMP in 2026 was not confirmed. Fabrikt's OpenAPI 3.1 support was not confirmed.

## 7. Native video calls with Daily

### Takeaway
Daily has generally available native SDKs for iOS (Swift, iOS 14+) and Android (Kotlin, API 23+) that provide call primitives and video views but no prebuilt UI, so the call screen must be built twice. Daily's own docs fetched here say nothing about CallKit, ConnectionService, background audio or picture-in-picture, so those are integration work the app owns. Opening Daily Prebuilt in the browser or a web view is a workable low-cost first version with weaker background behaviour.

### Cited Findings
- Daily's iOS and Android SDKs became generally available in May 2023; they share a common core with a Swift layer on iOS and a Kotlin layer on Android — [Daily changelog 17 May 2023](https://docs.daily.co/changelog/043-2023-05-17); [Daily: introducing native mobile libraries](https://www.daily.co/blog/introducing-dailys-native-mobile-libraries/)
- iOS: "a native Swift library built on WebRTC"; iOS deployment target 14.0+, Xcode 13+; installed with Swift Package Manager from `https://github.com/daily-co/daily-client-ios.git`; API covers call lifecycle, participants, media inputs, publishing, subscriptions, active speaker; rendering via `VideoView`. No prebuilt UI is mentioned — [Daily iOS reference](https://docs.daily.co/reference/ios); [Daily iOS guide](https://docs.daily.co/guides/products/mobile/ios)
- The iOS README's install example pins `from: "0.41.0"`; sending screen share from iOS additionally requires the `DailySystemBroadcast` package — [daily-co/daily-client-ios](https://github.com/daily-co/daily-client-ios)
- Android: `co.daily:client` ("a native Kotlin/Java library built on WebRTC"), `minSdkVersion 23`, Kotlin 1.6+, events via `CallClientListener`, `startScreenShare()` available; the example builds its own UI with `VideoView` — [Daily Android reference](https://docs.daily.co/reference/android)
- Starter kits and demos exist for both platforms ("Production-ready boilerplate from Daily's engineering team"): [daily-ios-starter-kit](https://github.com/daily-demos/daily-ios-starter-kit), [daily-android-starter-kit](https://github.com/daily-demos/daily-android-starter-kit) — [Daily iOS guide](https://docs.daily.co/guides/products/mobile/ios); [Daily mobile intro](https://docs.daily.co/guides/products/mobile/intro)
- Daily Prebuilt (the embeddable UI) is a web product: it is "not supported in react-native-daily-js. Use daily-js if you want to embed the Prebuilt UI"; Prebuilt has a picture-in-picture option usable on desktop and mobile browsers (beta in 2022, enabled via `enable_pip_ui`); a 2022 fix addressed device selection for Prebuilt inside an Android WebView — [Daily React Native docs](https://docs.daily.co/docs/react-native); [Daily changelog 30 March 2022](https://docs.daily.co/changelog/023-2022-03-30)
- CallKit: provides the system calling UI and coordinates with other calling apps; "you handle the back-end communication with your VoIP service" — [Apple: CallKit](https://developer.apple.com/documentation/callkit)
- iOS picture-in-picture for video calls: from iOS 16 the camera can keep running in PiP by enabling `isMultitaskingCameraAccessEnabled` on the capture session (earlier targets need an entitlement); the app must handle capture interruptions — [Apple: Adopting Picture in Picture for video calls](https://developer.apple.com/documentation/avkit/adopting-picture-in-picture-for-video-calls)
- WKWebView: `getUserMedia`/WebRTC support in WKWebView arrived in iOS 14.3 (secondary sources); requires a secure context; repeated `getUserMedia` calls can break existing streams on iOS — [Ionic forum on iOS 14.3](https://forum.ionicframework.com/t/webrtc-in-ios-14-3-iframe-wkwebview-external-resource/202088); [webrtcHacks: guide to Safari WebRTC](https://webrtchacks.com/guide-to-safari-webrtc/)
- Android WebView: camera/microphone are denied unless the app overrides `WebChromeClient.onPermissionRequest` in addition to holding the OS permissions — [Microsoft: Azure Communication Services in Android WebView](https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/voice-video-calling/get-started-android-webview)
- App Clips cannot use CallKit ("provide no functionality at runtime") — [Apple: Choosing the right functionality for your App Clip](https://developer.apple.com/documentation/appclip/choosing-the-right-functionality-for-your-app-clip)

### Inferences
- Eleva's calls are scheduled 1:1 appointments joined from a booking screen, not unsolicited incoming calls, so CallKit/ConnectionService ringing and PushKit VoIP pushes are optional. The must-haves are: camera/microphone permission flows, audio session and background-audio configuration so a call survives app switching, an Android foreground service for ongoing calls, reconnection UI, and optionally PiP. All of this is written once per platform regardless of shape.
- Video only exists in the full Eleva app. In Shape A the diary app stays free of WebRTC (smaller binary, fewer permissions, simpler review); in Shape B the WebRTC framework and camera/microphone permission strings ship to every diary-only user.
- A staged approach lowers time-to-market in both shapes: v1 opens the Daily room URL (Prebuilt) in the system browser or ASWebAuthenticationSession-independent Safari/Custom Tab, v2 replaces it with the native SDK and custom UI. The browser route loses in-app chrome, reliable background behaviour and system call integration.
- The call-token minting endpoint already exists server-side for web; native clients only need the meeting token and room URL from the API, so backend cost is near zero.

### Gaps
- Daily documentation on CallKit, ConnectionService, background modes, required Info.plist keys, PiP support in the native SDKs and the binary-size impact of the SDKs was not found on the pages fetched; app-size impact is unquantified.
- The current version numbers of `daily-client-ios` and `co.daily:client` were not confirmed (GitHub releases panel was empty; Android docs say `latest.release`).
- Behaviour of WebRTC calls in Chrome Custom Tabs in the background, and current WKWebView background-audio limits, were not verified from primary sources.

## 8. Messaging: build versus buy, and push notifications

### Takeaway
For 1:1 member–expert chat, a vendor SDK (Stream is the one verified here: native SDKs, selectable Dublin region) removes most client work but places health-related conversation content with a third party whose subprocessors span regions; building on Eleva's own Postgres with WebSocket/SSE keeps data in the existing EU stack at the cost of writing two native chat UIs and the offline/ordering logic. Push should carry no health content regardless of provider.

### Cited Findings
- Stream Chat lets each customer choose the region where data is processed and stored; Chat regions are North Virginia, Singapore, Dublin and Sydney; backups stay in the same geographic area — [Stream security and privacy FAQ](https://getstream.io/security/faq/)
- Stream: the app-level primary region "is where your data is stored"; connections terminate at the edge but data is stored in the primary region — [Stream Chat multi-region docs](https://getstream.io/chat/docs/javascript/multi_region)
- Stream's subprocessor list (updated September 2026) shows cloud and database providers across US, EMEA, APAC and LATAM, including PlanetScale with US, EU and APAC locations — [Stream subprocessors](https://getstream.io/legal/subprocessors/)
- Vendor-authored build-versus-buy guides list the work in a self-built chat: persistent connections, connection management, offline sync, push, message ordering, moderation, scaling; they argue ongoing maintenance exceeds the initial build (sources are chat vendors and favour buying) — [Stream: build vs buy chat](https://getstream.io/blog/build-vs-buy-chat/); [CometChat: build vs buy](https://cometchat.com/blog/build-vs-buy-should-you-build-chat-from-scratch)
- FCM "doesn't provide a built-in solution for end-to-end encryption"; Google's guidance is to encrypt on your server and decrypt in the app using data messages — [Firebase: FCM end-to-end encryption](https://firebase.google.com/docs/cloud-messaging/encryption)
- A study of 21 secure messaging apps found 11 leaked metadata to Google via FCM payloads (user identifiers in 10, sender/recipient names in 7) — [PoPETs 2024](https://petsymposium.org/popets/2024/popets-2024-0151.pdf)
- Apple's guidance, as summarized by a secondary source: do not put sensitive data in the payload; if you must, encrypt it and decrypt in a Notification Service Extension — [Adobe developer blog: securing push notifications](https://blog.developer.adobe.com/securing-push-notifications-in-mobile-apps-a23b6c20139e)
- A 2022 ENISA workshop presentation describes the pattern of sending a push without payload and pulling content from the server — [ENISA workshop slides](https://www.enisa.europa.eu/events/personal-data-sharing-workshop-2022/presentations/fatbardh_veseli_enisa-workshop-2022-10-07.pdf/@@download/file/Fatbardh_Veseli_ENISA%20Workshop%202022-10-07.pdf)

### Inferences
- Member–expert messages are health data in practice (special-category data under GDPR). A vendor chat means a new processor and sub-processor chain for that data; even with a Dublin primary region, the subprocessor list shows non-EU locations, so a transfer and DPA review is needed before buying. Self-hosting on Neon/EU avoids this.
- Scope for a self-built v1 is modest because the use case is 1:1, low volume and tied to bookings: messages table, REST for history and send, SSE or WebSocket for live delivery, silent/"you have a new message" push, read receipts optional. The expensive part is two native chat UIs with attachment handling and offline queueing, which a vendor UI kit would otherwise provide.
- Push: both platforms require APNs and FCM at the transport level whatever provider sits on top. Direct integration (APNs token auth, FCM HTTP v1) from the existing API keeps device tokens and notification metadata in-house; a provider adds dashboards and segmentation that a small care app may not need yet. Either way, use generic text ("New message from your specialist") and fetch content after open.
- Messaging belongs to the full Eleva app only. In Shape A the diary app needs at most local reminder notifications (no server push at all in no-account mode), which simplifies its privacy posture. In Shape B one push registration serves everything.

### Gaps
- Sendbird, TalkJS and Matrix (regions, native SDK status, pricing) could not be researched before the search budget ran out; the TalkJS data-regions URL tried returned 404. Stream pricing and whether Stream offers health-sector contractual terms for EU customers were not verified.
- FCM HTTP v1 and APNs token-based auth specifics, and a comparison with push providers (OneSignal and others), were not sourced.
- No engineering-week estimates for a self-built native chat were found from a neutral source.

## 9. Video lecture playback for the academy

### Takeaway
HLS through AVPlayer on iOS and Media3 ExoPlayer on Android is the standard native path, with platform download APIs for offline. Among providers, Mux added DRM-protected offline downloads to both native player SDKs in 2026, Bunny Stream documents Widevine/FairPlay DRM as a paid tier and is EU-based, and Cloudflare Stream's DRM support is disputed across sources.

### Cited Findings
- iOS offline HLS: Apple's sample uses `AVAssetDownloadConfiguration` and `AVAssetDownloadTask` to persist HLS streams for offline playback; that sample does not cover FairPlay Streaming content, for which a separate sample exists — [Apple: Using AVFoundation to play and persist HTTP Live Streams](https://developer.apple.com/documentation/avfoundation/using-avfoundation-to-play-and-persist-http-live-streams)
- Android: Media3's `OfflineLicenseHelper` downloads, renews and releases offline Widevine licenses — [Android: OfflineLicenseHelper](https://developer.android.com/reference/androidx/media3/exoplayer/drm/OfflineLicenseHelper)
- Media3 DRM support table: Widevine "cbcs" from Android 7.1 (API 25) for DASH and HLS with fMP4 segments only — [Android: Media3 DRM](https://developer.android.com/media/media3/exoplayer/drm)
- Mux Player Swift v1.6.0 (5 May 2026) added DRM-protected offline downloads via `MuxOfflineAccessManager`, including FairPlay — [Mux changelog: Player Swift DRM offline](https://www.mux.com/docs/changelog/mux-player-swift-drm-offline)
- Mux Player Android (changelog 13 August 2026) supports downloading and playing Widevine-protected assets via `MuxDownloadManager` — [Mux changelog: Player Android DRM offline](https://www.mux.com/docs/changelog/mux-player-android-drm-offline)
- Mux DRM supports offline playback through persistent license tokens configured with JWT claims (5 May 2026) — [Mux changelog: DRM offline playback support](https://www.mux.com/docs/changelog/drm-offline-playback-support)
- Bunny Stream has two protection tiers, MediaCage Basic DRM (included) and MediaCage Enterprise DRM (Widevine and FairPlay; reported as a $99 monthly base plus per-license fees from $0.005) — [Bunny Stream DRM docs](https://docs.bunny.net/stream/drm)
- Cloudflare Stream: one 2026 comparison says "no true DRM (Widevine/FairPlay), signed URLs only"; other comparisons say limited or unavailable — [PkgPulse comparison 2026](https://www.pkgpulse.com/guides/mux-vs-cloudflare-stream-vs-bunny-stream-video-cdn-2026)

### Inferences
- Academy lectures are educational content, not health records, so a non-EU video vendor is a lighter compliance question than chat; signed playback URLs tied to the Better Auth session are probably enough for v1, with DRM and offline as later options.
- Playback is one screen per platform using system players; it is cheap relative to video calls or chat and does not materially change the one-versus-two comparison. It lives only in the full app.
- If offline lecture downloads matter, Mux now has the shortest native path (vendor SDK handles license persistence on both platforms); with Bunny or self-managed HLS the team implements `AVAssetDownloadTask` and Media3 downloads directly.

### Gaps
- Current Mux, Cloudflare Stream and Bunny list prices and EU delivery/residency options were not verified from vendor pricing pages; third-party cost comparisons disagreed widely and are not cited.
- Bunny's native SDK/offline story and Cloudflare Stream's current DRM status were not confirmed from primary docs.

## 10. Release engineering for one versus two apps

### Takeaway
Tooling (Xcode Cloud, GitHub Actions, phased/staged rollouts, Sentry) scales to two apps with mostly duplicated configuration rather than new invention, but every store-facing task doubles: listings, privacy labels, review cycles, signing assets and rollout monitoring, times two platforms. The measurable argument for a small separate app is install conversion and independent release cadence; the argument against is four store pipelines instead of two.

### Cited Findings
- App Store phased release for automatic updates rolls out over 7 days at 1%, 2%, 5%, 10%, 20%, 50%, 100%; it can be paused for a total of 30 days; users can still manually download the update at any time — [Apple: Release a version update in phases](https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases)
- Google Play staged rollouts: the developer chooses and manually increases the percentage; a halt stops further distribution; "Staged rollouts can only be used for app updates, not when publishing an app for the first time"; country targeting is available — [Google Play Console help: staged rollouts](https://support.google.com/googleplay/android-developer/answer/6346149?hl=en)
- Google Play personal developer accounts created after 13 November 2023 must run a closed test with at least 12 testers opted in continuously for 14 days before production access; organization accounts are exempt — [Google Play Console help: testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)
- App Review timing: third-party tracking in 2026 reports roughly 6–15 hours in queue plus 1–2 hours in review, while developers also report first submissions waiting more than a week — [newly.app: how fast App Review actually is](https://newly.app/guides/how-fast-app-review-actually-is); [Apple forums 816818](https://developer.apple.com/forums/thread/816818)
- Mac App Store review times were reported as increasing in March 2026 — [Michael Tsai blog](https://mjtsai.com/blog/2026/03/02/mac-app-store-review-times-increasing/)
- Xcode Cloud includes 25 free compute hours per month with the developer program according to 2026 comparisons; GitHub lowered hosted-runner prices by up to 39% in January 2026 (third-party figures) — [The Swift Kit: Xcode Cloud vs GitHub Actions vs Bitrise](https://theswiftk.it.com/blog/xcode-cloud-vs-github-actions-vs-bitrise)
- Binary size and installs: Google Play data showed install conversion falls about 1% for every 6 MB added to an APK (apps under 100 MB), with a larger effect in emerging markets — [Google Play: Shrinking APKs, growing installs](https://medium.com/googleplaydev/shrinking-apks-growing-installs-5d3fcba23ce2)
- Counter-evidence: one developer who cut 42 MB measured a 0.38% relative drop in conversion rather than a gain (170k+ listing visitors) — [Medium: Reduced app size by 42 MB](https://medium.com/@martinmazanec/shrinked-app-size-by-42mb-was-it-worth-it-ac34f76b14c7)
- Sentry's Size Analysis for mobile builds is generally available and reports the size impact of changes; a Sentry React Native PR measured the Cocoa SDK update at roughly 0.9 MiB on iOS builds (indicative only) — [Sentry Size Analysis](https://sentry.io/product/size-analysis); [sentry-react-native PR 3802](https://www.github.com/getsentry/sentry-react-native/pull/3802)
- App Review guideline 4.2: apps "should include features, content, and UI that elevate it beyond a repackaged website" — [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

### Inferences
- Shape A = four store binaries (2 apps x 2 platforms), four listings and privacy/data-safety declarations, four signing setups, four crash dashboards. With a monorepo and shared modules, CI can build all four from one pipeline definition, so the recurring cost is mostly human attention: release notes, review responses, rollout watching, and regression testing of two shells.
- Shape A's benefit is decoupling: a bug in booking, payments or video cannot block a diary fix, and the diary app can ship weekly while the big app moves on a slower, more heavily tested train. In Shape B, any release ships the full binary through review, and a rejection on, say, payments or account deletion holds back diary changes; feature flags and phased rollout mitigate but do not remove this coupling.
- The diary-only binary avoids WebRTC, video player, chat and Stripe SDKs, so it will be much smaller; the Google data suggests a real but modest conversion benefit, and the contrary single-developer result warns against over-weighting it.
- A health-data diary with HealthKit/Health Connect needs the health declarations (Play Console health apps declaration; App Store privacy labels) in whichever app contains it; in Shape B the all-in-one app carries every sensitive declaration at once (health, camera, microphone, payments), which increases review surface per submission.
- For a first native launch, the lowest-risk sequence under either shape is to ship the diary first (small, offline, no payments, no video), because it exercises signing, review, auth, sync and crash reporting with minimal scope. Under the modular structure in section 6 this choice does not lock in A or B.

### Gaps
- No engineering-blog evidence was found that quantifies how a large multi-feature app slows release cadence versus a small one; that part of the comparison is reasoning only.
- Apple's own published review-time statement was not fetched directly (secondary sources quoted both "90% in 24 hours" and "90% within 48 hours"); fastlane maintenance status, Gradle Play Publisher status, Xcode Cloud list prices, GitHub macOS runner rates, Sentry native SDK size figures and native feature-flag SDK options were not verified.
- Whether the Play 12-tester rule applies per app or per account for personal accounts was not confirmed; it does not apply to organization accounts.

## 11. Lightweight alternatives to a full second app

### Takeaway
None of the lightweight surfaces replaces a standalone diary app. App Clips cannot use HealthKit, App Intents or background activity and must mirror a full app; Android Instant Apps were shut down in December 2025; interactive widgets give one-tap logging but only for people who already installed the main app. They are complements to Shape B, not a way to get Shape A's store presence.

### Cited Findings
- An App Clip "is a lightweight version of your app" and "require[s] a corresponding full app that offers at least the same functionality as the App Clip"; both are built from the same Xcode project — [Apple: Creating an App Clip with Xcode](https://developer.apple.com/documentation/appclip/creating-an-app-clip-with-xcode)
- App Clip size limits for the uncompressed binary are listed as 10 MB, 15 MB, and up to 100 MB on iOS 17 and later when additional conditions are met (the App Store Connect demo link also allows 100 MB with physical invocations) — [Apple: Choosing the right functionality for your App Clip](https://developer.apple.com/documentation/appclip/choosing-the-right-functionality-for-your-app-clip)
- In App Clips these frameworks "provide no functionality at runtime": App Intents, Background Tasks, CallKit, HealthKit, Contacts, EventKit and others; App Clips "can't perform background activity" including background URLSession networking — [Apple: Choosing the right functionality for your App Clip](https://developer.apple.com/documentation/appclip/choosing-the-right-functionality-for-your-app-clip)
- App Clip to full app migration: shared App Group container for local data, the keychain for sensitive data, and Sign in with Apple for seamless login; an App Clip can read (not write) a public CloudKit database and cannot use private iCloud containers — [Apple: Sharing data between your App Clip and your full app](https://developer.apple.com/documentation/appclip/sharing-data-between-your-app-clip-and-your-full-app)
- Google Play Instant: "Starting December 2025, Instant Apps cannot be published through Google Play, and all Google Play services Instant APIs will no longer work. Users will no longer be served Instant Apps by Play using any mechanism." Google recommends deep links into the regular app (page last updated 24 June 2026) — [Android: Google Play Instant](https://developer.android.com/topic/google-play-instant)
- iOS widgets and Live Activities "can include buttons and toggles to offer specific app functionality without launching the app" in systemSmall, systemMedium and systemLarge sizes; on a locked device they are inactive until the person authenticates — [Apple: Adding interactivity to widgets and Live Activities](https://developer.apple.com/documentation/widgetkit/adding-interactivity-to-widgets-and-live-activities)
- Extensions and widgets can depend on the same local Swift package modules as the app, importing only what they need — [Swift with Majid: microapps architecture](https://swiftwithmajid.com/2022/01/12/microapps-architecture-in-swift-spm-basics/)

### Inferences
- An App Clip could serve as a "try the diary" entry from a QR code in a clinic or a link on eleva.care, handing its local entries to the full app through an App Group on install. It is a marketing/acquisition surface for Shape B, iOS-only, with no Android counterpart now that Instant Apps are gone, and it cannot provide HealthKit or reminders.
- Home-screen and lock-screen widgets with "log void" / "log drink" buttons (and the Android equivalent with Glance widgets) deliver most of the day-to-day speed advantage of a small dedicated app from inside a single big app. They require the diary module to be usable from an extension process, which the modular structure in section 6 already provides.
- What a separate app uniquely gives is discoverability and positioning: its own store listing, keywords, screenshots, ratings and a "no account needed" promise, plus a small download. Widgets, App Clips and watch apps do not create a second store listing.
- Watch logging (Apple Watch, Wear OS) is additional per-platform work on top of either shape and is best treated as a later enhancement.

### Gaps
- Apple Watch and Wear OS quick-logging capabilities (complications, tiles, standalone sync) and Android Glance widget interactivity were not researched with sources.
- The exact OS-version mapping of the 10 MB and 15 MB App Clip limits and the precise conditions for the 100 MB tier were not captured verbatim.
- General limitation of these notes: web search capacity for the session was exhausted before Sendbird/TalkJS/Matrix, watch platforms, and several pricing pages could be checked; those items should be re-verified before the final report relies on them.
