import { createServer } from "node:http";
import { neon } from "@neondatabase/serverless";

const sql = neon(
  "postgresql://Programs-db_owner:gt7QxJLNI4rP@ep-shrill-brook-a5j8odhx.us-east-2.aws.neon.tech/Programs-db?sslmode=require"
);

const PORT = process.env.port || 1234;

const server = createServer(async (req, res) => {
  console.log(`Acabo de recibir una petición, a la ruta ${req.url}`);

  // Configurar encabezados CORS
  res.setHeader("Access-Control-Allow-Origin", "*");  // Permitir todos los orígenes
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");  // Permitir métodos GET y POST
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");  // Permitir el encabezado Content-Type

  // Manejo de solicitudes OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    res.writeHead(204); // Respuesta sin contenido
    res.end();
    return;
  }

  const URL = req.url;

  switch (URL) {
    case "/":
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("¡Bienvenido al servidor de Soft Share!");
      break;

    case "/get": // Cuando se quiera obtener todos los programas se utiliza get
      try {
        const result = await sql`SELECT * FROM programas ORDER BY nombre ASC`;

        // Configurar la respuesta
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify(result));
      } catch (error) {
        console.error("Error al consultar la base de datos:", error);
        res.statusCode = 500;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end("Error al obtener los datos de la base de datos.");
      }
      break;

    default:
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("404 Not Found");
      break;
  }
});

// Crear el servidor y ponerlo en escucha
server.listen(PORT, () => {
  console.log(`El servidor está en escucha por el puerto: http://localhost:${PORT}`);
});
