import UserProfileCard from "./UserProfileCard";

const userData = {
  fullName: "John Doe",
  role: "Software Engineer",
  company: "OpenAI Technologies",
  contactNumber: "+91-9876543210",
  companyEmail: "john.doe@openai.com",
  personalEmail: "john.doe@gmail.com",
  dateOfBirth: "1995-06-15",
  gender: "Male",
  photo: "https://randomuser.me/api/portraits/men/75.jpg", // or your image
};

export default function ProfilePage() {
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <UserProfileCard user={userData} />
    </div>
  );
}
