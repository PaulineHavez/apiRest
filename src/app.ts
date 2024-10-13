import express from "express";
import fs from "fs";
const { readFileSync, writeFile } = require("fs");

type objectData = {
  id: number;
  name: string;
  color: string;
  year: string;
};

const pathDataFile: string = "src/database/data.json";
const app = express();
const port = 3000;
// Middleware pour parser le JSON
app.use(express.json());

app.get("/", (req, res) => {
  // une fois le serveur démarré, met en cache les données donc à ne pas utiliser en cas de changement
  const data = require("./database/data.json");
  res.send(data);
});

app.get("/data", (req, res) => {
  //lecture asynchrone du fichier, pas la méthhode la plus optimale pour récupérer un fichier contenant beaucoup de données
  fs.readFile(pathDataFile, "utf8", (error, data) => {
    if (error) {
      console.log(error);
      return;
    }
    res.send(JSON.parse(data));
  });
});

app.get("/data/:id", (req, res) => {
  const id: number = parseInt(req.params.id);
  const data = require("./database/data.json");
  const foundData = data.find((element: objectData) => element.id == id);
  res.send(foundData);
});

//readFileSync : récupère les données de manière synchrone (bloque l'exécution du reste en attendant les données)
app.post("/newObject", (req, res) => {
  const data = readFileSync("src/database/data.json");
  const parsedData = JSON.parse(data);
  parsedData.push(req.body);
  writeFile(pathDataFile, JSON.stringify(parsedData, null, 2), (error) => {
    if (error) {
      console.log("An error has occurred ", error);
      return;
    }
    console.log("Data written successfully to the JSON file");
  });
  res.send(req.body);
});

app.put("/data/toModify/:id", (req, res) => {
  const id = parseInt(req.params.id);
  console.log(req.body);
  const data = readFileSync("src/database/data.json");
  const parsedData: objectData[] = JSON.parse(data);
  for (const elem of parsedData) {
    if (elem.id == id) {
      elem.name = req.body.name;
      elem.color = req.body.color;
      elem.year = req.body.year;
    }
  }
  writeFile(pathDataFile, JSON.stringify(parsedData, null, 2), (error) => {
    if (error) {
      console.log("An error has occurred ", error);
      return;
    }
    console.log("Data written successfully to the JSON file");
  });
  res.send(parsedData);
});

app.delete("/data/toDelete/:id", (req, res) => {
  const id: number = parseInt(req.params.id);
  const data = readFileSync("src/database/data.json");
  const parsedData: objectData[] = JSON.parse(data);
  const filteredData = parsedData.filter((element) => element.id != id);
  writeFile(pathDataFile, JSON.stringify(filteredData, null, 2), (error) => {
    if (error) {
      console.log("An error has occurred ", error);
      return;
    }
    console.log("Data written successfully to the JSON file");
  });
  res.send(filteredData);
});

app.listen(port, () => {
  return console.log(
    `Express server is listening at http://localhost:${port} 🚀`
  );
});
