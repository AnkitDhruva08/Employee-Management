import React, { useState, useEffect } from "react";
import Select from "react-select";
import CkEditor from "../editor/CkEditor";
import FileUpload from "../File/FileUpload";
import Swal from "sweetalert2";
import { fetchCurrentUserDetails } from "../../utils/api";

const ProjectCreationModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  employees,
  isEditMode,
}) => {
  const [formData, setFormData] = useState(() =>
    getInitialFormData(initialData, isEditMode)
  );

  // State to store the original description for append-only logic
  const [originalDescription, setOriginalDescription] = useState("");

  const [existingSrsFileUrl, setExistingSrsFileUrl] = useState("");
  const [existingWireframeFileUrl, setExistingWireframeFileUrl] = useState("");
  const [loggedInEmployeeName, setLoggedInEmployeeName] = useState("");

  const token = localStorage.getItem("token");
  const roleId = parseInt(localStorage.getItem("role_id")); // Get roleId from localStorage

  const phaseOptions = [
    { value: "Planning", label: "Planning" },
    { value: "Development", label: "Development" },
    { value: "Testing", label: "Testing" },
    { value: "Deployment", label: "Deployment" },
  ];

  const statusOptions = [
    { value: "In Progress", label: "In Progress" },
    { value: "Done", label: "Done" },
    { value: "Blocked", label: "Blocked" },
    { value: "Planned", label: "Planned" },
    { value: "On Hold", label: "On Hold" },
  ];

  const employeeOptions = employees.map((emp) => {
    const fullName = `${emp.first_name} ${emp.last_name}`;
    return {
      value: emp.id,
      label: roleId === 3 ? fullName : emp.username, // Use loggedInRoleId for consistency
    };
  });

  function getInitialFormData(data = null, isEdit = false) {
    if (isEdit && data) {
      return {
        project_name: data.project_name || "",
        description: data.description || "",
        startDate: data.start_date ? data.start_date.slice(0, 10) : "",
        endDate: data.end_date ? data.end_date.slice(0, 10) : "",
        status: data.status || "In Progress",
        phase: data.phase || "",
        companyName: data.company || "",
        clientName: data.client_name || "",
        assignedTo: Array.isArray(data.assigned_to)
          ? data.assigned_to.map((emp) =>
              typeof emp === "object" ? emp.id : emp
            )
          : [],
        designAvailable: data.design_available || false,
        srsFile: null, // These are for new file uploads, not existing URLs
        wireframeFile: null,
      };
    }
    return {
      project_name: "",
      description: "",
      startDate: "",
      endDate: "",
      status: "In Progress",
      phase: "",
      companyName: "",
      clientName: "",
      assignedTo: [],
      designAvailable: false,
      srsFile: null,
      wireframeFile: null,
    };
  }

  useEffect(() => {
    if (isOpen) {
      const initial = getInitialFormData(initialData, isEditMode);
      setFormData(initial);

      // Store the original description when opening the modal in edit mode
      if (isEditMode && initialData) {
        setOriginalDescription(initialData.description || "");
      } else {
        setOriginalDescription("");
      }

      setExistingSrsFileUrl(initialData?.srs_file || "");
      setExistingWireframeFileUrl(initialData?.wireframe_file || "");
    }

    // Fetch logged-in employee name
    const fetchLoggedInUserDetails = async () => {
      try {
        const userDetails = await fetchCurrentUserDetails(token);
        console.log("Logged-in user details:", userDetails); // Keep for debugging
        if (userDetails && userDetails.first_name && userDetails.last_name) {
          setLoggedInEmployeeName(
            `${userDetails.first_name} ${userDetails.last_name}`
          );
        } else {
          setLoggedInEmployeeName("User"); // Fallback name
        }
      } catch (error) {
        console.error("Failed to fetch logged-in employee details:", error);
      }
    };
    if (token) {
      fetchLoggedInUserDetails();
    }
  }, [isOpen, isEditMode, initialData, token]); // Add token to dependency array

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectChange = (selectedOptions, { name }) => {
    if (name === "assignedTo") {
      setFormData((prev) => ({
        ...prev,
        assignedTo: selectedOptions
          ? selectedOptions.map((option) => option.value)
          : [],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: selectedOptions ? selectedOptions.value : "",
      }));
    }
  };

  // --- NEW: handleDescriptionChange for append-only and initial bolding ---
  const handleDescriptionChange = (newDescription) => {
    // If it's an employee in edit mode, enforce append-only
    if (isEmployee && isEditMode) {
      // If the new description is empty or significantly shorter than the original,
      // revert to the original description to prevent deletion.
      if (
        newDescription.trim() === "<p></p>" ||
        newDescription.trim() === "" ||
        !newDescription.startsWith(originalDescription)
      ) {
        setFormData((prev) => ({ ...prev, description: originalDescription }));
        return; // Stop further processing for invalid changes
      }
    }
    // Update formData with the new description
    setFormData((prev) => ({ ...prev, description: newDescription }));
  };
  // --- END NEW ---

  // const validateForm = () => {
  //   const newErrors = {};

  //   // Common validation for all roles/modes
  //   if (!formData.description.trim() || formData.description.trim() === "<p></p>") {
  //     newErrors.description = "Description cannot be empty.";
  //   }

  //   // Role-specific validation logic
  //   if (!isEmployee || !isEditMode) {
  //     // For non-employees OR for employees in creation mode (which they shouldn't do)
  //     if (!formData.project_name.trim())
  //       newErrors.project_name = "Project name is required";
  //     if (!formData.startDate) newErrors.startDate = "Start date is required";
  //     if (formData.assignedTo.length === 0)
  //       newErrors.assignedTo = "Please assign at least one employee";
  //     if (!formData.companyName.trim()) newErrors.companyName = "Company Name is required";
  //     if (!formData.clientName.trim()) newErrors.clientName = "Client Name is required";
  //   }

  //   // Fields that employees (roleId 3) can update in edit mode
  //   // These should always be required if visible
  //   if (!formData.endDate) newErrors.endDate = "Expected Completion Date is required";
  //   if (!formData.phase) newErrors.phase = "Phase is required";


  //   return Object.keys(newErrors).length === 0;
  // };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    // if (!validateForm()) {
    //   Swal.fire({
    //     icon: "error",
    //     title: "Validation Failed",
    //     text: "Please fix the errors in the form.",
    //   });
    //   return;
    // }

    let finalDescription = formData.description;

    // --- NEW: Prepend employee name and timestamp for employee updates ---
    if (isEmployee && isEditMode) {
      const now = new Date();
      const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      const formattedDate = now.toLocaleDateString('en-US', options);

      // Construct the header with bold employee name and timestamp
      const updateHeader = `<p><strong>${loggedInEmployeeName} updated on ${formattedDate}:</strong></p>`;

      // Check if new content was truly added beyond the original description
      const newContentAdded = (finalDescription.length > originalDescription.length) && finalDescription.startsWith(originalDescription);

      if (newContentAdded) {
        // If new content was added, extract it and append it after the header
        const appendedContent = finalDescription.substring(originalDescription.length);
        finalDescription = `${originalDescription}${updateHeader}${appendedContent}`;
      } else if (originalDescription.trim() !== "") {
        // If no new content but original description exists, just add the header.
        // This handles cases where only other fields are updated, but description remains untouched.
        // We still log the update in the description if it was touched/saved without *new* content.
        finalDescription = `${originalDescription}${updateHeader}`;
      } else {
        // If original description was empty and now there's content, simply add header
        finalDescription = `${updateHeader}${finalDescription}`;
      }
    }
    // --- END NEW ---

    onSubmit({ ...formData, description: finalDescription }); // Pass the possibly modified description

    Swal.fire({
      icon: "success",
      title: isEditMode ? "Project Updated" : "Project Created",
      text: isEditMode
        ? "Project changes have been saved."
        : "Your new project has been created successfully!",
    });
  };

  if (!isOpen) return null;

  const isEmployee = roleId === 3; // Use the roleId from localStorage

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 animate-fade-in">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">
          {isEditMode ? "Edit Project" : "Create New Project"}
        </h2>

        <div className="space-y-6">
          {/* Project Name - Hidden if employee OR if employee and in edit mode */}
          {(!isEmployee || !isEditMode) && (
            <div>
              <label className="block font-medium mb-1">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="project_name"
                value={formData.project_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add project name"
                required
                disabled={isEditMode} // Always disabled in edit mode, as only for non-employees in creation.
              />
            </div>
          )}

          {/* Description - Always visible, but read-only for employee in creation mode */}
          <div>
            <label className="block font-medium mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <CkEditor
              value={formData.description}
              onChange={handleDescriptionChange} // Use the new handler
              readOnly={isEmployee && !isEditMode} // Read-only if employee and NOT in edit mode
            />
            {isEmployee && isEditMode && (
              <p className="text-sm text-gray-500 mt-1">
                As an employee, you can only add new updates to the description. Previous content cannot be removed.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date - Hidden if employee OR if employee and in edit mode */}
            {(!isEmployee || !isEditMode) && (
              <div>
                <label className="block font-medium mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={isEditMode} // Always disabled in edit mode
                />
              </div>
            )}
            {/* Expected Completion Date - Always visible, editable for all roles */}
            <div>
              <label className="block font-medium mb-1">
                Expected Completion Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={!isEmployee && isEditMode} // Only disabled if NOT employee and in edit mode
                                                    // This was correct in previous version, now it's enabled for all
              />
            </div>

            {/* Phases/stages - Always visible, editable for all roles */}
            <div>
              <label className="block font-medium mb-1">
                phases/stages <span className="text-red-500">*</span>
              </label>
              <Select
                name="phase"
                options={phaseOptions}
                value={phaseOptions.find(
                  (option) => option.value === formData.phase
                )}
                onChange={(selectedOption) =>
                  handleSelectChange(selectedOption, { name: "phase" })
                }
                classNamePrefix="react-select"
                placeholder="Select Phase"
                disabled={!isEmployee && isEditMode} // Only disabled if NOT employee and in edit mode
              />
            </div>

            {/* Status - Always visible, editable for all roles */}
            <div>
              <label className="block font-medium mb-1">Status</label>
              <Select
                name="status"
                options={statusOptions}
                value={statusOptions.find(
                  (option) => option.value === formData.status
                )}
                onChange={(selectedOption) =>
                  handleSelectChange(selectedOption, { name: "status" })
                }
                classNamePrefix="react-select"
                placeholder="Select Status"
                disabled={!isEmployee && isEditMode} // Only disabled if NOT employee and in edit mode
              />
            </div>

            {/* Company Name - Hidden if employee OR if employee and in edit mode */}
            {(!isEmployee || !isEditMode) && (
              <div>
                <label className="block font-medium mb-1">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  disabled={isEditMode} // Always disabled in edit mode
                />
              </div>
            )}

            {/* Client Name - Hidden if employee OR if employee and in edit mode */}
            {(!isEmployee || !isEditMode) && (
              <div>
                <label className="block font-medium mb-1">Client Name</label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  disabled={isEditMode} // Always disabled in edit mode
                />
              </div>
            )}
          </div>

          {/* Assigned To Multi-Select - Hidden if employee OR if employee and in edit mode */}
          {(!isEmployee || !isEditMode) && (
            <div>
              <label className="block font-medium mb-1">
                Assigned To <span className="text-red-700">*</span>
              </label>
              <Select
                name="assignedTo"
                options={employeeOptions}
                isMulti
                value={employeeOptions.filter((option) =>
                  formData.assignedTo.includes(option.value)
                )}
                onChange={(selectedOptions) =>
                  handleSelectChange(selectedOptions, { name: "assignedTo" })
                }
                classNamePrefix="react-select"
                placeholder="Select employees"
                disabled={isEditMode} // Always disabled in edit mode
              />
            </div>
          )}

          {/* File Uploads - Visible if not employee (any mode) or if employee in edit mode */}
          {(!isEmployee || (isEmployee && isEditMode)) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* SRS Document */}
              <div>
                <label className="block font-medium mb-1">SRS Document</label>
                <FileUpload
                  isView={false}
                  isCombine={false}
                  initialFiles={existingSrsFileUrl ? [existingSrsFileUrl] : []}
                  onFilesSelected={(files) => {
                    const selected = files[0];
                    setFormData((prev) => ({
                      ...prev,
                      srsFile: selected instanceof File ? selected : null,
                      srsFileUrl: typeof selected === "string" ? selected : "",
                    }));
                    setExistingSrsFileUrl(""); // Clear existing URL if a new file is selected
                  }}
                  disabled={!isEmployee && isEditMode} // Enabled for employee in edit mode and others (if not editing)
                />
              </div>

              {/* Conditionally render Wireframe Document if Design Available is checked
                Visible if not employee (any mode) or if employee in edit mode */}
              {(formData.designAvailable || (isEmployee && isEditMode)) && (
                <div>
                  <label className="block font-medium mb-1">
                    Wireframe Document
                  </label>
                  <FileUpload
                    isView={false}
                    isCombine={false}
                    initialFiles={
                      existingWireframeFileUrl ? [existingWireframeFileUrl] : []
                    }
                    onFilesSelected={(files) => {
                      const selected = files[0];
                      setFormData((prev) => ({
                        ...prev,
                        wireframeFile: selected instanceof File ? selected : null,
                        wireframeFileUrl:
                          typeof selected === "string" ? selected : "",
                      }));
                      setExistingWireframeFileUrl(""); // Clear existing URL if a new file is selected
                    }}
                    disabled={!isEmployee && isEditMode} // Enabled for employee in edit mode and others (if not editing)
                  />
                </div>
              )}

              {/* Design Available Checkbox - Hidden if employee OR if employee and in edit mode */}
              {(!isEmployee || !isEditMode) && (
                <div className="flex flex-col justify-center mt-6">
                  <label className="inline-flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="designAvailable"
                      checked={formData.designAvailable}
                      onChange={handleChange}
                      className="form-checkbox h-5 w-5 text-blue-600"
                      disabled={isEditMode} // Always disabled in edit mode
                    />
                    <span className="text-gray-700">Design Available</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition"
            >
              Cancel
            </button>
            <button
              type="button" // Keep as button, as onClick handles validation and submission
              onClick={handleSubmitForm}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              {isEditMode ? "Save Changes" : "Create Project"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCreationModal;