// utils/api.js

const API_BASE_URL = "http://localhost:8000/api";

// 🔁 Central response handler with redirect on 401
const handleResponse = async (res) => {
  if (res.status === 401) {
    localStorage.clear();
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Something went wrong");
  }

  return await res.json();
}


// 🔐 Role-Based Dashboard API
export const fetchDashboard = async (token) => {
  const res = await fetch(`${API_BASE_URL}/dashboard/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return await handleResponse(res);
};

// 🔗 Dashboard Links
export const fetchDashboardLink = async (token) => {
  const res = await fetch(`${API_BASE_URL}/dashboard-link/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return await handleResponse(res);
};

// 📅 Holiday Calendar
export const fetchHolidays = async (token) => {
  const res = await fetch(`${API_BASE_URL}/holidays/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return await handleResponse(res);
};

// 🚪 Logout
export const logout = async (token) => {
  const res = await fetch(`${API_BASE_URL}/logout/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await handleResponse(res);
  return data;
};


// 👥 Employees
export const fetchEmployees = async (token) => {
  const res = await fetch(`${API_BASE_URL}/employees/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await handleResponse(res);
  return data
};


// 👥 Employee Details
export const fetchEmployeeDetails = async (token, id) => {
  const res = await fetch(`${API_BASE_URL}/employee/${id}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await handleResponse(res);
  return data
};






// 👤 User Profile
export const fetchUserProfile = async (token) => {
  const res = await fetch(`${API_BASE_URL}/employee-profile/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await handleResponse(res);
  return data
};




//  User project
export const fetchProjectsData = async (token) => {
  const res = await fetch(`${API_BASE_URL}/project-management/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await handleResponse(res);
  return data
};


export const fetchProjects = async (token, page = 1, pageSize = 2, status = "", project_id) => {
  const url = new URL(`${API_BASE_URL}/project-management/`);
  url.searchParams.append("page", page);
  url.searchParams.append("page_size", pageSize);
  if (status) url.searchParams.append("status", status);
  if (project_id) url.searchParams.append("project_id", project_id);
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await handleResponse(res);
  return data;
};





// function for fetching bugs reports
export const fetchBugsReports = async (
  token,
  status = "",
  priority = "",
  project_id = ""
) => {
  const url = new URL(`${API_BASE_URL}/bugs-reportes/`);

  if (status) url.searchParams.append("status", status);
  if (priority) url.searchParams.append("priority", priority);
  if (project_id) url.searchParams.append("project_id", project_id);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await handleResponse(res);
  return data;
};





//  function for fetch the bugs reports 
export const fecthTasks = async (token) => {
  const res = await fetch(`${API_BASE_URL}/task-management/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await handleResponse(res);
  return data
};


//  function for fetch the bugs reports 
export const fetchProjectSidebar = async (token) => {
  const res = await fetch(`${API_BASE_URL}/project-sidebar/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await handleResponse(res);
  return data
};


//  function for fetch the bugs reports 
export const fetchTaskSideBar = async (token) => {
  const res = await fetch(`${API_BASE_URL}/task-sidebar/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await handleResponse(res);
  return data
};


