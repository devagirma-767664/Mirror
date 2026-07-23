// src/components/admin/ServicesManagement.tsx
import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchServices,
  addService,
  updateService,
  deleteService,
} from "../../features/services/servicesThunks";
import { FaTag, FaClock, FaDollarSign } from "react-icons/fa";

const ServicesManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { list, loading, error } = useAppSelector((state) => state.services);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [duration, setDuration] = useState<number>(30);

  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchServices());
  }, [dispatch]);

  const handleAddOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      dispatch(updateService({ id: editId, name, price, duration }));
    } else {
      dispatch(addService({ name, price, duration }));
    }
    setName("");
    setPrice(0);
    setDuration(30);
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (service: any) => {
    setEditId(service.id);
    setName(service.name);
    setPrice(service.price);
    setDuration(service.duration);
    setShowForm(true);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-yellow-600">Services Management</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditId(null);
            setName("");
            setPrice(0);
            setDuration(30);
          }}
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg shadow hover:bg-yellow-700 transition font-medium"
        >
          {showForm ? "Cancel" : "Add Service"}
        </button>
      </div>

      {/* Add/Edit Service Form */}
      {showForm && (
        <form
          onSubmit={handleAddOrUpdate}
          className="mb-8 bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 rounded-xl shadow-md space-y-4 animate-fadeIn"
        >
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                <FaTag className="text-yellow-600" /> Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-600 focus:outline-none"
                placeholder="Service name"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                <FaDollarSign className="text-yellow-600" /> Price
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-600 focus:outline-none"
                placeholder="Price in USD"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                <FaClock className="text-yellow-600" /> Duration (mins)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-600 focus:outline-none"
                placeholder="Duration in minutes"
                required
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-yellow-600 text-white px-6 py-2 rounded-lg shadow hover:bg-yellow-700 transition font-semibold"
            >
              {editId ? "Update Service" : "Save Service"}
            </button>
          </div>
        </form>
      )}

      {/* Services Table */}
      {loading && <p>Loading services...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2">Name</th>
            <th className="p-2">Price</th>
            <th className="p-2">Duration</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map((service) => (
            <tr key={service.id} className="border-b hover:bg-gray-50 transition">
              <td className="p-2">{service.name}</td>
              <td className="p-2">${service.price}</td>
              <td className="p-2">{service.duration} mins</td>
              <td className="p-2 flex gap-2">
                <button
                  onClick={() => handleEdit(service)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => dispatch(deleteService(service.id))}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ServicesManagement;
