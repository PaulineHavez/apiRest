import express from "express";
import { promises as fs } from "fs";
import { Request, Response } from "express";
import { z } from "zod";
const { readFileSync, writeFile } = require("fs");
import cors from "cors";

const pathDataFile: string = "src/database/data.json";
const app = express();
const port = 4000;

// Middleware pour parser le JSON
app.use(express.json());

//cors pour permettre les requêtes avec un navigateur (ici tout url confondu)
app.use(cors());
const corsOptions = {
  origin: "http://localhost:3000",
  methods: ["GET", "PUT", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

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
app.get("/", cors(corsOptions), (req: Request, res: Response) => {
  const data = require("./database/data.json");
  res.status(201).send(data);
});

//readFile : lecture asynchrone du fichier, pas la méthhode la plus optimale pour récupérer un fichier contenant beaucoup de données
app.get(
  "/data",
  cors(corsOptions),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await fs.readFile(pathDataFile, "utf8");
      res.status(201).send(JSON.parse(data));
    } catch (error) {
      console.error("Error reading file", error);
      res.status(500).send("Error reading file");
    }
  }
);

app.get(
  "/data/:id",
  cors(corsOptions),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id: number = parseInt(req.params.id);
      const data = await fs.readFile("src/database/data.json", "utf8");
      const parsedData: ObjectData[] = JSON.parse(data);
      const foundData = parsedData.find(
        (element: ObjectData) => element.id === id
      );

      if (!foundData) {
        res.status(404).send("Not Found");
        return;
      }
      res.status(200).json(foundData);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

// safeParse : renvoie seulement les données attendues correspondantes, permet de gérer les erreurs
app.post(
  "/newObject",
  cors(corsOptions),
  async (req: Request, res: Response): Promise<void> => {
    const data = await fs.readFile("src/database/data.json", "utf8");
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
          console.error(error);
          res.status(500).send("Error writing file");
          return;
        }
      }
    );
    res.status(201).send(JSON.stringify(req.body));
  }
);

//readFileSync : récupère les données de manière synchrone (bloque l'exécution du reste en attendant les données)
app.put(
  "/data/toModify/:id",
  cors(corsOptions),
  (req: Request, res: Response): void => {
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
  }
);

app.delete(
  "/data/toDelete/:id",
  cors(corsOptions),
  (req: Request, res: Response): void => {
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
  }
);

app.listen(port, () => {
  return console.log(
    `Express server is listening at http://localhost:${port} 🚀`
  );
});
