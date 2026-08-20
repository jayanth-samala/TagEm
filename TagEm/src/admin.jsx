import { useEffect, useState } from "react";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");

  async function loadUsers() {
    const token = localStorage.getItem("token");

    const response = await fetch("http://localhost:5001/api/admin/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message);
      return;
    }

    setUsers(data);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function updateUser(user) {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `http://localhost:5001/api/admin/users/${user.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(user),
      }
    );

    const data = await response.json();
    setMessage(data.message || "User updated");
    loadUsers();
  }

  async function deleteUser(id) {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `http://localhost:5001/api/admin/users/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    setMessage(data.message);
    loadUsers();
  }

  async function changePassword(id) {
    const password = prompt("Enter new password:");

    if (!password) return;

    const token = localStorage.getItem("token");

    const response = await fetch(
      `http://localhost:5001/api/admin/users/${id}/password`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      }
    );

    const data = await response.json();
    setMessage(data.message);
  }

  async function resetDatabase() {
    const confirmed = window.confirm(
      "Are you sure? This will delete and repopulate the database."
    );

    if (!confirmed) return;

    const token = localStorage.getItem("token");

    const response = await fetch(
      "http://localhost:5001/api/admin/reset-database",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    setMessage(data.message);
    loadUsers();
  }

  function handleChange(id, field, value) {
    setUsers(
      users.map((user) =>
        user.id === id ? { ...user, [field]: value } : user
      )
    );
  }

  return (
    <main className="admin-page">
      <h1>Admin Page</h1>

      {message && <p>{message}</p>}

      <button onClick={resetDatabase}>
        Reset and Repopulate Database
      </button>

      <section>
        <h2>Manage Users</h2>

        {users.map((user) => (
          <div key={user.id} className="admin-user-card">
            <input
              value={user.name}
              onChange={(e) => handleChange(user.id, "name", e.target.value)}
            />

            <input
              value={user.email}
              onChange={(e) => handleChange(user.id, "email", e.target.value)}
            />

            <input
              value={user.profilePicUrl || ""}
              onChange={(e) =>
                handleChange(user.id, "profilePicUrl", e.target.value)
              }
              placeholder="Profile picture URL"
            />

            <label>
              Admin:
              <input
                type="checkbox"
                checked={user.is_admin}
                onChange={(e) =>
                  handleChange(user.id, "is_admin", e.target.checked)
                }
              />
            </label>

            <button onClick={() => updateUser(user)}>
              Save Changes
            </button>

            <button onClick={() => changePassword(user.id)}>
              Change Password
            </button>

            <button onClick={() => deleteUser(user.id)}>
              Delete User
            </button>
          </div>
        ))}
      </section>
    </main>
  );
}