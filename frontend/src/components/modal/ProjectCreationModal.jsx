import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import CkEditor from '../editor/CkEditor';
import FileUpload from "../File/FileUpload";
import Swal from 'sweetalert2';

const ProjectCreationModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  employees,
  isEditMode,
}) => {
  const [formData, setFormData] = useState({
    project_name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'In Progress',
    phase: '',
    companyName: '',
    clientName: '',
    assignedTo: [],
    designAvailable: false,
    srsFile: null,
    wireframeFile: null,
  });

  console.log('employees ==<<<>>', employees)

  const [srsFileName, setSrsFileName] = useState('');
  const [wireframeFileName, setWireframeFileName] = useState('');

  const phaseOptions = [
    { value: 'Planning', label: 'Planning' },
    { value: 'Development', label: 'Development' },
    { value: 'Testing', label: 'Testing' },
    { value: 'Deployment', label: 'Deployment' },
  ];

  const statusOptions = [
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Done', label: 'Done' },
    { value: 'Blocked', label: 'Blocked' },
    { value: 'Planned', label: 'Planned' },
    { value: 'On Hold', label: 'On Hold' },
  ];

  const employeeOptions = employees.map(emp => ({
    value: emp.id,
    label: emp.username
  }));

  useEffect(() => {
    if (isOpen && initialData) {
      console.log('initialData ==<<<>>',initialData);
      setFormData({
        project_name: initialData.project_name || '',
        description: initialData.description|| '',
        startDate: initialData.start_date || '',
        endDate: initialData.end_date || '',
        status: initialData.status || 'In Progress',
        phase: initialData.phase || '', 
        companyName: initialData.company || '',
        clientName: initialData.client_name || '',
        assignedTo: initialData.assigned_to || [],
        designAvailable: initialData.design_available || false,
        srsFile: null,
        wireframeFile: null,
      });
    } else if (isOpen) {
      setFormData({
        project_name: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'In Progress',
        phase: '',
        companyName: '',
        clientName: '',
        assignedTo: [],
        designAvailable: false,
        srsFile: null,
        wireframeFile: null,
      });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDescriptionChange = (content) => {
    setFormData(prev => ({ ...prev, description: content }));
  };

  const handleSelectChange = (selectedOptions, { name }) => {
    if (name === 'assignedTo') {
      setFormData(prev => ({
        ...prev,
        assignedTo: selectedOptions ? selectedOptions.map(option => option.value) : [],
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: selectedOptions ? selectedOptions.value : '',
      }));
    }
  };


  const validateForm = () => {
    const newErrors = {};
  
    if (!formData.project_name.trim()) newErrors.project_name = "Project name is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";
    if (!formData.phase) newErrors.phase = "Phase is required";
    if (formData.assignedTo.length === 0) newErrors.assignedTo = "Please assign at least one employee";
  
    // setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Failed',
        text: 'Please fix the errors in the form.',
      });
      return;
    }
  
    onSubmit(formData);
  
    if (!isEditMode) {
      Swal.fire({
        icon: 'success',
        title: 'Project Created',
        text: 'Your new project has been created successfully!',
      });
    } else {
      Swal.fire({
        icon: 'success',
        title: 'Project Updated',
        text: 'Project changes have been saved.',
      });
    }
  
    // onClose();
  };
  

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 animate-fade-in">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">
          {isEditMode ? 'Edit Project' : 'Create New Project'}
        </h2>

        <form onSubmit={handleSubmitForm} className="space-y-6">
          <div>
            <label className="block font-medium mb-1">Project Name <span className='text-red-500'>*</span></label>
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


          <div>
            <label className="block font-medium mb-1">Description <span className='text-red-500'>*</span></label>
           
            <CkEditor
                  value={formData.description}
                  onChange={(data) =>
                    setFormData({ ...formData, description: data })
                  }
                />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Start Date <span className='text-red-500'>*</span></label>
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
              <label className="block font-medium mb-1">Expected Completion Date <span className='text-red-500'>*</span></label>
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
            <label className="block font-medium mb-1">Phase <span className='text-red-500'>*</span></label>
            <Select
              name="phase"
              options={phaseOptions}
              value={phaseOptions.find(option => option.value === formData.phase)} 
              onChange={(selectedOption) => handleSelectChange(selectedOption, { name: 'phase' })}
              classNamePrefix="react-select"
              placeholder="Select Phase"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Status </label>
            <Select
              name="status"
              options={statusOptions}
              value={statusOptions.find(option => option.value === formData.status)}
              onChange={(selectedOption) => handleSelectChange(selectedOption, { name: 'status' })}
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

          <div>
            <label className="block font-medium mb-1">Assigned To <span className='text-red-700'>*</span></label>
            <Select
            name="assignedTo"
            options={employeeOptions}
            isMulti
            value={employeeOptions.filter(option => formData.assignedTo.includes(option.value))}
            onChange={(selectedOptions) => handleSelectChange(selectedOptions, { name: 'assignedTo' })}
            classNamePrefix="react-select"
            placeholder="Select employees"
          />
          </div>


         <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
         <div>
            <label className="block font-medium mb-1">SRS Document</label>
            <FileUpload
              isView={false}
              isCombine={false}
              accept=".pdf,.doc,.docx,.txt"
              initialFiles={formData.srsFile ? [{ file: formData.srsFile }] : []}
              onFilesSelected={(files) => {
                const file = files[0]?.file || null;
                setFormData(prev => ({ ...prev, srsFile: file }));
              }}
              onDeletedFiles={() => {
                setFormData(prev => ({ ...prev, srsFile: null }));
              }}
              onPreviewFile={(file) => console.log("Preview file:", file)}
            />
            {srsFileName && !formData.srsFile && (
              <p className="text-xs text-gray-500 mt-1">Existing file: {srsFileName}</p>
            )}
            {formData.srsFile && (
              <p className="text-xs text-gray-500 mt-1">New file selected: {formData.srsFile.name}</p>
            )}
          </div>

         <div className="flex items-center">
            <input
              type="checkbox"
              name="designAvailable"
              checked={formData.designAvailable}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="ml-2 text-sm text-gray-700">Design Available ??</label>
          
          </div>
        
          {formData.designAvailable && (
            <div>
              <label className="block font-medium mb-1">Wireframe Document</label>
              <FileUpload
                isView={false}
                isCombine={false}
                accept=".pdf,.png,.jpg,.jpeg"
                initialFiles={formData.wireframeFile ? [{ file: formData.wireframeFile }] : []}
                onFilesSelected={(files) => {
                  const file = files[0]?.file || null;
                  setFormData(prev => ({ ...prev, wireframeFile: file }));
                }}
                onDeletedFiles={() => {
                  setFormData(prev => ({ ...prev, wireframeFile: null }));
                }}
                onPreviewFile={(file) => console.log("Previewing wireframe file:", file)}
              />
              {wireframeFileName && !formData.wireframeFile && (
                <p className="text-xs text-gray-500 mt-1">Existing file: {wireframeFileName}</p>
              )}
              {formData.wireframeFile && (
                <p className="text-xs text-gray-500 mt-1">New file selected: {formData.wireframeFile.name}</p>
              )}
            </div>
          )}
         </div>
      

          <div className="sticky bottom-0 left-0 right-0 bg-white pt-4 border-t mt-6 flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-white bg-red-600  border-red-300 rounded-md hover:bg-red-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500"
            >
              {isEditMode ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectCreationModal;
