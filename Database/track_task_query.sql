
SELECT 
    au.id AS user_id,
    au.username,
    e.id AS employee_id,
    e.first_name,
    e.last_name,
    a.date AS attendance_date,
    a.login_time,
    a.logout_time,
    a.status AS attendance_status,
    t.id AS task_id,
    t.task_name,
    t.status AS task_status,
    t.progress AS task_progress,
    p.project_name AS related_project,
    b.id AS bug_id,
    b.title AS bug_title,
    b.status AS bug_status,
    b.priority AS bug_priority
FROM 
    core_user au
JOIN 
    core_employee e ON au.id = e.company_id
LEFT JOIN 
    core_attendance a ON a.user_id = au.id
LEFT JOIN 
    core_task_members tm ON tm.employee_id = e.id
LEFT JOIN 
    core_task t ON tm.task_id = t.id
LEFT JOIN 
    core_project p ON t.project_id = p.id
LEFT JOIN 
    core_bug_assigned_to ba ON ba.employee_id = e.id
LEFT JOIN 
    core_bug b ON ba.bug_id = b.id
WHERE 
    a.date BETWEEN '2025-05-01' AND '2025-05-23'
    AND a.active = true
    AND (t.active = true OR t.id IS NULL)
    AND (b.active = true OR b.id IS NULL)
	AND e.id = 9
ORDER BY 
    e.id, a.date DESC;



SELECT 
    a.date AS attendance_date,
    COUNT(DISTINCT t.id) AS total_tasks,
    COUNT(DISTINCT b.id) AS total_bugs,
    ARRAY_AGG(DISTINCT t.task_name) FILTER (WHERE t.id IS NOT NULL) AS task_names,
    ARRAY_AGG(DISTINCT b.title) FILTER (WHERE b.id IS NOT NULL) AS bug_titles,
    MIN(a.login_time) AS login_time,
    MAX(a.logout_time) AS logout_time,
    MAX(a.status) AS attendance_status
FROM 
    core_user au
JOIN 
    core_employee e ON au.id = e.company_id
LEFT JOIN 
    core_attendance a ON a.user_id = au.id
LEFT JOIN 
    core_task_members tm ON tm.employee_id = e.id
LEFT JOIN 
    core_task t ON tm.task_id = t.id
LEFT JOIN 
    core_project p ON t.project_id = p.id
LEFT JOIN 
    core_bug_assigned_to ba ON ba.employee_id = e.id
LEFT JOIN 
    core_bug b ON ba.bug_id = b.id
WHERE 
    a.date BETWEEN '2025-05-01' AND '2025-05-23'
    AND a.active = true
    AND (t.active = true OR t.id IS NULL)
    AND (b.active = true OR b.id IS NULL)
    AND e.id = 9
GROUP BY 
    a.date
ORDER BY 
    a.date DESC;






SELECT 
    a.date AS attendance_date,
    e.id AS employee_id,
    e.first_name,
    e.last_name,
    a.login_time,
    a.logout_time,
    a.status AS attendance_status,
    
    STRING_AGG(DISTINCT t.task_name, ', ') AS task_names,
    STRING_AGG(DISTINCT t.status, ', ') AS task_statuses,
    STRING_AGG(DISTINCT p.project_name, ', ') AS project_names,
    STRING_AGG(DISTINCT p.status, ', ') AS project_statuses,

    STRING_AGG(DISTINCT b.title, ', ') AS bug_titles,
    STRING_AGG(DISTINCT b.status, ', ') AS bug_statuses,
    STRING_AGG(DISTINCT b.priority, ', ') AS bug_priorities

FROM 
    core_user au
JOIN 
    core_employee e ON au.id = e.company_id
LEFT JOIN 
    core_attendance a ON a.user_id = au.id
LEFT JOIN 
    core_task_members tm ON tm.employee_id = e.id
LEFT JOIN 
    core_task t ON tm.task_id = t.id
LEFT JOIN 
    core_project p ON t.project_id = p.id
LEFT JOIN 
    core_bug_assigned_to ba ON ba.employee_id = e.id
LEFT JOIN 
    core_bug b ON ba.bug_id = b.id
WHERE 
    a.date BETWEEN '2025-05-01' AND '2025-05-23'
    AND a.active = true
    AND (t.active = true OR t.id IS NULL)
    AND (b.active = true OR b.id IS NULL)
    AND e.id = 9
GROUP BY 
    a.date, e.id, e.first_name, e.last_name, a.login_time, a.logout_time, a.status
ORDER BY 
    a.date DESC;