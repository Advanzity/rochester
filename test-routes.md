# Route Testing Checklist

## After Deployment to Netlify

Test each of these URLs directly in your browser (replace `yourdomain.netlify.app` with your actual domain):

### Application Pages ✓

Test direct URL access (should NOT return 404):

- [ ] `https://yourdomain.netlify.app/`
  - Should load: Home page

- [ ] `https://yourdomain.netlify.app/gold-scrap`
  - Should load: Gold Scrap Pricing page
  - Test: Click "Update All Prices" button

- [ ] `https://yourdomain.netlify.app/market-board`
  - Should load: Market Board dashboard

### Page Refresh Test ✓

1. Navigate to `https://yourdomain.netlify.app/gold-scrap`
2. Press F5 or refresh browser
3. Should reload the same page (NOT 404)

### Back Button Test ✓

1. Navigate: Home → Gold Scrap → Market Board
2. Click browser back button twice
3. Should return to Home (NOT 404)

### API Endpoints ✓

Test in browser or with curl:

- [ ] `https://yourdomain.netlify.app/api/scrap-prices`
  - Should return: JSON with prices array
  - Expected: `{"prices": [...]}`

- [ ] `https://yourdomain.netlify.app/.netlify/functions/get-gold-spot-price`
  - Should return: JSON with current gold price
  - Expected: `{"price": 2650, "timestamp": ..., "source": "..."}`

### CURL Tests

```bash
# Get all scrap prices
curl https://yourdomain.netlify.app/api/scrap-prices

# Get live gold spot price
curl https://yourdomain.netlify.app/.netlify/functions/get-gold-spot-price

# Update all prices (POST)
curl -X POST https://yourdomain.netlify.app/.netlify/functions/update-scrap-prices
```

### Client-Side Navigation ✓

1. Start at Home page
2. Click navigation links
3. All transitions should be smooth (no page reload)
4. URLs should update in address bar

### Deep Link Test ✓

Share any URL with someone (or open in incognito):

- `https://yourdomain.netlify.app/gold-scrap`
- `https://yourdomain.netlify.app/market-board`

Both should load directly without redirecting to home.

### Mobile Test ✓

- [ ] Test on mobile device
- [ ] All pages accessible
- [ ] No 404 errors
- [ ] Navigation works

### Expected Results

✅ **Success Indicators:**
- All pages load without 404 errors
- Refresh works on any page
- Back/forward buttons work correctly
- API endpoints return JSON data
- Client-side navigation is smooth
- Deep links work from external sources

❌ **Failure Indicators:**
- 404 error on direct page access
- 404 after refresh
- Page not found when using back button
- API endpoints return 404
- Broken navigation

## Common Issues & Solutions

### Issue: 404 on `/gold-scrap`

**Check:**
1. Is `netlify.toml` in project root?
2. Does build log show files copied?
3. Is `_redirects` in `public/` folder?

**Fix:** Redeploy and check Netlify deploy log

### Issue: API returns 404

**Check:**
1. Are functions in `netlify/functions/`?
2. Is `@netlify/functions` installed?
3. Check function logs in Netlify dashboard

**Fix:** Verify environment variables are set

### Issue: Page loads but data doesn't

**Check:**
1. Open browser console (F12)
2. Check Network tab for failed requests
3. Look for CORS errors

**Fix:** Verify Supabase environment variables

## Success Criteria

All checks should pass:

- [x] Home page loads on direct access
- [x] Gold Scrap page loads on direct access
- [x] Market Board page loads on direct access
- [x] Page refresh works (no 404)
- [x] Browser back button works
- [x] API endpoints return data
- [x] Client-side navigation smooth
- [x] Deep links work
- [x] Mobile access works

## Performance Test

After routes are working:

1. Run Lighthouse test (Chrome DevTools)
2. Check Performance score
3. Verify no broken links
4. Test page load speed

## Final Verification

```bash
# Check all routes return 200 status
curl -I https://yourdomain.netlify.app/
curl -I https://yourdomain.netlify.app/gold-scrap
curl -I https://yourdomain.netlify.app/market-board
curl -I https://yourdomain.netlify.app/api/scrap-prices
```

All should return: `HTTP/2 200`
