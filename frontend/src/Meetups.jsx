import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Meetups.css";

export default function Meetups() {
  const [meetups, setMeetups] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));

  const [nameFilter, setNameFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [newMeetup, setNewMeetup] = useState({
    event_name: "",
    event_location: "",
    event_date: "",
    event_bio: "",
  });

  useEffect(() => {
    fetchMeetups();
  }, []);

  async function fetchMeetups() {
    try {
      const response = await fetch("http://localhost:5001/api/meetups");
      const data = await response.json();

      setMeetups(data);
    } catch (error) {
      console.error("Failed to fetch meetups:", error);
    }
  }

  const filteredMeetups = meetups.filter((meetup) => {
    const matchesName = meetup.event_name
      .toLowerCase()
      .includes(nameFilter.toLowerCase());

    const matchesLocation = meetup.event_location
      .toLowerCase()
      .includes(locationFilter.toLowerCase());

    const matchesDate =
      dateFilter === "" || meetup.event_date.slice(0, 10) === dateFilter;

    return matchesName && matchesLocation && matchesDate;
  });

  function handleInputChange(e) {
    const { name, value } = e.target;

    setNewMeetup({
      ...newMeetup,
      [name]: value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5001/api/meetups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMeetup),
      });

      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error || "Failed to create meetup");
      const createdMeetup = { ...responseData, event_creator_name: user.name };
      setMeetups([...meetups, createdMeetup]);

      setNewMeetup({
        event_name: "",
        event_location: "",
        event_date: "",
        event_bio: "",
        event_creator: "",
      });
    } catch (error) {
      console.error("Failed to create meetup:", error);
    }
  }

  return (
    <main className="meetups-page">
      <h1>Meetups</h1>

      <div className="filters">
        <input
          type="text"
          placeholder="Filter by meetup name"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
        />

        <input
          type="text"
          placeholder="Filter by location"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
        />

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
      </div>

      <section className="meetup-list">
        {filteredMeetups.length > 0 ? (
          filteredMeetups.map((meetup) => (
            <Link to={`/Meetups/${meetup.id}`} className="meetup-card-link" key={meetup.id} >
              <article className="meetup-card">
                <h2>{meetup.event_name}</h2>
                <p><strong>Location:</strong> {meetup.event_location}</p>
                <p><strong>Date:</strong> {meetup.event_date.slice(0, 10)}</p>
                <p><strong>Description:</strong> {meetup.event_bio}</p>
                <p><strong>Creator:</strong> {meetup.event_creator_name}</p>
              </article>
            </Link>
          ))
        ) : (
          <p className="no-meetups">No meetups found.</p>
        )}
      </section>

      <section className="create-meetup-section">
        <h2>Create a Meetup</h2>

        <form className="create-meetup-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="event_name"
            placeholder="Meetup name"
            value={newMeetup.event_name}
            onChange={handleInputChange}
            required
          />

          <input
            type="text"
            name="event_location"
            placeholder="Location"
            value={newMeetup.event_location}
            onChange={handleInputChange}
            required
          />

          <input
            type="date"
            name="event_date"
            value={newMeetup.event_date}
            onChange={handleInputChange}
            required
          />

          <textarea
            name="event_bio"
            placeholder="Description"
            value={newMeetup.event_bio}
            onChange={handleInputChange}
          />

          <button type="submit">Create Meetup</button>
        </form>
      </section>
    </main>
  );
}
