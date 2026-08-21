<h1>Project Description</h1>

<p>
  TagEm is a networking platform that helps users share relevant job opportunities
  with people in their network. Connections can be organized with private,
  personalized tags, making it easy to select suitable recipients when forwarding
  a job posting.
</p>

<p>
  The deployed application is available at
  <a href="https://tag-em.vercel.app/">tag-em.vercel.app</a>.
</p>

<h1>Contributions</h1>

<p>
  From the initial commit, Jayanth implemented the meetups, jobs, tagging,
  and admin frontend and backend, Gabriel implemented the profile and Google authentication strategy frontend and backend, Daniyal implemented the connections and local authentication strategy frontend and backend. These changes were compressed from multiple previous commits in a separate repository into one initial commit here.
</p>

<p>
  In later commits, Jayanth implemented JWT authentication with secure, HttpOnly cookies and database-backed token revocation; CSRF protection; restricted CORS; OAuth state validation; secure cookie configuration; safe Google OAuth redirects; exclusive authentication-provider enforcement; password hashing and validation; rate limiting; security headers; request-size limits; structured logging; and centralized error handling. He added server-side ownership authorization across
  profiles, jobs, meetups, connections, private tags, posts, replies, and uploads;
  protected administrator accounts; secured profile-picture and resume storage;
  integrated private Vercel Blob storage; improved profile, resume, post, reply,
  connection, tag, job, and meetup functionality; added secure account deletion;
  added database integrity and security migrations; configured PostgreSQL pooling,
  SSL, timeouts, transactions, Neon, and Vercel deployment; added health and
  readiness endpoints; expanded security tests; updated dependencies; resolved
  frontend lint issues; and improved responsive layouts throughout the application.
</p>

<h1>Feature List</h1>

<ul>
  <li>Email/password and Google OAuth authentication.</li>
  <li>Editable profiles with profile pictures, bios, occupations, and private resumes.</li>
  <li>User search, connection requests, connection management, and private tags.</li>
  <li>Job postings that can be shared with selected connections or private tag groups.</li>
  <li>Meetup creation, filtering, details, and location-based suggestions for authenticated users.</li>
  <li>Profile posts with likes, replies, reply attribution, and owner-controlled reply deletion.</li>
  <li>Self-service account deletion, including associated records and uploaded files.</li>
  <li>Administrator tools for managing non-administrator accounts.</li>
  <li>Responsive layouts for desktop and mobile devices.</li>
</ul>

<h1>Deployment Instructions</h1>

<h2>Prerequisites</h2>

<ul>
  <li>Node.js and npm.</li>
  <li>PostgreSQL.</li>
  <li>Google OAuth credentials.</li>
</ul>

<h2>Cloning the Repository and Setup</h2>

<pre><code>git clone https://github.com/jayanth-samala/TagEm.git
cd TagEm
cp backend/.env.example backend/.env</code></pre>

<p>
  Replace the placeholders in <code>backend/.env</code>. At minimum, configure the
  local PostgreSQL connection, a <code>JWT_SECRET</code>, and the Google OAuth client ID
  and secret. A Blob token is optional locally because local development stores
  uploads under <code>backend/uploads/</code>. Never commit <code>.env</code> or real
  credentials.
</p>

<h2>Installing Dependencies</h2>

<pre><code>npm --prefix backend install
npm --prefix frontend install</code></pre>

<h2>Applying Database Migrations</h2>

<pre><code>cd backend
npm run migrate:up
cd ..</code></pre>

<h2>Starting the Application</h2>

<p>Run the backend and frontend in separate terminals:</p>

<pre><code>npm --prefix backend run dev</code></pre>

<pre><code>npm --prefix frontend run dev</code></pre>

<p>
  Open the local URL printed by Vite, normally
  <code>http://localhost:5173</code>.
</p>

<h2>Testing</h2>

<pre><code>npm --prefix backend test
npm --prefix frontend run lint
npm --prefix frontend run build</code></pre>

<h2>Production Deployment</h2>

<p>
  The production application uses a Vite frontend, an Express serverless function,
  Neon PostgreSQL, and private Vercel Blob storage. See
  <a href="./DEPLOYMENT.md">DEPLOYMENT.md</a> for the required environment variables,
  database migrations, Google OAuth configuration, rate limiting, storage setup,
  and deployment verification.
</p>

<p>
  Do not place credentials, database URLs, OAuth secrets, JWT secrets, or Blob
  tokens in this README or commit them to the repository.
</p>

<h1>Tools Used</h1>

<h3>Frontend Development</h3>

<ul>
  <li>React</li>
  <li>React Router</li>
  <li>Vite</li>
  <li>CSS</li>
</ul>

<h3>Backend Development</h3>

<ul>
  <li>Node.js</li>
  <li>Express</li>
  <li>Passport and Google OAuth 2.0</li>
  <li>JSON Web Tokens</li>
  <li>bcrypt</li>
  <li>Multer</li>
  <li>Vercel Blob</li>
</ul>

<h3>Database and Infrastructure</h3>

<ul>
  <li>PostgreSQL</li>
  <li><code>pg</code> and <code>node-pg-migrate</code></li>
  <li>Neon PostgreSQL for production</li>
  <li>Vercel for frontend and API hosting</li>
</ul>

<h3>Testing and Quality</h3>

<ul>
  <li>Node.js test runner</li>
  <li>ESLint</li>
  <li>Vite production builds</li>
  <li>npm security audits</li>
</ul>
