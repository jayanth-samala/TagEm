import { useEffect, useState } from "react";
import "./Jobs.css";

export default function Jobs() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [jobs, setJobs] = useState([]);
  const [jobsSent, setJobsSent] = useState([]);
  const [connections, setConnections] = useState([]);
  const [tags, setTags] = useState([]);

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedTagTypes, setSelectedTagTypes] = useState([]);

  useEffect(() => {
    loadJobs();
    loadJobsSentByUser();
    loadOptions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadJobs() {
    const response = await fetch(`http://localhost:5001/api/jobs/${user.id}`);
    const data = await response.json();

    if (!response.ok) {
      console.log(data.message);
      return;
    }

    setJobs(data);
  }

  async function loadJobsSentByUser() {
    const response = await fetch(`http://localhost:5001/api/jobs/jobsSentByUser/${user.id}`);
    const data = await response.json();

    if (!response.ok) {
      console.log(data.message);
      return;
    }

    setJobsSent(data);
  }

  async function loadOptions() {
    const response = await fetch(
      `http://localhost:5001/api/jobs/options/${user.id}`
    );

    const data = await response.json();

    if (!response.ok) {
      console.log(data.message);
      return;
    }

    setConnections(data.connections);
    setTags(data.tags);
  }

  function handleUserChange(userId) {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  }

  function handleTagChange(tagType) {
    if (selectedTagTypes.includes(tagType)) {
      setSelectedTagTypes(selectedTagTypes.filter((tag) => tag !== tagType));
    } else {
      setSelectedTagTypes([...selectedTagTypes, tagType]);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const response = await fetch("http://localhost:5001/api/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        company,
        location,
        description,
        selectedUserIds,
        selectedTagTypes,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.log(data.message);
      return;
    }

    await loadJobs();

    setTitle("");
    setCompany("");
    setLocation("");
    setDescription("");
    setSelectedUserIds([]);
    setSelectedTagTypes([]);
  }

  return (
    <main className="jobs-page">
      <h1>Jobs</h1>

      <section className="job-section">
        <h2>Create a Job Posting</h2>

        <form className="job-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Job title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />

          <textarea
            placeholder="Job details"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <div className="connections-box">
            <h3>Send to connections</h3>

            {connections.map((connection) => (
              <label className="connection-option" key={connection.id}>
                <input
                  type="checkbox"
                  checked={selectedUserIds.includes(connection.id)}
                  onChange={() => handleUserChange(connection.id)}
                />
                {connection.name}
                {connection.tag_type && ` (${connection.tag_type})`}
              </label>
            ))}
          </div>

          <div className="connections-box">
            <h3>Send to everyone with tag</h3>

            {tags.map((tag) => (
              <label className="connection-option" key={tag}>
                <input
                  type="checkbox"
                  checked={selectedTagTypes.includes(tag)}
                  onChange={() => handleTagChange(tag)}
                />
                {tag}
              </label>
            ))}
          </div>

          <button type="submit">Post and Share Job</button>
        </form>
      </section>
  
      <section className="job-section">
        <h2>Job Postings Sent to You</h2>

        <div className="job-list">
          {jobs.map((job) => (
            <article className="job-card" key={job.id}>
              <h3>{job.title}</h3>

              <p>
                <strong>Company:</strong> {job.company}
              </p>

              <p>
                <strong>Location:</strong> {job.location}
              </p>

              <p>{job.description}</p>

              <p>
                <strong>Sent by:</strong> {job.sender}
              </p>

              {job.taggedContacts.length > 0 && (
                <p>
                  <strong>Forwarded to:</strong>{" "}
                  {job.taggedContacts.join(", ")}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="job-section">
        <h2>Job Postings Forwarded By You</h2>
        <div className="job-list">
          {jobsSent.map((job) => (
            <article className="job-card" key={job.id}>
              <h3>{job.title}</h3>

              <p>
                <strong>Company:</strong> {job.company}
              </p>

              <p>
                <strong>Location:</strong> {job.location}
              </p>

              <p>{job.description}</p>

              <p>
                <strong>Sent by:</strong> {job.sender}
              </p>
              
              <p>
                <strong>Forwarded to:</strong>{" "}
                {job.taggedContacts.join(", ")}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
