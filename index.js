import http from 'node:http';

const PORT = process.env.port || 1234

async function manejarSolicitudes() {
  
}


const server = http.createServer(manejarSolicitudes)

// Creear el servidor
// Ponerlo en escucha
// Administrar las peticiones
