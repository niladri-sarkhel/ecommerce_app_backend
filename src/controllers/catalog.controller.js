import { Product } from "#models";

/**
 * Controller handling all catalog-related query and autocomplete requests.
 */
export class CatalogController {
  /**
   * Generates a list of live search suggestions using an optimized multi-priority regex match.
   * Note: Defined as an arrow function to preserve 'this' context when used as a route handler.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getLiveSuggestions = async (req, res) => {
    try {
      const { query, limit = 8 } = req.query;

      if (!query || query.trim() === "") {
        return res.status(200).json({ success: true, total: 0, data: [] });
      }

      const cleanQuery = query.trim();
      const maxResults = parseInt(limit, 10);

      // Escape special characters to prevent regex injection attacks
      const escapedQuery = cleanQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");

      // Build out the search criteria using instance call
      const searchConditions = this.#buildSearchConditions(
        cleanQuery,
        escapedQuery,
      );

      // Run database query and matching count in parallel for maximum performance
      const [products, totalMatches] = await Promise.all([
        Product.find({ $or: searchConditions })
          .populate("identity.brandId")
          .limit(maxResults)
          .lean(),
        Product.countDocuments({ $or: searchConditions }),
      ]);

      return res.status(200).json({
        success: true,
        total: totalMatches, // 👈 This will show the total matches (e.g., 103) in Bruno!
        data: products, // This returns the limited list (e.g., 8) to keep the UI fast
      });
    } catch (error) {
      console.error("Autocomplete backend error in CatalogController:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error fetching suggestions.",
      });
    }
  };

  /**
   * Private helper method to construct the regex query array.
   * Keeps the main handler clean and easy to test.
   * @private
   */
  #buildSearchConditions(rawQuery, escapedQuery) {
    // Breakdown tokens to support mixed multi-word inputs (e.g., "Apple Pro")
    const words = escapedQuery.split(/\s+/).filter(Boolean);
    const multiWordRegex = words.map((word) => `(?=.*${word})`).join("");

    return [
      // Match 1: Exact GTIN barcode entry
      { "identity.gtin": rawQuery },

      // Match 2: Model starts with the phrase (Anchored search - fast!)
      { "identity.model": { $regex: new RegExp(`^${escapedQuery}`, "i") } },

      // Match 3: Model matches multi-word criteria anywhere in text
      { "identity.model": { $regex: new RegExp(multiWordRegex, "i") } },

      // Match 4: Slug contains the text
      { "identity.slug": { $regex: new RegExp(escapedQuery, "i") } },
    ];
  }
}
