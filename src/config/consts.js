// consts.js
// --- 1. Security & Authentication ---
export const AUTH = Object.freeze({
  ROLES: {
    ADMIN: "admin",
    CUSTOMER: "customer",
  },
  TOKEN_EXPIRY: {
    ACCESS: "15m",
    REFRESH: "7d",
  },
  ALGORITHM: "HS256",
});

// --- 2. Database Entities & Limits ---
export const DB = Object.freeze({
  TABLES: {
    USERS: "users",
    PRODUCTS: "products",
    CATEGORIES: "categories",
    INVENTORY: "inventories",
    CARTS: "carts",
    CART_ITEMS: "cart_items",
    ORDERS: "orders",
    ORDER_ITEMS: "order_items",
    PAYMENTS: "payments",
    AUDIT_LOGS: "audit_logs",
  },
  // Pagination standard defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 50,
  },
});

// --- 3. Order & Inventory Lifecycle States ---
export const ORDER_STATUS = Object.freeze({
  PENDING: "pending", // Order created, awaiting payment
  PAID: "paid", // Payment successful
  PROCESSING: "processing", // In the warehouse
  SHIPPED: "shipped", // En route to customer
  DELIVERED: "delivered", // Completed
  CANCELLED: "cancelled", // Cancelled by user or admin
  REFUNDED: "refunded", // Money returned
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
});

export const PAYMENT_PROVIDERS = Object.freeze({
  STRIPE: "stripe",
  RAZORPAY: "razorpay",
});

// --- 4. Caching & Redis Strategies ---
// Centralized TTLs (Time-To-Live in seconds) and Key Namespaces
export const CACHE = Object.freeze({
  TTL: {
    ONE_MINUTE: 60,
    FIVE_MINUTES: 300,
    ONE_HOUR: 3600,
    ONE_DAY: 86400,
  },
  PREFIXES: {
    PRODUCT_CATALOG: "catalog:products:",
    PRODUCT_DETAILS: "catalog:detail:",
    CATEGORIES: "catalog:categories",
    USER_SESSION: "session:user:",
    RATE_LIMIT: "ratelimit:",
  },
});

// --- 5. System Infrastructure (Bonus Items) ---
export const RATE_LIMIT = Object.freeze({
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: {
    PUBLIC: 100, // General browsing
    AUTH: 5, // Login/Register brute-force defense
    CHECKOUT: 3, // Prevent payment spamming
  },
});

// For your Audit Log feature (Demonstrates strong enterprise compliance)
export const AUDIT_ACTIONS = Object.freeze({
  USER_LOGIN: "user.login",
  USER_REGISTER: "user.register",
  PRODUCT_CREATE: "product.create",
  PRODUCT_UPDATE: "product.update",
  PRODUCT_DELETE: "product.delete",
  INVENTORY_STOCK_OUT: "inventory.stock_out",
  ORDER_PLACE: "order.place",
  ORDER_STATUS_CHANGE: "order.status_change",
  PAYMENT_EXECUTE: "payment.execute",
});

// --- 6. Event Notification Channels ---
export const NOTIFICATION_TEMPLATES = Object.freeze({
  WELCOME_EMAIL: "WELCOME_EMAIL",
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  PASSWORD_RESET: "PASSWORD_RESET",
  ORDER_CONFIRMATION: "ORDER_CONFIRMATION",
  LOW_STOCK_ALERT: "LOW_STOCK_ALERT",
});
