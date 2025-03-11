import React, { useState, useEffect } from "react";
import { Github, Mail, Bell, Check, Users, X, AlertCircle, ChevronDown, ExternalLink, UserPlus, ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";
import supabase from "../lib/supabase";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const ManageTeam = () => {
    const { ideaId } = useParams();
    const navigate = useNavigate();
    const [idea, setIdea] = useState(null);
    const [loading, setLoading] = useState(true);
    const [teamMembers, setTeamMembers] = useState([
        { id: 1, full_name: "Jane Smith", email: "jane@example.com", role: "Frontend Developer" },
        { id: 2, full_name: "John Doe", email: "john@example.com", role: "Backend Developer" },
        { id: 3, full_name: "Alex Johnson", email: "alex@example.com", role: "UI/UX Designer" }
    ]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [githubRepo, setGithubRepo] = useState("");
    const [notificationText, setNotificationText] = useState("Welcome to the team! We're excited to have you join us on this project.");
    const [connectingRepo, setConnectingRepo] = useState(false);
    const [sendingNotification, setSendingNotification] = useState(false);
    const [notificationTemplates, setNotificationTemplates] = useState([
        "Welcome to the team! We're excited to have you join us on this project.",
        "Important update: We've scheduled a team meeting for this project next week.",
        "Reminder: Please update your progress on your assigned tasks.",
        "The project deadline has been extended by one week.",
        "The requirements for this project have been updated. Please review them."
    ]);
    const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

    useEffect(() => {
        fetchSession();
    }, []);

    async function fetchSession() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/');
                return;
            }
            
            await fetchIdeaDetails(session);
            // Fetch team members would go here in a real implementation
            setLoading(false);
        } catch (error) {
            console.error("Error fetching session:", error);
            toast.error("Failed to load data");
            setLoading(false);
        }
    }

    async function fetchIdeaDetails(session) {
        try {
            const response = await axios.get(`http://localhost:5000/api/idea/${ideaId}`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (response.data.success) {
                setIdea(response.data.data);
                // In a real implementation, you would update the GitHub repo here
                // setGithubRepo(response.data.data.github_repo || "");
            }
        } catch (error) {
            console.error("Error fetching idea details:", error);
            toast.error("Failed to fetch idea details");
            // For demo purposes, set a mock idea
            setIdea({
                title: "Sample Project Idea",
                github_repo: ""
            });
        }
    }

    const handleConnectGithub = () => {
        if (!githubRepo) {
            toast.error("Please enter a GitHub repository URL");
            return;
        }

        if (!githubRepo.includes("github.com")) {
            toast.error("Please enter a valid GitHub repository URL");
            return;
        }

        setConnectingRepo(true);
        // Simulate API call
        setTimeout(() => {
            setConnectingRepo(false);
            toast.success("GitHub repository connected successfully");
        }, 1500);
    };

    const handleMemberSelection = (memberId) => {
        if (selectedMembers.includes(memberId)) {
            setSelectedMembers(selectedMembers.filter(id => id !== memberId));
        } else {
            setSelectedMembers([...selectedMembers, memberId]);
        }
    };

    const handleSendNotification = () => {
        if (selectedMembers.length === 0) {
            toast.error("Please select at least one team member");
            return;
        }

        if (!notificationText.trim()) {
            toast.error("Please enter a notification message");
            return;
        }

        setSendingNotification(true);
        // Simulate API call
        setTimeout(() => {
            setSendingNotification(false);
            toast.success("Notification sent successfully to selected team members");
            setSelectedMembers([]);
        }, 1500);
    };

    const selectNotificationTemplate = (template) => {
        setNotificationText(template);
        setShowTemplateDropdown(false);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-8xl mx-auto p-6">
            <div className="mb-6 flex items-center">
                <button 
                    onClick={() => navigate(`/details/${ideaId}`)}
                    className="text-primary hover:text-primary/80 flex items-center gap-1"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Idea Details
                </button>
            </div>

            <h1 className="text-2xl font-bold mb-8">
                Manage Team & Project {idea && `: ${idea.title}`}
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                {/* Left Column */}
                <div className="col-span-12 lg:col-span-3">
                    {/* GitHub Repository Connection */}
                    <div className="bg-card text-card-foreground p-6 rounded-lg shadow-md dark:shadow-primary/10 border border-border">
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                            <Github className="w-5 h-5 mr-2" /> Connect GitHub Repository
                        </h2>
                        <div className="mb-4">
                            <p className="text-sm text-muted-foreground mb-3">
                                Link your GitHub repository to this project for better collaboration and tracking.
                            </p>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="https://github.com/username/repo"
                                    value={githubRepo}
                                    onChange={(e) => setGithubRepo(e.target.value)}
                                    className="flex-grow px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <button
                                    onClick={handleConnectGithub}
                                    disabled={connectingRepo}
                                    className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {connectingRepo ? (
                                        <>
                                            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                            Connecting...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" /> Connect
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                        {githubRepo && (
                            <div className="bg-primary/10 p-3 rounded-md flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Connected Repository:</p>
                                    <p className="text-sm text-muted-foreground truncate max-w-xs">{githubRepo}</p>
                                </div>
                                <a 
                                    href={githubRepo} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-primary hover:text-primary/80 p-1"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Team Management Stats */}
                    <div className="bg-card text-card-foreground p-6 rounded-lg shadow-md dark:shadow-primary/10 border border-border mt-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                            <Users className="w-5 h-5 mr-2" /> Team Overview
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-primary/10 p-4 rounded-md">
                                <p className="text-sm text-muted-foreground">Team Members</p>
                                <p className="text-2xl font-bold">{teamMembers.length}</p>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-md">
                                <p className="text-sm text-muted-foreground">Tasks</p>
                                <p className="text-2xl font-bold">14</p>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-md">
                                <p className="text-sm text-muted-foreground">Completed</p>
                                <p className="text-2xl font-bold">8</p>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-md">
                                <p className="text-sm text-muted-foreground">In Progress</p>
                                <p className="text-2xl font-bold">6</p>
                            </div>
                        </div>
                        <button className="mt-4 w-full flex items-center justify-center px-3 py-2 text-sm bg-primary/10 text-primary hover:bg-primary/20 rounded-md">
                            <UserPlus className="w-4 h-4 mr-2" /> Invite New Members
                        </button>
                    </div>
                </div>

                {/* Center Column - Notifications */}
                <div className="col-span-12 lg:col-span-6">
                    {/* Send Notification */}
                    <div className="bg-card text-card-foreground p-6 rounded-lg shadow-md dark:shadow-primary/10 border border-border">
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                            <Bell className="w-5 h-5 mr-2" /> Send Notification
                        </h2>
                        <p className="text-sm text-muted-foreground mb-4">Welcome to the team management page!</p>
                        <div className="mb-4">
                            <div className="flex justify-between mb-2">
                                <label className="block text-sm font-medium">Notification Message</label>
                                <div className="relative">
                                    <button 
                                        onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                                        className="text-sm text-primary flex items-center"
                                    >
                                        Templates <ChevronDown className="w-3 h-3 ml-1" />
                                    </button>
                                    {showTemplateDropdown && (
                                        <div className="absolute right-0 top-6 z-10 w-80 bg-card border border-border rounded-md shadow-lg p-2">
                                            <div className="max-h-60 overflow-y-auto">
                                                {notificationTemplates.map((template, index) => (
                                                    <button 
                                                        key={index}
                                                        onClick={() => selectNotificationTemplate(template)}
                                                        className="w-full text-left p-2 text-sm hover:bg-muted/50 rounded-md"
                                                    >
                                                        {template}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <textarea
                                value={notificationText}
                                onChange={(e) => setNotificationText(e.target.value)}
                                placeholder="Enter your message here..."
                                rows={4}
                                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            />
                        </div>
                        
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-muted-foreground">
                                {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
                            </p>
                            <button
                                onClick={handleSendNotification}
                                disabled={sendingNotification || selectedMembers.length === 0}
                                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {sendingNotification ? (
                                    <>
                                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="w-4 h-4" /> Send Notification
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column - Team Members List */}
                <div className="col-span-12 lg:col-span-3">
                    <div className="bg-card text-card-foreground p-6 rounded-lg shadow-md dark:shadow-primary/10 border border-border mb-8">
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                            <Users className="w-5 h-5 mr-2" /> Team Members
                        </h2>
                        
                        {teamMembers.length > 0 ? (
                            <div className="space-y-2">
                                <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-2 bg-muted/30 rounded-md text-sm font-medium">
                                    <div>Select</div>
                                    <div>Name</div>
                                    <div>Role</div>
                                    <div>Actions</div>
                                </div>
                                {teamMembers.map(member => (
                                    <div key={member.id} className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 items-center p-4 hover:bg-muted/50 rounded-md transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={selectedMembers.includes(member.id)}
                                            onChange={() => handleMemberSelection(member.id)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <div>
                                            <p className="font-medium">{member.full_name}</p>
                                            <p className="text-sm text-muted-foreground">{member.email}</p>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {member.role}
                                        </div>
                                        <button className="p-1 text-muted-foreground hover:text-foreground">
                                            <Mail className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-muted-foreground">
                                <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                                <p>No team members found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageTeam;
