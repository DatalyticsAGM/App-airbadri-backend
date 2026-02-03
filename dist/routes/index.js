"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const auth_routes_1 = require("./auth.routes");
const bookings_routes_1 = require("./bookings.routes");
const favorites_routes_1 = require("./favorites.routes");
const host_routes_1 = require("./host.routes");
const notifications_routes_1 = require("./notifications.routes");
const properties_routes_1 = require("./properties.routes");
const reviews_routes_1 = require("./reviews.routes");
const search_routes_1 = require("./search.routes");
const users_routes_1 = require("./users.routes");
function registerRoutes(app) {
    app.use('/api/auth', (0, auth_routes_1.authRoutes)());
    app.use('/api/bookings', (0, bookings_routes_1.bookingsRoutes)());
    app.use('/api/favorites', (0, favorites_routes_1.favoritesRoutes)());
    app.use('/api/host', (0, host_routes_1.hostRoutes)());
    app.use('/api/notifications', (0, notifications_routes_1.notificationsRoutes)());
    app.use('/api/properties', (0, properties_routes_1.propertiesRoutes)());
    app.use('/api/reviews', (0, reviews_routes_1.reviewsRoutes)());
    app.use('/api/search', (0, search_routes_1.searchRoutes)());
    app.use('/api/users', (0, users_routes_1.usersRoutes)());
}
//# sourceMappingURL=index.js.map