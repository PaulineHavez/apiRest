import express from "express";
import fs from "fs";
import { Request, Response } from "express";
import { z } from "zod";
const { readFileSync, writeFile } = require("fs");

const pathDataFile: string = "src/database/data.json";
const app = express();
const port = 3000;

// Middleware pour parser le JSON
app.use(express.json());

const objectDataSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string(),
  year: z.string(),
});

type ObjectData = z.infer<typeof objectDataSchema>;

const updateObjectDataSchema = objectDataSchema
  .partial()
  .extend({ id: z.number() });

type UpdateObjectData = z.infer<typeof updateObjectDataSchema>;

// require : une fois le serveur démarré, met en cache les données donc à ne pas utiliser en cas de changement
app.get("/", (req, res) => {
  const data = require("./database/data.json");
  res.status(201).send(data);
});

//readFile : lecture asynchrone du fichier, pas la méthhode la plus optimale pour récupérer un fichier contenant beaucoup de données
app.get("/data", (req, res) => {
  fs.readFile(pathDataFile, "utf8", (error, data) => {
    if (error) {
      console.error("Error reading file", error);
      res.status(500).send("Error reading file");
      return;
    }
    res.status(201).send(JSON.parse(data));
  });
});

app.get("/data/:id", (req, res) => {
  const id: number = parseInt(req.params.id);
  const data = require("./database/data.json");
  const foundData = data.find((element: ObjectData) => element.id == id);
  if (!foundData) {
    res.status(404).send("Not Found");
  }
  res.status(201).send(foundData);
});

//readFileSync : récupère les données de manière synchrone (bloque l'exécution du reste en attendant les données)
// safeParse : renvoie seulement les données attendues correspondantes, permet de gérer les erreurs
app.post("/newObject", (req, res) => {
  const data = readFileSync("src/database/data.json");
  const parsedData: ObjectData[] = JSON.parse(data);
  const result = objectDataSchema.safeParse({ ...req.body });
  if (!result.success) {
    res
      .status(400)
      .json({ error: "Invalid Data", details: result.error.issues });
    return;
  }
  const validatedData: ObjectData = result.data;

  parsedData.push(validatedData);
  writeFile(
    pathDataFile,
    JSON.stringify(parsedData, null, 2),
    (error: NodeJS.ErrnoException) => {
      if (error) {
        res.status(500).send("Error writing file");
        return;
      }
    }
  );
  res.status(201).send(req.body);
});

app.put("/data/toModify/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const result = updateObjectDataSchema.safeParse({ ...req.body, id });
  if (!result.success) {
    res
      .status(400)
      .json({ error: "Invalid Data", details: result.error.issues });
    return;
  }
  const validatedData: UpdateObjectData = result.data;
  try {
    const data = readFileSync("src/database/data.json", "utf8");
    const parsedData: ObjectData[] = JSON.parse(data);
    const elementIndex = parsedData.findIndex((elem) => elem.id === id);
    if (elementIndex === -1) {
      res.status(404).send("Not found");
      return;
    }
    parsedData[elementIndex] = {
      ...parsedData[elementIndex],
      ...validatedData,
    };
    writeFile(
      "src/database/data.json",
      JSON.stringify(parsedData, null, 2),
      (error: NodeJS.ErrnoException) => {
        if (error) {
          res.status(500).send("An error occurred while writing the file");
          return;
        }
        res.json(parsedData[elementIndex]);
      }
    );
  } catch (error) {
    res.status(500).send("An error occurred while processing the request");
  }
});

app.delete("/data/toDelete/:id", (req, res) => {
  const id: number = parseInt(req.params.id);
  const data = readFileSync("src/database/data.json");
  const parsedData: ObjectData[] = JSON.parse(data);
  const filteredData = parsedData.filter((element) => element.id != id);
  writeFile(
    pathDataFile,
    JSON.stringify(filteredData, null, 2),
    (error: NodeJS.ErrnoException) => {
      if (error) {
        console.error("Error writing file", error);
        res.status(500).send("Error writing file");
        return;
      }
    }
  );
  res.status(201);
});

app.listen(port, () => {
  return console.log(
    `Express server is listening at http://localhost:${port} 🚀`
  );
});
