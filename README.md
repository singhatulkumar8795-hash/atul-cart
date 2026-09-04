# Atul Cart

Free deployment-ready storefront for Atul Cart.

## Publish it for free

1. Create a new public GitHub repository named `atul-cart`.
2. Upload all files from this folder.
3. Open Netlify and choose **Add new site → Import an existing project**.
4. Select the GitHub repository. Build command is empty and publish directory is `/`.
5. Deploy the site. Netlify will provide a public HTTPS URL.
6. Replace the `<loc>` value in `sitemap.xml` with that public URL, then commit the change.
7. Add the URL in Google Search Console and request indexing.

The site does not need a paid domain to appear in Google. A free Netlify URL works.

## Free backend

Create a free Supabase project and run [`supabase-schema.sql`](./supabase-schema.sql) in its SQL editor. The current browser-only demo remains usable without Supabase; connect the frontend only after adding the project's public URL and anon key through a deployment environment variable.

## Payments

COD is available in the demo checkout. A live UPI/card gateway requires a merchant account and provider keys, so those credentials should be added only after the site is deployed.
