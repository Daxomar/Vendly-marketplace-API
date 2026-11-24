// The Express app. ORDER MATTERS here: each request passes through these
// steps top to bottom.
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth.js";
import { corsOptions } from "./config/cors.js";
import { requestId } from "./middleware/requestId.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import routes from "./routes/index.js";

const app = express();

// Real client IPs behind a proxy/Cloudflare (needed for rate limiting)
app.set("trust proxy", 1);

// 1. Request id on every request (shows up in error responses and logs)
app.use(requestId);

// 2. CORS: which websites may call this API with cookies
app.use(cors(corsOptions));

// 3. Better Auth handles everything under /api/auth/* (sign-up, sign-in,
//    sessions, verification, admin tools). It MUST come before
//    express.json(), because it reads the request body itself.
app.all("/api/auth/{*any}", toNodeHandler(auth));

// 4. (Stage 4) Paystack webhook goes here, also before express.json(),
//    because verifying its signature needs the raw, untouched body.

// 5. Body + cookie parsing for our own routes
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

// 6. Health checks (used by Docker/hosting to see if the API is alive)
app.get("/health", (_req, res) => res.json({ ok: true }));

// 7. Our API
app.use("/api/v1", routes);

// 8. Unknown routes → JSON 404
app.use(notFoundHandler);

// 9. Errors → JSON. Always last.
app.use(errorHandler);

export default app;
