import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Connections.css";

function Connections() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const [search, handleSearch] = useState("");
  const [users, handleUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [connections, setConnections] = useState([]);

  const [tagInputs, setTagInputs] = useState({});

  useEffect(() => {
    displayUsers();
  }, [search]);

  useEffect(() => {
    displayConnections();
  }, []);

  async function displayRequests() {
    try {
      const response = await fetch(
        `http://localhost:5001/api/connections/requests/${user.id}`
      );

      const data = await response.json();

      if (!response.ok) {
        console.log(data.message);
        return;
      }

      setRequests(data);
      setShowRequests(true);
    } catch (err) {
      console.log("Error receiving requests:", err);
    }
  }

  async function displayConnections() {
    try {
      const response = await fetch(
        `http://localhost:5001/api/connections/${user.id}`
      );

      const data = await response.json();

      if (!response.ok) {
        console.log(data.message);
        return;
      }

      setConnections(data);
      setShowRequests(false);
    } catch (err) {
      console.log("Error receiving connections:", err);
    }
  }

  async function acceptRequest(requestId) {
    try {
      const response = await fetch(
        `http://localhost:5001/api/connections/accept/${requestId}`,
        {
          method: "PUT",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.log(data.message);
        return;
      }

      setRequests(requests.filter((request) => request.id !== requestId));
      displayConnections();
    } catch (err) {
      console.log("Error accepting request:", err);
    }
  }

  async function rejectRequest(requestId) {
    try {
      const response = await fetch(
        `http://localhost:5001/api/connections/reject/${requestId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.log(data.message);
        return;
      }

      setRequests(requests.filter((request) => request.id !== requestId));
    } catch (err) {
      console.log("Error rejecting request:", err);
    }
  }

  async function displayUsers() {
    const API_URL = `http://localhost:5001/api/getUsers/users?search=${search}`;

    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      if (!response.ok) {
        console.log(data.message);
        return;
      }

      handleUsers(data);
    } catch (err) {
      console.log("Error receiving data:", err);
    }
  }

  function handleTagChange(connectionId, value) {
    setTagInputs({
      ...tagInputs,
      [connectionId]: value,
    });
  }

  async function saveTag(connectionId) {
    const tagType = tagInputs[connectionId]?.trim();

    if (!tagType) {
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5001/api/jobs/connection-tags",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            connection_user_id: connectionId,
            tag_type: tagType,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.log(data.message);
        return;
      }

      setConnections(
        connections.map((connection) =>
          connection.id === connectionId
            ? { ...connection, tag_type: tagType }
            : connection
        )
      );

      setTagInputs({
        ...tagInputs,
        [connectionId]: "",
      });
    } catch (err) {
      console.log("Error saving tag:", err);
    }
  }

  return (
    <div className="connections-page">
      <div className="Search">
        <input
          type="text"
          placeholder="Search to connect..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="input"
        />

        <div className="Dropdown">
          {users.map((person) => (
            <div
              className="person"
              key={person.id}
              onClick={() => navigate(`/profile/${person.id}`)}
            >
              <img
                src={
                  person.profilePicUrl ||
                  "https://anitawatkins.com/wp-content/uploads/2016/02/Generic-Profile-1600x1600.png"
                }
                alt={person.name}
              />

              <h3>{person.name}</h3>
            </div>
          ))}
        </div>
      </div>

      <div className="connections-header">
        <h1>Connections</h1>
      </div>

      <div className="filter-buttons">
        <button onClick={displayConnections}>All</button>
        <button>Recruiters</button>
        <button onClick={displayRequests}>Requests</button>
      </div>

      <div className="connections-grid">
        {showRequests
          ? requests.map((request) => (
              <div className="request-card" key={request.id}>
                <Link to={`/profile/${request.sender_id}`}>
                  <img
                    src={
                      request.profilePicUrl ||
                      "https://anitawatkins.com/wp-content/uploads/2016/02/Generic-Profile-1600x1600.png"
                    }
                    alt={request.name}
                    className="request-pic"
                  />

                  <h3>{request.name}</h3>
                </Link>

                <div className="card-buttons">
                  <button
                    className="accept-btn"
                    onClick={() => acceptRequest(request.id)}
                  >
                    Accept
                  </button>

                  <button
                    className="remove-btn"
                    onClick={() => rejectRequest(request.id)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          : connections.map((connection) => (
              <div className="request-card" key={connection.id}>
                <Link to={`/profile/${connection.id}`}>
                  <img
                    src={
                      connection.profilePicUrl ||
                      "https://anitawatkins.com/wp-content/uploads/2016/02/Generic-Profile-1600x1600.png"
                    }
                    alt={connection.name}
                    className="request-pic"
                  />

                  <h3>{connection.name}</h3>
                </Link>

                {connection.tag_type && (
                  <p className="connection-tag">
                    <strong>Tag:</strong> {connection.tag_type}
                  </p>
                )}

                <div className="tag-box">
                  <input
                    type="text"
                    placeholder="Create tag"
                    value={tagInputs[connection.id] || ""}
                    onChange={(e) => handleTagChange(connection.id, e.target.value)}
                  />

                  <button onClick={() => saveTag(connection.id)}>
                    Save Tag
                  </button>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}

export default Connections;
