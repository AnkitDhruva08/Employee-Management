// utils/api.js

const API_BASE_URL = "http://localhost:8000/api";


const handleResponse = async (res) => {
  if (res.status === 401) {
    localStorage.removeItem("authToken");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    let errorMessage = "Something went wrong";
    try {
      const errorData = await res.json();
      errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
    } catch {
      errorMessage = await res.text();
    }
    throw new Error(errorMessage);
  }

  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await res.json();
  } else {
    return null;
  }
};

const getAuthHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});


// 🔐 Role-Based Dashboard API
export const fetchDashboard = async (token) => {
  const res = await fetch(`${API_BASE_URL}/dashboard/`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });
  return await handleResponse(res);
};

// 🔗 Dashboard Links
export const fetchDashboardLink = async (token) => {
  const res = await fetch(`${API_BASE_URL}/dashboard-link/`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });

  return await handleResponse(res);
};

// 📅 Holiday Calendar
export const fetchHolidays = async (token) => {
  const res = await fetch(`${API_BASE_URL}/holidays/`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });
  return await handleResponse(res);
};

// 🚪 Logout
export const logout = async (token) => {
  const res = await fetch(`${API_BASE_URL}/logout/`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });

  const data = await handleResponse(res);
  return data;
};


// 👥 Employees
export const fetchEmployees = async (token) => {
  const res = await fetch(`${API_BASE_URL}/employees/`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });
  const data = await handleResponse(res);
  return data
};


// 👥 Employee Details
export const fetchEmployeeDetails = async (token, id) => {
  const res = await fetch(`${API_BASE_URL}/employee/${id}/`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });
  const data = await handleResponse(res);
  return data
};






// 👤 User Profile
export const fetchUserProfile = async (token) => {
  const res = await fetch(`${API_BASE_URL}/employee-profile/`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });
  const data = await handleResponse(res);
  return data
};




//  User project
export const fetchProjectsData = async (token) => {
  const res = await fetch(`${API_BASE_URL}/project-management/`, {
    method: "GET",
    headers: getAuthHeaders(token),
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
    headers: getAuthHeaders(token),
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
    headers: getAuthHeaders(token),
  });

  const data = await handleResponse(res);
  return data;
};

// function for fetching bug details by id
export const fetchBugDetails = async (token, bugId) => {
  const res = await fetch(`${API_BASE_URL}/bugs-reportes/${bugId}/`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });
  const data = await handleResponse(res);
  return data;
};





//  function for fetch the bugs reports 
export const fecthTasks = async (token) => {
  const res = await fetch(`${API_BASE_URL}/task-management/`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });
  const data = await handleResponse(res);
  return data
};


//  function for fetch the bugs reports 
export const fetchProjectSidebar = async (token) => {
  const res = await fetch(`${API_BASE_URL}/project-sidebar/`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });
  const data = await handleResponse(res);
  return data
};


//  function for fetch the bugs reports 
export const fetchTaskSideBar = async (token) => {
  const res = await fetch(`${API_BASE_URL}/task-sidebar/`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });
  const data = await handleResponse(res);
  return data
};



// function for fetching notifications
export const fetchNotifications = async (token) => {
  const res = await fetch(`${API_BASE_URL}/notifications/`, {
    headers: getAuthHeaders(token),
  });
  return handleResponse(res);
};

export const fetchNotificationById = async (token, id) => {
  const res = await fetch(`${API_BASE_URL}/notifications/${id}/`, {
    headers: getAuthHeaders(token),
  });
  return handleResponse(res);
};


//  fect dashboard details 
export const fetchDashboardDetails = async (token) => {
  const res = await fetch(`${API_BASE_URL}/dashboard/`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });
  const data = await handleResponse(res);
  return data;
};


//  fecth unread notifications
export const fetchUnreadNotifications = async (token) => {
  const res = await fetch(`${API_BASE_URL}/notifications/unread/`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });
  const data = await handleResponse(res);
  return data;
};


// fecth projec based on id
export const fetchProjectById = async (token, project_id) => {
  const res = await fetch(`${API_BASE_URL}/project-management/${project_id}/`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });
  const data = await handleResponse(res);
  return data;
};


// project dropdown
export const fetchProjectDropdown = async (token) => {
  const res = await fetch(`${API_BASE_URL}/project-dropdown/`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });
  const data = await handleResponse(res);
  return data;
};



// fetch current logged in user details
export const fetchCurrentUserDetails = async (token) => {
  const res = await fetch(`${API_BASE_URL}/current-user-profile/`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });
  const data = await handleResponse(res);
  return data;
};


// fetch user role 
export const fetchRoles = async (token) => {
  const res = await fetch(`${API_BASE_URL}/roles/`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });
  const data = await handleResponse(res);
  return data;
};


// load notification

export const loadNotifications = async (token) => {
  const res = await fetch(`${API_BASE_URL}/roles/`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });
  const data = await handleResponse(res);
  return data;
};