import express, { json } from "express";
const Servidor = express(); // Se inicializa el servidor con express
const port = process.env.PORT || 3000; // Se establece el puerto, (process.env.PORT) Se utiliza para que vercel le ponga el puerto  que quiera al servidor y no de probelmas de otra forma utliziara el puerto 3000
import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
dotenv.config();
const consulta = neon(process.env.DATABASE_URL);

import cors from "cors";
Servidor.use(cors());
Servidor.use(express.json());

// Se establecen las rutas y el comportamiento de las peticiones
Servidor.get("/", (req, res) => {
  res.send("Bienvenido a el servidor de Soft - Share 😊🤖");
});

// OBTENER PROGRAMAS
Servidor.get("/get", async (req, res) => {
  try {
    const resultadoConsulta =
      await consulta`SELECT * FROM programas ORDER BY nombre ASC`;
    res.type("json");
    res.status(200).send(resultadoConsulta);
    return;
  } catch (error) {
    res
      .status(500)
      .send(
        `Error a la hora de ejecutar la consulta a la base de datos, ${error}`
      );
    return;
  }
});

// OBTENER COMENTARIOS
Servidor.get("/comments", async (req, res) => {
  try {
    const resultadoConsulta =
      await consulta`SELECT autor, comentario, fecha FROM comentarios ORDER BY id DESC`;
    res.type("json");
    res.status(200).send(resultadoConsulta);
    return;
  } catch (error) {
    res
      .status(500)
      .send(`Error al obtener los comentarios de la base de datos, ${error}`);
    return;
  }
});

// Insertar comentarios
Servidor.post("/comments", async (req, res) => {
  try {
    const { autor, comentario, fecha } = req.body;
    const arrayDeAutorComentarioFechaAInsertar = [autor, comentario, fecha];

    // Comprobar que no exista otro comentario con el mismo autor, comentario o fecha
    const resultadoConsulta = await consulta`SELECT * FROM comentarios`;

    if (!Array.isArray(resultadoConsulta)) {
      throw new Error("La consulta no devolvió un array válido.");
    }

    const valoresComentarios = resultadoConsulta
      .map((obj) => Object.values(obj))
      .flat();

    for (let i = 0; i < arrayDeAutorComentarioFechaAInsertar.length; i++) {
      if (
        valoresComentarios.includes(arrayDeAutorComentarioFechaAInsertar[i])
      ) {
        res.status(400).send("El comentario tiene campos duplicados");
        return;
      }
    }

    await consulta`INSERT INTO comentarios (autor, comentario, fecha)
    VALUES (${autor}, ${comentario}, ${fecha});
    `;

    res.send(`La creación del comentario ha finalizado sin errores.`);
  } catch (error) {
    res
      .status(500)
      .send(
        `Error al insertar el comentario en la base de datos: ${error.message}`
      );
  }
});

// Buscar Programas
Servidor.post("/search", async (req, res) => {
  let preferenciaDeCategorias = [];
  // Obtener el valor de la búsqueda del usuario
  const inputValue = req.body.inputValue.toLowerCase();
  preferenciaDeCategorias = req.body.preferenciaDeCategorias;

  if (!inputValue && preferenciaDeCategorias.length === 0) {
    res.status(400).send("Los campos nulos no son válidos");
    return;
  }

  if (preferenciaDeCategorias.length === 0) {
    const resultadosConsulta = await consulta`
      SELECT * FROM programas
      WHERE LOWER(nombre) LIKE ${"%" + inputValue + "%"}
      ORDER BY nombre ASC
    `;
    res.send(resultadosConsulta);
    return;
  } else {
    const resultadosConsulta = await consulta`
    SELECT * FROM programas
    WHERE LOWER(nombre) LIKE ${"%" + inputValue + "%"}
    AND categorias @> ${preferenciaDeCategorias}
    ORDER BY nombre ASC
  `;

    res.send(resultadosConsulta);
  }
});

// AGREGAR PROGRAMAS
Servidor.post("/post", async (req, res) => {
  const {
    nombre,
    link_de_imagen,
    link_de_descarga,
    detalles,
    categoriaSeleccionadaFinal,
  } = req.body;
  // console.log(req.body.categoriaSeleccionadaFinal)

  if (!nombre || !link_de_imagen || !link_de_descarga || !detalles) {
    res.status(400).send("Error, faltan campos requeridos");
    return;
  }

  // Esto convierte las categorias seleccionas de esto [ 'Categoria 1, Categoria 2' ] -> [ 'Categoria 1', 'Categoria 2' ]

  // console.log(categoriaSeleccionadaFinal);
  let array = categoriaSeleccionadaFinal;
  const resultadoArray = array.map((item) => item.split(", ")).flat();

  await consulta`
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
    ${resultadoArray}
  )
`;

  res.send("Se agrego el programa exitosamente");
});
// Se inicializa el servidor por el puerto predefinodo
Servidor.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
