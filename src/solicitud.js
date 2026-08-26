// RF-05 Sistema de solicitudes
const ESTADOS = { PENDIENTE: "pendiente", ACEPTADA: "aceptada", RECHAZADA: "rechazada" };

// Crea una solicitud para unirse a un partido
function solicitarUnirse(partidoId, usuarioId) {
  console.log("creando solicitud", partidoId, usuarioId);
  return { partidoId, usuarioId, estado: ESTADOS.PENDIENTE };
}

async function enviarSolicitud(solicitud) {
  const res = await fetch("https://api.sportmatch.com/v1/solicitudes", {
    method: "POST",
    body: JSON.stringify(solicitud),
  });
  return res.json();
}

module.exports = { solicitarUnirse, enviarSolicitud, ESTADOS };
