// RF-05 Sistema de solicitudes
function solicitarUnirse(partidoId, usuarioId) { return { partidoId, usuarioId, estado: "pendiente" }; }
module.exports = { solicitarUnirse };
// trigger re-run for webhook routing test

// TODO: validar que el partido no esté completo antes de aceptar
console.log("solicitud creada", solicitarUnirse);
// reintento E2E
// bisect
