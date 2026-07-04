import { Product } from "#models";

export const CatalogService = {
  /**
   * High-performance search optimized for sellers matching against the global master catalog
   * Updates: Executes case-insensitive fuzzy text matching exclusively on the unique product slug.
   */
  async searchMasterCatalog({ query, page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;

    // Base criteria: Sellers should only see verified, non-deleted catalog items
    const filter = {
      "metadata.isActive": true,
      "metadata.isDeleted": false,
    };

    if (query) {
      const trimmedQuery = query.trim();

      // Fuzzy search on the slug (case-insensitive, partial matching)
      // e.g., searching "iconia" will match "acer-iconia-talk-s"
      filter["identity.slug"] = { $regex: trimmedQuery, $options: "i" };
    }

    // Run query and counter in parallel to maximize throughput
    const [products, totalItems] = await Promise.all([
      Product.find(filter)
        .populate("identity.brandId", "name logo")
        .select("identity catalog media") // Exclude deep hardware specs to keep payload light for selection grid
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return {
      products,
      pagination: {
        totalItems,
        currentPage: Number(page),
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  },
};
