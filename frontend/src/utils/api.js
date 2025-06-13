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
export const fecthTasks = async (token, tag = "", employee = "",
  startDate = "",
  endDate = "",
  month = ""
) => {
  const url = new URL(`${API_BASE_URL}/task-management/`);
  console.log('employee ==<>>', employee)
  console.log('tag ==<<>', tag);
  console.log('month ==<<>>', month)

  if (tag) url.searchParams.append("tag", tag);
  if (employee) url.searchParams.append("employee", employee);
  if (startDate) url.searchParams.append("start_date", startDate);
  if (endDate) url.searchParams.append("end_date", endDate);
  if (month) url.searchParams.append("month", month);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: getAuthHeaders(token),
  });

  return await handleResponse(res);
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

//  function for laod tags
export const loadTaskTags = async (token) => {
  const res = await fetch(`${API_BASE_URL}/task-tags/`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });
  const data = await handleResponse(res);
  return data;
};






// Helper to get the avatar URL
const getAvatarUrl = async (memberId) => {
  const url = `http://localhost:8000/api/get_user_avatar/${memberId}/`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`⚠️ Avatar not found for member ${memberId}. Status: ${response.status}`);
      return null;
    }

    const data = await response.json();

    const avatarUrl = data.profile_image
      ? `http://localhost:8000/${data.profile_image}`
      : "";

    return avatarUrl;
  } catch (error) {
    console.error(`Error fetching avatar for member ${memberId}:`, error);
    return null;
  }
};

// Main function to generate task cards
export const generateTaskCards = async (taskData, tagList, filterEmployeeId) => {
  const allCards = [];

  for (const task of taskData) {
    const memberNames = task.member_names.split(',').map(name => name.trim());

    for (let i = 0; i < task.members.length; i++) {
      const memberId = task.members[i];

      // ✅ Skip if filtering and this memberId doesn't match
      if (filterEmployeeId && parseInt(filterEmployeeId) !== memberId) {
        continue;
      }

      const name = memberNames[i] || `Member ${memberId}`;
      const avatar = await getAvatarUrl(memberId);

      const matchedTag = tagList.find(tag => tag.id === task.status);
      const tagName = matchedTag ? matchedTag.name : "Unknown";

      const card = {
        id: task.id,
        employee: name,
        memberId,
        avatar,
        title: task.task_name,
        description: task.description.replace(/<\/?[^>]+(>|$)/g, ""),
        date: new Date(task.created_at).toISOString().split('T')[0],
        tags: [tagName],
      };

      allCards.push(card);
    }
  }

  return allCards;
};




