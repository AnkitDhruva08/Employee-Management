import React, { useState, useEffect } from "react";
import Select from "react-select";
import CkEditor from "../editor/CkEditor";
import FileUpload from "../File/FileUpload";
import Swal from "sweetalert2";

const ProjectCreationModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  employees,
  isEditMode,
}) => {
  // Initialize form data based on whether editing or creating
  const [formData, setFormData] = useState(() =>
    getInitialFormData(initialData, isEditMode)
  );

  // Store URLs of existing files for preview links
  const [existingSrsFileUrl, setExistingSrsFileUrl] = useState("");
  const [existingWireframeFileUrl, setExistingWireframeFileUrl] = useState("");

  // Store initial files to pass into FileUpload component
  const [initialSrsFile, setInitialSrsFile] = useState(null);
  const [initialWireframeFile, setInitialWireframeFile] = useState(null);

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

  const employeeOptions = employees.map((emp) => ({
    value: emp.id,
    label: emp.username,
  }));

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
        srsFile: null,
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

      // Load existing file URLs from initialData (usually strings pointing to file URLs)
      setExistingSrsFileUrl(initialData?.srs_file || "");
      setExistingWireframeFileUrl(initialData?.wireframe_file || "");

      // Pass initial file URLs to FileUpload component (as array of URLs)
      setInitialSrsFile(initialData?.srs_file || null);
      setInitialWireframeFile(initialData?.wireframe_file || null);
    }
  }, [isOpen, isEditMode, initialData]);

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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.project_name.trim())
      newErrors.project_name = "Project name is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";
    if (!formData.phase) newErrors.phase = "Phase is required";
    if (formData.assignedTo.length === 0)
      newErrors.assignedTo = "Please assign at least one employee";
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      Swal.fire({
        icon: "error",
        title: "Validation Failed",
        text: "Please fix the errors in the form.",
      });
      return;
    }

    onSubmit(formData);

    Swal.fire({
      icon: "success",
      title: isEditMode ? "Project Updated" : "Project Created",
      text: isEditMode
        ? "Project changes have been saved."
        : "Your new project has been created successfully!",
    });
  };

  if (!isOpen) return null;

  console.log("existingSrsFileUrl:", existingSrsFileUrl);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 animate-fade-in">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">
          {isEditMode ? "Edit Project" : "Create New Project"}
        </h2>

        <div className="space-y-6">
          {/* Project Name */}
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
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <CkEditor
              value={formData.description}
              onChange={(data) =>
                setFormData((prev) => ({ ...prev, description: data }))
              }
            />
          </div>

          {/* Dates and Selects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              />
            </div>
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
              />
            </div>

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
              />
            </div>

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
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Company Name</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Client Name</label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {/* Assigned To Multi-Select */}
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
            />
          </div>

          {/* File Uploads */}
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
                  setInitialSrsFile(null);
                  setExistingSrsFileUrl("");
                }}
              />
            </div>

            {/* Conditionally render Wireframe Document if Design Available is checked */}
            {formData.designAvailable && (
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
                    setInitialWireframeFile(null);
                    setExistingWireframeFileUrl("");
                  }}
                />
              </div>
            )}

            {/* Design Available Checkbox */}
            <div className="flex flex-col justify-center mt-6">
              <label className="inline-flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="designAvailable"
                  checked={formData.designAvailable}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="text-gray-700">Design Available</span>
              </label>
            </div>
          </div>

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
              type="click"
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
