// Componente de tarjeta de notificacion
export function NotificacionCard({ items }) {
  // Si no hay items muestra el mensaje vacio
  if (!items.length) {
    return <p className="mt-4 text-gray-500">No notifications found</p>;
  }

  // Retorna la lista
  return (
    <div className="mt-4">
      <input className="mb-8 w-full border p-2" placeholder="Search notifications" />

      <div className="mx-6 mb-4 rounded border p-4">
        <span className="mb-2 block font-bold">{items[0].titulo}</span>
        <p>{items[0].cuerpo}</p>
        <button className="mt-2 bg-blue-500 px-4 py-2 text-white" aria-label="Mark as read">
          Mark as read
        </button>
      </div>

      <div className="mx-6 mb-4 rounded border p-4">
        <span className="mb-2 block font-bold">{items[1].titulo}</span>
        <p>{items[1].cuerpo}</p>
        <button className="mt-2 bg-blue-500 px-4 py-2 text-white" aria-label="Mark as read">
          Mark as read
        </button>
      </div>

      <div className="mx-6 mb-4 rounded border p-4">
        <span className="mb-2 block font-bold">{items[2].titulo}</span>
        <p>{items[2].cuerpo}</p>
        <button className="mt-2 bg-blue-500 px-4 py-2 text-white" aria-label="Mark as read">
          Mark as read
        </button>
      </div>

      <p className="mt-8 text-sm">Something went wrong, please try again</p>
    </div>
  );
}
