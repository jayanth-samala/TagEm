<h1> Project Description </h1>
Tag'em is a networking platform that helps recruiters easily match good fit candidates with job postings. It works by creating an interface where users can privately “tag” people into fits that they would be good for based on their personal knowledge of the connection. Then, when recruiters are looking for hirees, they are able to selectively broadcast their positional opening to good fits within their network.

<h1> Contributions</h1>
Jayanth was responsible for the meetups, jobs, tagging, and admin frontend and backend, Gabriel was responsible for the profile frontend and backend and google authentication strategy frontend and backend, Daniyal was responsible for the connections frontend and backend and local authentication strategy frontend and backend.

<h1> Feature List </h1>
Tag'em currently has a regular login using an email and password and a google oauth login. Once logged in, there are 4 pages, Profile, Connections, Meetups, Jobs, and Admin (if you are logged in as an admin account). In the profile page, you can update profile picture, Name, Bio, Resume, and make a blog post. On the Connections page, you can search for individuals on the app using the search bar, and send a connection request to them if you wish. You can also accept connection requests, and give connections a personal tag here. Then, there is the meetups page. Here you can post a meetup with name, location, date, and description fields, which once posted can be seen by all Tag'em users. Meetups can be filtered throught the top search bar by name, location, and date. When you click on a meetup, other meetups happening at the same location are also recommended to you. In the Jobs page, you can make a job posting with the job title, company, location, and job details. When you create a job posting, you broadcast it to your choice of connections, whom you can filter by your personalized tags, so you are easily able to send job postings to people in your network who are good fits for the role. Finally there is the Admin page. If you are the admin, you are able to reset and repopulate the database.

<h1> Deployment Instructions </h1>
In order to deploy our code, first you must have PostgreSQL installed on your machine.
<h3>For MacOS users </h3> We recommend simply installing it via Homebrew. A similar installer to the Windows installer is available if that's preferred.  Then, start up a database on your local machine using the command. To stop, same command but replace start with stop.
<ul> - "brew services start postgresql@18" </ul>
<ul> - "brew services stop postgresql@18"</ul>
<h3>For Windows users</h3>
We recommend installing from the interactive installer on the PostgreSQL website. You could use either the GUI app "pgAdmin 4" or terminal app "SQL Shell (psql)" that the recommended installer provides to set up your local database

<h3> Cloning the Repo and Setup
</h3>
<p>From here, simply clone the repo and set up your .env file as a loose file in the backend folder. <b>Important to note, in your .env file you will want to have these variables defined:</b></p>
<ul>DB_USER</ul>
<ul>DB_PASSWORD</ul>
<ul>DB_HOST</ul>
<ul>DB_PORT</ul>
<ul>DB_NAME</ul>
<ul>DATABASE_URL  ("a sample assignment for this is: postgresql://DB_USER:DB_PASSWORD@DB_HOST:DB_PORT/DB_NAME") </ul> 
<ul>GOOGLE_CLIENT_ID</ul>
<ul>GOOGLE_CLIENT_SECRET</ul>
<p>Next, open two terminals, one from the backend (Directory labeled "backend"), and one from the frontend (Directory labelled "TagEm"), then, run the following commands:</p>
<p>Frontend:</p>
<ul>"npm install" </ul>
<ul>"npm run dev" </ul>
<p>Backend:</p>
<ul>"npm install"</ul>
<ul>"npm run migrate:up"</ul>
<ul>"npm run dev" </ul>

You can now use TagEm by pasting the localhost link given to you in the frontend terminal into your local browser.

This will provide a locally hosted link to view your local deployment of our website.

<h1> Tools Used </h1>
For our frontend development:
<ul> - React, React-Router. </ul>
For our backend development:
<ul>- Node.js, Express, Multer, Bcrypt, Google OAuth, and Passport.</ul>
For our database:
<ul>PostgreSQLFor and node-pg-migrate.</ul> 