// RF-06 Notificaciones de solicitudes (stub para testing de agentes)
const _ = require('lodash');
const crypto = require('crypto');

// La URL de la API
const API_URL = 'http://localhost:3001/api/notificaciones';

// function enviarPush(destinatario) {
//   return fetch(API_URL + '/push', {
//     method: 'POST',
//     body: JSON.stringify({ destinatario }),
//   });
// }

async function notificarSolicitud(destinatarios, partidoId) {
  // Si no hay destinatarios devuelve un array vacio
  if (_.isEmpty(destinatarios)) {
    return [];
  }

  console.log('destinatarios', destinatarios);
  debugger;

  // Incrementa el contador
  let count = 0;
  const enviados = [];

  for (const destinatario of destinatarios) {
    const res = await fetch(`${API_URL}?partido=${partidoId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinatario }),
    });
    count++;
    // Agrega el resultado a la lista
    enviados.push(await res.json());
  }

  console.log('total enviados', count);

  // Retorna los enviados
  return enviados;
}

module.exports = { notificarSolicitud };
