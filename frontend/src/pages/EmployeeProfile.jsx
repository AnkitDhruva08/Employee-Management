import React, { useState } from 'react';

const detailData = [
  {
    id: 'bankDetails',
    title: 'Bank Details',
    content: (
      <>
        <p><strong>Bank:</strong> National Bank</p>
        <p><strong>Account Number:</strong> 1234 5678 9012 3456</p>
        <p><strong>IFSC Code:</strong> NB00012345</p>
      </>
    )
  },
  {
    id: 'nomineeDetails',
    title: 'Nominee Details',
    content: (
      <>
        <p><strong>Name:</strong> Jane Doe</p>
        <p><strong>Relationship:</strong> Spouse</p>
        <p><strong>Contact:</strong> +1 234 567 8901</p>
      </>
    )
  },
  {
    id: 'documentsDetails',
    title: 'Documents',
    content: (
      <ul className="list-disc list-inside space-y-1">
        <li>Passport - Verified</li>
        <li>Driving License - Verified</li>
        <li>Employee ID - 945827</li>
      </ul>
    )
  },
  {
    id: 'emergencyContactDetails',
    title: 'Emergency Contact',
    content: (
      <>
        <p><strong>Name:</strong> Mark Smith</p>
        <p><strong>Relationship:</strong> Brother</p>
        <p><strong>Phone:</strong> +1 987 654 3210</p>
      </>
    )
  },
  {
    id: 'officeDetails',
    title: 'Office Details',
    content: (
      <>
        <p><strong>Office Location:</strong> New York HQ</p>
        <p><strong>Department:</strong> Engineering</p>
        <p><strong>Extension:</strong> 4521</p>
      </>
    )
  }
];

export default function Profile() {
  const [openSection, setOpenSection] = useState(null);

  function toggleSection(id) {
    setOpenSection(prev => (prev === id ? null : id));
  }

  return (
    <main className="max-w-xs mx-auto h-[600px] w-full bg-white rounded-xl shadow-lg flex flex-col select-none overflow-hidden">
      <header className="text-center p-6 border-b border-gray-200">
        <img
          src="https://randomuser.me/api/portraits/men/75.jpg"
          alt="User profile"
          className="w-20 h-20 rounded-full mx-auto border-4 border-indigo-600 object-cover"
        />
        <h1 className="mt-3 text-2xl font-semibold text-gray-900">John Doe</h1>
        <p className="mt-1 text-gray-500 text-sm">Senior Software Engineer</p>
      </header>

      <section
        aria-label="User detail sections"
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {detailData.map(({ id, title, content }) => {
          const isOpen = openSection === id;
          return (
            <article key={id} className="rounded-lg overflow-hidden shadow-sm">
              <button
                onClick={() => toggleSection(id)}
                aria-expanded={isOpen}
                aria-controls={id + 'Content'}
                className={`w-full flex justify-between items-center px-5 py-4 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow ${
                  isOpen ? 'shadow-lg' : 'shadow-sm'
                } rounded-lg`}
              >
                <span className="text-indigo-700 text-lg font-semibold">{title}</span>
                <svg
                  className={`w-5 h-5 text-indigo-700 transform transition-transform duration-300 ${
                    isOpen ? 'rotate-90' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {isOpen && (
                <div
                  id={id + 'Content'}
                  className="bg-indigo-100 px-5 py-4 text-indigo-900 text-sm space-y-1"
                >
                  {content}
                </div>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}

