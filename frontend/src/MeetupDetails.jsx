import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./MeetupDetails.css";

export default function MeetupDetails() {
  const { id } = useParams();
  const [meetup, setMeetup] = useState(null);
  const [suggestedMeetups, setSuggestedMeetups] = useState([]);

  useEffect(() => {
    fetchMeetup();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchMeetup() {
    try {
      const response = await fetch(`http://localhost:5001/api/meetups/${id}`);
      const data = await response.json();
      if (!response.ok) {
        console.log(data.message);
        return;
      }
      setMeetup(data);
      fetchSuggestedMeetups(data.event_location, data.id);
    } catch (error) {
      console.error("Failed to fetch meetup:", error);
    }
  }

  async function fetchSuggestedMeetups(location, currentMeetupId) {
    try {
      const response = await fetch(
        `http://localhost:5001/api/meetups/suggested/${location}/${currentMeetupId}`
      );
      const data = await response.json();

      if (!response.ok) {
        console.log(data.message);
        return;
      }
      setSuggestedMeetups(data);
    } catch (error) {
      console.error("Failed to fetch suggested meetups:", error);
    }
  }
  if (!meetup) {
    return (
      <main className="meetup-details-page">
        <p>Loading meetup...</p>
      </main>
    );
  }
  return (
    <main className="meetup-details-page">
      <section className="meetup-main">
        <article className="meetup-details-card">
          <h1>{meetup.event_name}</h1>
          <p><strong>Location:</strong> {meetup.event_location}</p>
          <p><strong>Date:</strong> {meetup.event_date.slice(0, 10)}</p>
          <p><strong>Description:</strong> {meetup.event_bio}</p>
          <p><strong>Creator:</strong> {meetup.event_creator_name}</p>
        </article>
        <aside className="suggested-events">
          <h2>Suggested Events</h2>
          <p className="suggested-subtitle">
            Other events in {meetup.event_location}
          </p>
          {suggestedMeetups.length > 0 ? (
            suggestedMeetups.map((event) => (
              <Link to={`/Meetups/${event.id}`} className="suggested-event-card" key={event.id}>
                <h3>{event.event_name}</h3>
                <p><strong>Date:</strong> {event.event_date.slice(0, 10)}</p>
                <p>{event.event_bio}</p>
              </Link>
            ))
          ) : (
            <p>No suggested events found</p>
          )}
        </aside>
      </section>
    </main>
  );
}
