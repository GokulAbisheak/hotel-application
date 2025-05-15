import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdAdd, MdEdit, MdDelete } from "react-icons/md";
import { roomsAPI } from "../../api/rooms";
import jsPDF from "jspdf";

const RoomsManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await roomsAPI.getAllRooms();
      setRooms(response);
      setFilteredRooms(response);
    } catch (err) {
      setError("Failed to fetch rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const selected = e.target.value;
    setSelectedRoom(selected);

    if (selected === "all") {
      setFilteredRooms(rooms);
    } else {
      const filtered = rooms.filter((room) => room.name === selected);
      setFilteredRooms(filtered);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Rooms Report", 14, 15);

    let y = 25;
    filteredRooms.forEach((room, index) => {
      doc.setFontSize(12);
      doc.text(`Name: ${room.name}`, 14, y);
      doc.text(`Room #: ${room.roomNumber}`, 14, y + 6);
      doc.text(`Category: ${room.category}`, 14, y + 12);
      doc.text(`Capacity: ${room.capacity}`, 14, y + 18);
      doc.text(`Price: LKR ${room.price}`, 14, y + 24);
      doc.text(`Amenities: ${room.amenities.join(", ")}`, 14, y + 30);

      y += 45;
      if (y > 270) {
        doc.addPage();
        y = 25;
      }
    });

    doc.save("rooms-report.pdf");
  };

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm("Are you sure you want to delete this room?")) {
      try {
        await roomsAPI.deleteRoom(roomId);
        const updated = rooms.filter((room) => room._id !== roomId);
        setRooms(updated);
        setFilteredRooms(updated);
      } catch (err) {
        setError(err.message || "Failed to delete room");
      }
    }
  };

  if (loading) return <div>Loading rooms...</div>;

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Rooms Management</h2>
        <div className="flex gap-3">
          <select
            value={selectedRoom}
            onChange={handleFilterChange}
            className="border rounded px-3 py-1"
          >
            <option value="all">All Rooms</option>
            {Array.from(new Set(rooms.map((r) => r.name))).map((name, i) => (
              <option key={i} value={name}>
                {name}
              </option>
            ))}
          </select>
          <button
            onClick={downloadPDF}
            className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
          >
            Download PDF
          </button>
          <button
            onClick={() => navigate("/admin/rooms/add")}
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 flex items-center gap-1"
          >
            <MdAdd /> Add Room
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 mb-2">{error}</p>}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRooms.map((room) => (
          <div key={room._id} className="rounded p-4 shadow bg-white">
            <img
              src={`http://localhost:4000${room.image}`}
              alt={room.name}
              className="h-40 w-full object-cover rounded mb-3"
              onError={(e) => (e.target.src = "/default-room.jpg")}
            />
            <h3 className="text-lg font-bold">{room.name}</h3>
            <p>Room #: {room.roomNumber}</p>
            <p>Category: {room.category}</p>
            <p>Capacity: {room.capacity}</p>
            <p>Price: LKR {room.price}/night</p>
            <p className="text-sm mt-2">
              Amenities: {room.amenities.join(", ")}
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => navigate(`/admin/rooms/edit/${room._id}`)}
                className="text-white bg-yellow-500 px-3 py-1 rounded flex items-center justify-center gap-3"
              >
                <MdEdit /> Edit
              </button>
              <button
                onClick={() => handleDeleteRoom(room._id)}
                className="text-white bg-red-600 px-3 py-1 rounded flex items-center justify-center gap-3"
              >
                <MdDelete /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomsManagement;