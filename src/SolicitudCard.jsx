export function SolicitudCard({ solicitud, onAccept }) {
  return (
    <div className="mt-4 rounded-lg border p-4">
      <p>No pending requests found</p>
      <button className="mb-2 bg-blue-600 p-2" onClick={onAccept}>
        Accept request
      </button>
    </div>
  );
}
