import { useState } from 'react';

const EditProfileForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    contact: '',
    email: '',
    githubUrl: '',
    portfolioUrl: '',
    resumeUrl: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
      <div className="space-y-6 p-2 mt-2">
        <div className="space-y-2">
          <h2 className="text-center text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Edit Profile
          </h2>
          <p className="text-center text-gray-800 text-sm ">Update your profile information</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="group">
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                className="block w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
              />
            </div>

            <div className="group">
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
                Contact
              </label>
              <input
                id="contact"
                name="contact"
                type="tel"
                required
                className="block w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={formData.contact}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="group">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="block w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
              />
            </div>

            <div className="group">
              <label htmlFor="githubUrl" className="block text-sm font-medium text-gray-700 mb-1">
                GitHub URL
              </label>
              <input
                id="githubUrl"
                name="githubUrl"
                type="url"
                className="block w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={formData.githubUrl}
                onChange={handleChange}
                placeholder="https://github.com/username"
              />
            </div>

            <div className="group">
              <label htmlFor="portfolioUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Portfolio URL
              </label>
              <input
                id="portfolioUrl"
                name="portfolioUrl"
                type="url"
                className="block w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={formData.portfolioUrl}
                onChange={handleChange}
                placeholder="https://portfolio.com"
              />
            </div>

            <div className="group">
              <label htmlFor="resumeUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Resume URL
              </label>
              <input
                id="resumeUrl"
                name="resumeUrl"
                type="url"
                className="block w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={formData.resumeUrl}
                onChange={handleChange}
                placeholder="https://resume.com"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
  );
};

export default EditProfileForm;