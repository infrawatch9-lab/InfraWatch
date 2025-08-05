import app from "./app.module";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.get("/", (req, res) => {
  res.send("Welcome to InfraWatch API");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
