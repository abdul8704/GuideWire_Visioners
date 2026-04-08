import app from "./app.js";
import env from "./config/env.js";
import { verifyDbConnection } from "./db/pool.js";

app.listen(env.PORT, async () => {
    console.log(`Server running in ${env.NODE_ENV} mode on port http://localhost:${env.PORT}`);
    const db = await verifyDbConnection();
    console.log(`Database: ${db.message}`);
});