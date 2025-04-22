# Employee-Management
Employee Management


📘 Project Documentation: Company-Employee Management System
📌 Objective
A centralized system enabling companies to manage employees, roles, documents, leaves, holidays, and events. Employees can access their data and manage leaves via a dedicated portal.

👥 User Types

Role	Description
Company	Registers the organization, manages roles, employees, holidays, and events
Employee	Added by the company, can view data and apply for leaves
HR/Admin	Employee with elevated rights (manage roles, employees, leaves)
🧩 Key Features
🔐 Authentication
Common login for all roles

JWT-based authentication

Auto-redirect after login:

/company-dashboard

/employee-dashboard

🏢 Company Management
Register company with:

Name

Team size (0–10, 11–20, etc.)

Address & Email

Login & dashboard access

👨‍💼 Employee Management
Sections:
Personal Details

Name, DOB, Gender, Contact, Blood Group, Marital Status

Addresses

Present & Permanent

Emergency Contact

Name, Relation, Number

Nominee Details

Name, DOB, Relation, Contact

Bank Details

Account Info + Upload Cancel Cheque

Office Details

Join Date, Probation, Role, Reporting Manager, Leaving Date

Documents Upload

Photo, Aadhar*, PAN*, DL, Appointment, Promotion, Resume*, ESIC Card, Insurance Number, EPF (Y/N), UAN

🗂 Role Management
Add, view, delete roles

Prevent duplicates

Restrict delete if assigned to an employee

📅 Holidays & Events
Add/view/update/delete

Employees can see upcoming holidays/events

🛫 Leave Management
Employee can apply for leave

Company can view, approve/reject with comments

Leave status: Approved / Rejected / Pending

🕒 Leave Policy

Type	Credit Condition
CL	1/month
PL	1.5/month after 240 days
Credits auto-applied on 1st of each month

🧱 Database Schema Overview (Relational)
🔹 Company

Field	Type
id	PK
name	string
team_size	string
email	string
address	text
password	hashed
created_at	datetime
🔹 Employee

Field	Type
id	PK
company_id (FK)	FK → Company
role_id (FK)	FK → Role
first_name, middle_name, last_name	string
contact_number	string
dob, gender	date, enum
blood_group	string
marital_status	string
spouse_name	nullable
present_address	text
permanent_address	text
join_date	date
probation_end_date	date
job_role	string
reporting_to	FK → Employee
leaving_date	date
epf_member	boolean
uan	string
password	hashed
created_at	datetime
🔹 BankDetails

Field	Type
employee_id (FK)	FK → Employee
account_holder_name	string
bank_name	string
branch_name	string
ifsc_code	string
account_number	string
account_type	enum
bank_details_pdf	File
🔹 EmployeeDocuments

Field	Type
employee_id (FK)	FK → Employee
photo	File
aadhar	File
pan	File
dl	File
appointment	File
promotion	File
resume	File
esic_card	File
insurance_number	string
uan	string
epf_member	enum
🔹 Leave

Field	Type
employee_id (FK)	FK → Employee
type	enum (CL/PL)
start_date	date
end_date	date
reason	text
status	enum (Pending, Approved, Rejected)
reviewer_comment	text
created_at	datetime
🔹 Role, Holiday, Event

Table	Key Fields
Role	name (unique), company_id
Holiday	title, date, description
Event	title, date, details
🌐 API Endpoints

Method	Endpoint	Description
POST	/register-company	Register a new company
POST	/login	Common login
GET	/me	Get logged-in user info
POST	/employees	Add employee
GET	/employees/:id	Get employee details
PUT	/employees/:id	Update employee
DELETE	/employees/:id	Delete employee
POST	/roles	Create new role
GET	/roles	List roles
DELETE	/roles/:id	Delete role
POST	/leaves/apply	Employee applies for leave
GET	/leaves/requests	Company views all requests
PATCH	/leaves/:id/status	Company updates leave status
POST	/holidays	Add holiday
GET	/holidays	List holidays
POST	/events	Add event
GET	/events	View events
GET	/dashboard/	Get user details after login
⚙️ Technology Stack

Layer	Stack
Frontend	React.js, Tailwind CSS
Backend	Django + DRF (recommended)
Database	PostgreSQL
Auth	JWT Authentication
File Storage	Local Media / AWS S3
Deployment	Vercel (FE), Render/EC2 (BE)
📈 Future Enhancements
🗓️ Color-coded leave calendar

✉️ Email notifications on leave decisions

🔐 Multi-role assignment

📊 Leave analytics dashboard

📅 Event/holiday reminders

🗂 Project Folder Structure (Recommended)
pgsql
Copy
Edit
company-employee-system/
├── backend/
│   ├── core/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views/
│   │   ├── urls.py
│   ├── media/
│   ├── settings.py
│   ├── urls.py
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   ├── public/
│   └── index.js













ERD Representation
**User **

Attributes:
id (Primary Key)
username
password
email
is_company (Boolean)
is_employee (Boolean)
Relationships:
One-to-One with Company
One-to-Many with Employee
Company

Attributes:
id (Primary Key)
company_name
email (Unique)
team_size
address
Relationships:
One-to-One with **User **
One-to-Many with Event
One-to-Many with Holiday
Role

Attributes:
id (Primary Key)
role_name
Relationships:
One-to-Many with Employee
Employee

Attributes:
id (Primary Key)
first_name
middle_name
last_name
contact_number
company_email
personal_email
date_of_birth
gender
Relationships:
Many-to-One with **User ** (Company)
Many-to-One with Role
One-to-Many with EmergencyContact
One-to-Many with NomineeDetails
One-to-Many with BankDetails
One-to-Many with OfficeDetails
One-to-One with EmployeeDocument
One-to-Many with LeaveRequest
EmergencyContact

Attributes:
id (Primary Key)
emergency_name
emergency_relation
emergency_contact
Relationships:
Many-to-One with Employee
NomineeDetails

Attributes:
id (Primary Key)
nominee_name
nominee_dob
nominee_relation
nominee_contact
Relationships:
Many-to-One with Employee
BankDetails

Attributes:
id (Primary Key)
account_holder_name
bank_name
branch_name
ifsc_code
account_number
account_type
bank_details_pdf
Relationships:
Many-to-One with Employee
OfficeDetails

Attributes:
id (Primary Key)
date_of_joining
probation_end
reporting_to
date_of_leaving
Relationships:
Many-to-One with Employee
EmployeeDocument

Attributes:
id (Primary Key)
photo
aadhar
pan
dl
appointment
promotion
resume
esic_card
insurance_number
epf_member
uan
Relationships:
One-to-One with Employee
Event

Attributes:
id (Primary Key)
title
date
description
Relationships:
Many-to-One with Company
Holiday

Attributes:
id (Primary Key)
name
date
Relationships:
Many-to-One with Company
LeaveRequest

Attributes:
id (Primary Key)
from_date
to_date
reason
status
Relationships:
Many-to-One with Employee
Visual Representation




<!-- REACT EDITOR -->
npm install react-quill
npm install quill
npm install react-date-range date-fns

