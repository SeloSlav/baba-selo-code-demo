# Duplicate URLs with Query Parameters (ref, utm_*, via)

**Note:** Google Search Console’s **URL parameters** feature has been **removed**. There is no longer a Settings → URL parameters page.

## What we use instead

1. **Canonical tag** – The homepage has `<link rel="canonical" href="https://www.babaselo.com/" />`, so Google treats `https://www.babaselo.com/?ref=xyz` as a duplicate of the main URL.

2. **Redirects** – `babaselo.com` and `http://` variants redirect to `https://www.babaselo.com/`.

3. **Re-crawling** – Google will consolidate duplicates over time. To speed it up:
   - Use **URL Inspection** on `https://www.babaselo.com/`
   - Click **Request indexing**

## If duplicates still appear

- Canonical tags are the main signal; no extra Search Console setting is available.
- Wait for re-crawls; consolidation can take days or weeks.
- Ensure the canonical tag is present in the HTML (view source on `/?ref=test`).
