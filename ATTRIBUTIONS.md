# Image Attributions

This document lists all images and visual assets used in the Communify project.

## Current Status

**No external images are currently being used in this project.**

The website uses:
- **CSS gradients** for visual elements (no attribution needed)
- **Icon libraries** (Lucide React, React Icons) - see package.json for license information
- **Placeholder elements** in the Gallery component (no actual images loaded)

## Referenced but Missing Images

The following image files are referenced in the codebase but are not present in the repository:

- `/icon-192.png` - Referenced in `public/manifest.json` for PWA icon (192x192px)
- `/icon-512.png` - Referenced in `public/manifest.json` for PWA icon (512x512px)

**Note**: These icon files need to be created and added to the `public/` directory for the Progressive Web App (PWA) manifest to work properly.

## Gallery Component

The Gallery component (`components/Gallery.tsx`) displays placeholder gradient backgrounds with text overlays. No actual images are loaded. If you add real images to the gallery in the future, please update this file with proper attributions.

## Future Image Usage

If you plan to add images to this project, please ensure:

1. **Stock Photos**: Use royalty-free images from:
   - Unsplash (https://unsplash.com/) - Free, no attribution required (but appreciated)
   - Pexels (https://www.pexels.com/) - Free, no attribution required
   - Pixabay (https://pixabay.com/) - Free, no attribution required

2. **Attribution Format**: For any images added, include:
   - Image source/URL
   - Photographer name (if applicable)
   - License type
   - Link to original image

3. **Example Entry**:
   ```markdown
   ### Community Food Distribution Image
   - **Source**: Unsplash
   - **Photographer**: John Doe
   - **URL**: https://unsplash.com/photos/example
   - **License**: Unsplash License (Free to use)
   ```

---

**Last Updated**: January 2025
**Status**: No images currently in use - all visual elements are CSS-based or icon libraries
