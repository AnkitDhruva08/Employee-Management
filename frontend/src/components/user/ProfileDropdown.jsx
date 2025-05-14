import React, { useState } from "react";
import {
  ChevronDown,
  LogOut,
  User,
  Settings,
  CreditCard,
  FileText,
  Users,
  UserPlus,
  HelpCircle,
  MessageCircle,
} from "lucide-react"; 

export default function ProfileDropdown() {
  const [open, setOpen] = useState(false);

  const toggleDropdown = () => setOpen(!open);

  return (
    <div className="relative flex justify-center items-center h-screen bg-gradient-to-r from-blue-500 to-purple-200">
      <div className="relative">
        <button
          onClick={toggleDropdown}
          className="flex items-center space-x-2 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition"
        >
          <img
            src="https://randomuser.me/api/portraits/men/75.jpg"
            alt="profile"
            className="w-10 h-10 rounded-full"
          />
          <ChevronDown className="w-5 h-5 text-gray-600" />
        </button>

        {open && (
          <div className="absolute right-0 mt-4 w-72 bg-white rounded-xl shadow-2xl z-50 p-4">
            <div className="flex items-center space-x-3 mb-4">
              <img
                src="https://randomuser.me/api/portraits/men/75.jpg"
                alt="avatar"
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="text-sm font-medium">Godzilla D. White</p>
                <p className="text-xs text-gray-500">supportingtext@gmail.com</p>
              </div>
            </div>

            <div className="divide-y divide-gray-100 text-sm">
              <div className="space-y-1 pb-3">
                <DropdownItem icon={<User />} label="View Profile" shortcut="⌘ P" />
                <DropdownItem icon={<Settings />} label="Settings" shortcut="⌘ G" active />
                <DropdownItem icon={<CreditCard />} label="Home" shortcut="⌘ B" />
              </div>

              {/* <div className="space-y-1 py-3">
                <DropdownItem icon={<FileText />} label="Changelog" shortcut="⌘ E" />
                <DropdownItem icon={<Users />} label="Team" shortcut="⌘ T" />
                <DropdownItem icon={<UserPlus />} label="Invite Member" shortcut="⌘ F" />
              </div> */}

              {/* <div className="space-y-1 py-3">
                <DropdownItem icon={<HelpCircle />} label="Support" shortcut="⌘ R" />
                <DropdownItem icon={<MessageCircle />} label="Community" shortcut="⌘ U" />
              </div> */}

              <div className="pt-3">
                <DropdownItem icon={<LogOut />} label="Sign Out" shortcut="⌘ Q" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DropdownItem({ icon, label, shortcut, active }) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer ${
        active ? "bg-indigo-100 text-indigo-700" : "hover:bg-gray-100"
      }`}
    >
      <div className="flex items-center space-x-2">
        <span className="text-gray-600">{icon}</span>
        <span>{label}</span>
      </div>
      <span className="text-xs text-gray-400">{shortcut}</span>
    </div>
  );
}
