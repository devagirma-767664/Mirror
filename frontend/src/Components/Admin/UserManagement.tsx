// src/components/admin/UserManagement.tsx
import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchUsers, deleteUser, addUser } from "../../features/users/usersThunks";

const UserManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { list, loading, error } = useAppSelector((state) => state.users);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("barber");
  const [password, setPassword] = useState("");
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("role", role);
    formData.append("password", password);
    if (profilePictureFile) {
      formData.append("profilePicture", profilePictureFile);
    }

    dispatch(addUser(formData));
    setName("");
    setEmail("");
    setRole("barber");
    setPassword("");
    setProfilePictureFile(null);
    setPreview(null);
    setShowForm(false);
  };

  const handleFileChange = (file: File | null) => {
    setProfilePictureFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-yellow-600">User Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg shadow hover:bg-yellow-700 transition font-medium"
        >
          {showForm ? "Cancel" : "Add User"}
        </button>
      </div>

      {/* Add User Form */}
      {showForm && (
        <form
          onSubmit={handleAddUser}
          className="mb-8 bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 rounded-xl shadow-md space-y-6"
        >
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-600 focus:outline-none"
                placeholder="Enter full name"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-600 focus:outline-none"
                placeholder="example@domain.com"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-600 focus:outline-none"
              >
                <option value="admin">Admin</option>
                <option value="barber">Barber</option>
                <option value="receptionist">Receptionist</option>
                <option value="customer">Customer</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-600 focus:outline-none"
                placeholder="Enter secure password"
                required
              />
            </div>
          </div>

          {/* Profile Picture Upload */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Profile Picture</label>
            <div
              className="border-2 border-dashed border-yellow-400 rounded-lg p-6 flex flex-col items-center justify-center bg-yellow-50 hover:bg-yellow-100 transition cursor-pointer"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleFileChange(file);
              }}
            >
              <input
                type="file"
                accept="image/*"
                id="profilePicture"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />
              <label
                htmlFor="profilePicture"
                className="text-yellow-600 font-medium cursor-pointer"
              >
                {profilePictureFile ? "Change Picture" : "Click to Upload or Drag Here"}
              </label>

              {preview && (
                <div className="mt-4">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-28 h-28 rounded-full object-cover shadow-md border-2 border-yellow-400"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-yellow-600 text-white px-6 py-2 rounded-lg shadow hover:bg-yellow-700 transition font-semibold"
            >
              Save User
            </button>
          </div>
        </form>
      )}

      {/* User Table */}
      {loading && <p>Loading users...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2">Picture</th>
            <th className="p-2">Name</th>
            <th className="p-2">Email</th>
            <th className="p-2">Role</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map((user) => (
            <tr key={user.id} className="border-b hover:bg-gray-50 transition">
              <td className="p-2">
                {user.profile_picture ? (
                  <img
                    src={`http://localhost:5000${user.profile_picture}`}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400">No Image</span>
                )}
              </td>
              <td className="p-2">{user.name}</td>
              <td className="p-2">{user.email}</td>
              <td className="p-2">{user.role}</td>
              <td className="p-2">
                <button
                  onClick={() => dispatch(deleteUser(user.id))}
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

export default UserManagement;
