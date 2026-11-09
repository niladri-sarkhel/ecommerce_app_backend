import { Product } from "#models";

/**
 * Controller handling all catalog-related query and autocomplete requests.
 * Upgraded with delimiter-agnostic tokenizer and dynamic distance-1 Levenshtein regex generation.
 */
export class CatalogController {
  /**
   * Generates a list of live search suggestions using an optimized multi-priority regex match.
   * Preserves 'this' context for safe routing.
   */
  getLiveSuggestions = async (req, res) => {
    try {
      const { query, limit = 8 } = req.query;

      if (!query || query.trim() === "") {
        return res.status(200).json({ success: true, total: 0, data: [] });
      }

      const cleanQuery = query.trim();
      const maxResults = parseInt(limit, 10);

      // Construct search criteria with smart typo-tolerance and delimiter-flexibility
      const searchConditions = this.#buildSearchConditions(cleanQuery);

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
        total: totalMatches,
        data: products,
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
   * Static static lookup of a catalog entry by its unique GTIN barcode.
   * Used when sellers scan hardware barcodes or search exact GTIN numbers.
   */
  getGtinLookup = async (req, res) => {
    try {
      const { gtin } = req.params;

      if (!gtin) {
        return res
          .status(400)
          .json({ success: false, message: "GTIN barcode is required." });
      }

      const product = await Product.findOne({
        "identity.gtin": gtin.trim(),
        "metadata.isActive": true,
        "metadata.isDeleted": false,
      })
        .populate("identity.brandId")
        .lean();

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with GTIN "${gtin}" was not found in the master catalog.`,
        });
      }

      return res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      console.error("GTIN lookup error in CatalogController:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error performing barcode lookup.",
      });
    }
  };

  // ==========================================
  // 🛠️ ADMIN ONLY: MASTER CATALOG WRITES (CRUD STUBS)
  // ==========================================

  createCatalogProduct = async (req, res) => {
    try {
      // Placeholder structure for admin catalog additions
      return res
        .status(501)
        .json({ success: false, message: "Not implemented yet." });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  updateCatalogProduct = async (req, res) => {
    try {
      // Placeholder structure for admin catalog edits
      return res
        .status(501)
        .json({ success: false, message: "Not implemented yet." });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  deleteCatalogProduct = async (req, res) => {
    try {
      // Placeholder structure for admin catalog deletions
      return res
        .status(501)
        .json({ success: false, message: "Not implemented yet." });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  // ==========================================
  // 🔒 PRIVATE UTILITY METHODS
  // ==========================================

  /**
   * Safe regex escaper to protect against regex injection vulnerabilities.
   * @private
   */
  #escapeRegex(text) {
    return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  }

  /**
   * Dynamically constructs a distance-1 Levenshtein matching regex for any word.
   * Handles 1-character substitutions, omissions, and insertions.
   * @private
   */
  #getFuzzyRegexForToken(token) {
    const clean = token.toLowerCase();
    if (clean.length <= 3) {
      return this.#escapeRegex(clean);
    }

    const variants = new Set();
    variants.add(this.#escapeRegex(clean));

    // 1. Substitutions (allow any 1 character to vary, e.g. "sansung" -> "sa.sung")
    for (let i = 0; i < clean.length; i++) {
      const prefix = clean.slice(0, i);
      const suffix = clean.slice(i + 1);
      variants.add(this.#escapeRegex(prefix) + "." + this.#escapeRegex(suffix));
    }

    // 2. Deletions (character in query is dropped, e.g. "samsng" -> "samsung" via dropping the mismatch)
    for (let i = 0; i < clean.length; i++) {
      const prefix = clean.slice(0, i);
      const suffix = clean.slice(i + 1);
      variants.add(this.#escapeRegex(prefix) + this.#escapeRegex(suffix));
    }

    // 3. Insertions (allow an extra wild character, e.g. "samsug" -> "samsu.?g")
    for (let i = 1; i < clean.length; i++) {
      const prefix = clean.slice(0, i);
      const suffix = clean.slice(i);
      variants.add(
        this.#escapeRegex(prefix) + ".?" + this.#escapeRegex(suffix),
      );
    }

    return `(?:${Array.from(variants).join("|")})`;
  }

  /**
   * Private helper method to construct the regex query array.
   * Orders clauses by strictness to maximize MongoDB search index efficiency.
   * @private
   */
  #buildSearchConditions(rawQuery) {
    const escapedQuery = this.#escapeRegex(rawQuery);

    // Split the query by space, hyphens, slashes, or underscores to capture raw semantic tokens
    const tokens = rawQuery.split(/[\s\-_/]+/).filter(Boolean);

    // Fallback if split yields no usable tokens
    if (tokens.length === 0) {
      return [{ "identity.model": { $regex: new RegExp(escapedQuery, "i") } }];
    }

    // 1. Contiguous delimiter-tolerant phrase matching (e.g. "samsung galaxy" matches "samsung-galaxy" or "samsung_galaxy")
    const delimiterAgnosticPattern = tokens
      .map((t) => this.#escapeRegex(t))
      .join("[-_\\s/]*");
    const phraseRegex = new RegExp(delimiterAgnosticPattern, "i");

    // 2. Multi-word exact out-of-order match (e.g. "galaxy samsung" -> matches "Samsung Galaxy")
    const strictMultiWordPattern = tokens
      .map((t) => `(?=.*${this.#escapeRegex(t)})`)
      .join("");
    const strictMultiWordRegex = new RegExp(strictMultiWordPattern, "i");

    // 3. Multi-word fuzzy match with typo-tolerance (e.g. "sansung galaxy" -> matches "Samsung Galaxy")
    const fuzzyTokens = tokens.map((t) => this.#getFuzzyRegexForToken(t));
    const fuzzyMultiWordPattern = fuzzyTokens.map((f) => `(?=.*${f})`).join("");
    const fuzzyMultiWordRegex = new RegExp(fuzzyMultiWordPattern, "i");

    return [
      // Match 1: Exact GTIN barcode entry
      { "identity.gtin": rawQuery.trim() },

      // Match 2: Model starts with the exact contiguous phrase (Anchored search - highly optimized!)
      {
        "identity.model": {
          $regex: new RegExp(`^${delimiterAgnosticPattern}`, "i"),
        },
      },

      // Match 3: Model matches exact contiguous phrase anywhere
      { "identity.model": { $regex: phraseRegex } },

      // Match 4: Model matches strict out-of-order query tokens
      { "identity.model": { $regex: strictMultiWordRegex } },

      // Match 5: Ultimate Fallback - Out-of-order fuzzy lookahead match (Catch typos like 'sansung')
      { "identity.model": { $regex: fuzzyMultiWordRegex } },

      // Match 6: Slug substring matching
      { "identity.slug": { $regex: phraseRegex } },
    ];
  }
}
