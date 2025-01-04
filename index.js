import { createServer } from "node:http";
import { neon } from "@neondatabase/serverless";

let hola = 1

const sql = neon(
  "postgresql://Programs-db_owner:gt7QxJLNI4rP@ep-shrill-brook-a5j8odhx.us-east-2.aws.neon.tech/Programs-db?sslmode=require"
);

const PORT = process.env.port || 1234;

const server = createServer(async (req, res) => {
  console.log(`Acabo de recibir una petición, a la ruta ${req.url}`);

  // Configurar encabezados CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Manejo de solicitudes OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const URL = req.url;

  switch (URL) {
    case "/":
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("¡Bienvenido al servidor de Soft Share!");
      break;

    case "/get": // Obtener programas
      try {
        const result = await sql`SELECT * FROM programas ORDER BY nombre ASC`;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify(result));
      } catch (error) {
        console.error("Error al consultar la base de datos:", error);
        res.statusCode = 500;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end("Error al obtener los datos de la base de datos.");
      }
      break;

    case "/comments": // Obtener comentarios
      if (req.method === "GET") {
        try {
          const comments = await sql`SELECT autor, comentario, fecha FROM comentarios ORDER BY id DESC`;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify(comments));
        } catch (error) {
          console.error("Error al consultar los comentarios:", error);
          res.statusCode = 500;
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end("Error al obtener los comentarios.");
        }
      } else if (req.method === "POST") {
        // Agregar un nuevo comentario
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });

        req.on("end", async () => {
          const { autor, comentario, fecha } = JSON.parse(body);
          try {
            await sql`
              INSERT INTO comentarios (autor, comentario, fecha)
              VALUES (${autor}, ${comentario}, ${fecha})
            `;
            res.statusCode = 201;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ message: "Comentario agregado exitosamente" }));
          } catch (error) {
            console.error("Error al agregar el comentario:", error);
            res.statusCode = 500;
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.end("Error al agregar el comentario.");
          }
        });
      }
      break;
      case "/search": // Ruta para búsquedas
  if (req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      const { inputValue } = JSON.parse(body);

      if (!inputValue) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ error: "El campo inputValue es requerido." }));
        return;
      }

      try {
        // Realizar búsqueda en la base de datos
        const resultados = await sql`
          SELECT * FROM programas
          WHERE LOWER(nombre) LIKE ${"%" + inputValue.toLowerCase() + "%"}
          ORDER BY nombre ASC
        `;

        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify(resultados));
      } catch (error) {
        console.error("Error al realizar la búsqueda:", error);
        res.statusCode = 500;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end("Error al realizar la búsqueda en la base de datos.");
      }
    });
  } else {
    res.statusCode = 405; // Método no permitido
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Método no permitido para esta ruta.");
  }
  break;


    default:
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("404 Not Found");
      break;
  }
});

server.listen(PORT, () => {
  console.log(`El servidor está en escucha por el puerto: http://localhost:${PORT}`);
});
