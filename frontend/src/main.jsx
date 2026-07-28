import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './main.css'
import App from './App.jsx'

const nativeFetch = window.fetch.bind(window);

window.fetch = async (resource, options = {}) => {
  const url = typeof resource === "string" ? resource : resource.url;
  const isApiRequest = url.startsWith("http://localhost:5001/api/");

  if (!isApiRequest) {
    return nativeFetch(resource, options);
  }

  const headers = new Headers(options.headers || (resource instanceof Request ? resource.headers : undefined));
  const method = (options.method || (resource instanceof Request ? resource.method : "GET")).toUpperCase();
  const csrfToken = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("tagem_csrf="))
    ?.split("=")
    .slice(1)
    .join("=");

  if (!["GET", "HEAD", "OPTIONS"].includes(method) && csrfToken) {
    headers.set("X-CSRF-Token", decodeURIComponent(csrfToken));
  }

  const response = await nativeFetch(resource, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401) {
    localStorage.removeItem("user");
    if (window.location.pathname !== "/login") window.location.assign("/login");
  }

  return response;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
