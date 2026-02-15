# Baba Selo Blog: Phase 1 Content Strategy (30–50 Pages)

**Goal:** Prove the template. High-quality, indexed, useful pages that rank—not thin pSEO.

**Baba Selo value prop:** AI recipe generator with chat, save-to-profile, AI food images. Free tier + Pro.

---

## Topic Clusters & Hub Structure

```
                    [AI Recipe Generator Hub]
                    /blog + comparison article
                           |
        +------------------+------------------+
        |                  |                  |
   [How-to]           [Use Cases]        [Concerns]
   - prompting        - leftovers         - safety
   - mistakes         - meal planning     - saving
   - vs ChatGPT       - dietary           - quality
                      - ingredients
```

---

## Phase 1 Page Map (30–50 pages)

### Cluster 1: Core / Comparison (4 pages) ✅
| Slug | Target Keyword | Status |
|------|----------------|--------|
| ai-recipe-generator-comparison | AI recipe generator comparison | ✅ |
| how-to-use-ai-recipe-generators-guide | how to use AI recipe generator | ✅ |
| ai-recipe-generator-vs-chatgpt | AI recipe generator vs ChatGPT | ✅ |
| best-ai-recipe-generator | best AI recipe generator | ✅ |

### Cluster 2: Use Cases (12–15 pages)
| Slug | Target Keyword | Status |
|------|----------------|--------|
| recipes-from-leftovers-ai | AI recipe from leftovers | ✅ |
| ai-recipe-generator-meal-planning | AI recipe meal planning | ✅ |
| ai-recipe-generators-vegan-keto-glutenfree | AI recipe generator vegan keto | ✅ |
| ai-recipe-generator-quick-meals | AI recipe 15 minute meals | ✅ |
| ai-recipe-generator-one-pot | one pot AI recipe | ✅ |
| ai-recipe-generator-budget | cheap meals AI recipe | ✅ |
| ai-recipe-generator-family-dinner | family dinner AI recipe | ✅ |
| ai-recipe-generator-chicken | chicken recipe AI | ✅ |
| ai-recipe-generator-ground-beef | ground beef recipe AI | ✅ |
| ai-recipe-generator-pasta | pasta recipe AI | ✅ |
| ai-recipe-generator-rice | rice recipe AI | ✅ |
| ai-recipe-generator-eggs | egg recipe AI | ✅ |

### Cluster 3: Concerns & Trust (6–8 pages)
| Slug | Target Keyword | Status |
|------|----------------|--------|
| ai-generated-recipes-safe | are AI recipes safe | ✅ |
| mistakes-using-ai-recipes | AI recipe mistakes | ✅ |
| save-ai-generated-recipes | save AI recipes | ✅ |
| ai-recipe-generator-accurate | AI recipe accuracy | ✅ |
| ai-recipe-substitutions | AI recipe substitutions | ✅ |
| ai-recipe-scaling-portions | scale AI recipe portions | ✅ |

### Cluster 4: Long-Tail / Specific (8–12 pages)
| Slug | Target Keyword | Status |
|------|----------------|--------|
| ai-recipe-generator-gluten-free | AI recipe gluten free | ✅ |
| ai-recipe-generator-vegan | AI recipe generator vegan | ✅ |
| ai-recipe-generator-keto | AI recipe generator keto | ✅ |
| ai-recipe-generator-dairy-free | AI recipe dairy free | ✅ |
| ai-recipe-generator-low-carb | AI recipe low carb | ✅ |
| ai-recipe-generator-mediterranean | Mediterranean AI recipe | ✅ |
| ai-recipe-generator-asian | Asian recipe AI | ✅ |
| ai-recipe-generator-dessert | dessert AI recipe | ✅ |

---

## Internal Linking Rules (Every Post)

1. **Contextual links (2–4 per post):** Inline links in body text to related posts. Use descriptive anchor text (e.g. "our meal planning guide" not "click here").

2. **RelatedArticles (3 per post):** Always 3 related slugs in `RELATED_ARTICLES`. Mix: 1 from same cluster, 1–2 from adjacent clusters.

3. **Hub links:** Comparison + how-to guide should link out to most sub-pages. Long-tail pages link back to hub + 2–3 siblings.

4. **Baba Selo CTA:** Every post mentions Baba Selo at least once with link to `/`.

---

## LLM Optimization

- **Entity clarity:** Use "Baba Selo" and "AI recipe generator" consistently. LLMs index entities.
- **Structured answers:** Use H2/H3 for scannable sections. LLMs extract these.
- **FAQ-style content:** Consider adding "What is...?" / "How does...?" sections where natural.
- **Schema (future):** Article, FAQPage schema for rich snippets.

---

## Quality Bar (No Thin Content)

Each new page must have:
- **400+ words** of unique, useful content
- **2–4 contextual internal links** in body
- **1 Baba Selo mention** with link
- **Distinct angle**—not just keyword swap of another post
- **Real value**—answer the query better than a generic AI response would

---

## Implementation Checklist (New Posts)

- [ ] Create `app/blog/posts/{slug}.tsx`
- [ ] Add to `posts-data.json`
- [ ] Add to `RELATED_ARTICLES` (and ensure 2–3 other posts link *to* this one)
- [ ] Add 2–4 contextual links *within* the post body
- [ ] Run `npm run generate-blog-images {slug}`
- [ ] Verify sitemap includes new URL

---

## Validation (Phase 1 Success)

- 30–50 pages indexed in Search Console
- Impressions within 2–6 weeks
- Some pages ranking top 50
- No mass soft-404s or thin content flags

**Do not scale to 300+ until this passes.**
