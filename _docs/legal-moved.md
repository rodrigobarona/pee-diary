# Legal texts

The Privacy Policy, Terms of Use and Privacy Choices (EN, PT, ES; Portuguese
is the reference text) live with the website that publishes them, in the
private repo `rodrigobarona/eleva-diary-website`:
`apps/web/content/legal/{privacy-policy|terms|privacy-choices}.eleva-diary.{en|pt|es}.md`.

They are served at https://diary.eleva.care/{en|pt|es}/{privacy|terms|privacy-choices},
the URLs the app opens (`constants/legal.ts`). When the Terms of Use change,
bump `TERMS_VERSION` in `constants/legal.ts` so the app asks people to accept
them again.
