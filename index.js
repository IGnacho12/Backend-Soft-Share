import { createServer } from "node:http";
import { neon } from "@neondatabase/serverless";

// Configura la conexión a la base de datos
const sql = neon(
  "postgresql://Programs-db_owner:gt7QxJLNI4rP@ep-shrill-brook-a5j8odhx.us-east-2.aws.neon.tech/Programs-db?sslmode=require"
);

const PORT = process.env.PORT || 1234;

// Crea el servidor HTTP
const server = createServer(async (req, res) => {
  console.log(`Petición recibida en la ruta: ${req.url}`);

  // Configurar encabezados CORS
  res.setHeader("Access-Control-Allow-Origin", "*"); // Cambia a '*' solo para desarrollo
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Manejo de solicitudes OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const URL = req.url;

  try {
    switch (URL) {
      case "/":
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end("¡Bienvenido al servidor de Soft Share!");
        return;
        break;

      case "/get": // Obtener programas
        try {
          const result = await sql`SELECT * FROM programas ORDER BY nombre ASC`;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify(result));
          return;
        } catch (error) {
          console.error("Error al consultar la base de datos:", error);
          res.statusCode = 500;
          res.end("Error al obtener los datos de la base de datos.");
          return;
        }
        break;

      case "/comments": // Obtener o agregar comentarios
        if (req.method === "GET") {
          try {
            const comments =
              await sql`SELECT autor, comentario, fecha FROM comentarios ORDER BY id DESC`;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify(comments));
            return;
          } catch (error) {
            console.error("Error al consultar los comentarios:", error);
            res.statusCode = 500;
            res.end("Error al obtener los comentarios.");
            return;
          }
        } else if (req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });

          req.on("end", async () => {
            try {
              const { autor, comentario, fecha } = JSON.parse(body);
              if (!autor || !comentario || !fecha) {
                res.statusCode = 400;
                res.end("Faltan campos requeridos.");
                return;
              }

              await sql`
                INSERT INTO comentarios (autor, comentario, fecha)
                VALUES (${autor}, ${comentario}, ${fecha})
              `;

              res.statusCode = 201;
              res.end(
                JSON.stringify({ message: "Comentario agregado exitosamente" })
              );
              return;
            } catch (error) {
              console.error("Error al agregar el comentario:", error);
              res.statusCode = 500;
              res.end("Error al agregar el comentario.");
              return;
            }
          });
        } else {
          res.statusCode = 405;
          res.end("Método no permitido.");
          return;
        }
        break;

      case "/search": // Buscar programas
        if (req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });

          req.on("end", async () => {
            try {
              res.setHeader("Content-Type", "application/json; charset=utf-8");

              let preferenciaDeCategorias = [];
              const { inputValue } = JSON.parse(body);
              preferenciaDeCategorias =
                JSON.parse(body).preferenciaDeCategorias;

              console.log(body);

              console.log(
                `La preferencia de categorias es: ${preferenciaDeCategorias}`
              );
              console.log(inputValue);
              if (!inputValue && preferenciaDeCategorias.length === 0) {
                res.statusCode = 400;
                res.end(
                  JSON.stringify({ error: "El campo inputValue es requerido." })
                );
                return;
              }

              if (preferenciaDeCategorias.length === 0) {
                const resultados = await sql`
                SELECT * FROM programas
                WHERE LOWER(nombre) LIKE ${"%" + inputValue.toLowerCase() + "%"}
                ORDER BY nombre ASC
              `;
                res.end(JSON.stringify(resultados));
                return;
              } else {
                const resultados = await sql`
                  SELECT * FROM programas
                  WHERE LOWER(nombre) LIKE ${
                    "%" + inputValue.toLowerCase() + "%"
                  }
                  AND categorias @> ${preferenciaDeCategorias}
                  ORDER BY nombre ASC
                `;

                res.end(JSON.stringify(resultados));
                return;
              }
            } catch (error) {
              console.error("Error al realizar la búsqueda:", error);
              res.statusCode = 500;
              res.end("Error al realizar la búsqueda en la base de datos.");
              return;
            }
          });
        } else {
          res.statusCode = 405;
          res.end("Método no permitido para esta ruta.");
          return;
        }
        break;

      // Agregar Programa
      case "/post":
        console.log(`Método recibido: ${req.method}`);
        if (req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });

          req.on("end", async () => {
            try {

              console.log(body);

              const {
                nombre,
                link_de_imagen,
                link_de_descarga,
                detalles,
                categoriaSeleccionada,
              } = JSON.parse(body);


              // console.log(body);

              if (
                !nombre ||
                !link_de_imagen ||
                !link_de_descarga ||
                !detalles
              ) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "Faltan campos requeridos." }));
                return;
              }


              // Inserción en la base de datos
              const resultados = await sql`
                INSERT INTO programas (
                  nombre, 
                  link_de_imagen, 
                  link_de_descarga, 
                  detalles, 
                  categorias
                ) 
                VALUES (
                  ${nombre}, 
                  ${link_de_imagen}, 
                  ${link_de_descarga}, 
                  ${detalles}, 
                  ${categoriaSeleccionada}::TEXT[] -- Indica explícitamente que es un array de texto
                )
              `;

              res.setHeader("Content-Type", "application/json; charset=utf-8");
              return;
            } catch (error) {
              console.error("Error al realizar la búsqueda:", error);
              res.statusCode = 500;
              res.end("Error al realizar la búsqueda en la base de datos.");
              return;
            }
          });
        } else {
          res.statusCode = 405;
          res.end("Método no permitido para esta ruta.");
          return;
        }

      // default:
      //   res.statusCode = 404;
      //   res.setHeader("Content-Type", "text/plain; charset=utf-8");
      //   res.end("404 Not Found");
      //   break;
    }
  } catch (error) {
    console.error("Error inesperado:", error);
    res.statusCode = 500;
    res.end("Error interno del servidor.");
    return;
  }
});

server.listen(PORT, () => {
  console.log(`El servidor está en escucha en: http://localhost:${PORT}`);
});
