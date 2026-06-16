import express from "express";
import { AppDataSource } from "./data-source";
import { registerRoutes } from "./routes";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
    registerRoutes(app);

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });
