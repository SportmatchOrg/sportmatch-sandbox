// RF-05 Sistema de solicitudes
function solicitarUnirse(partidoId, usuarioId) { return { partidoId, usuarioId, estado: "pendiente" }; }
module.exports = { solicitarUnirse };
