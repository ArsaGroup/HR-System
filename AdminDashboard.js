import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Alert,
  Form,
  Button,
  ListGroup,
  Tabs,
  Tab,
  Modal,
  Spinner,
  Accordion,
} from "react-bootstrap";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { adminAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:8000/api";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Stats
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Categories
  const [skillCategories, setSkillCategories] = useState([]);
  const [projectCategories, setProjectCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [templates, setTemplates] = useState([]);

  // Forms
  const [skillCategoryForm, setSkillCategoryForm] = useState({
    name: "",
    description: "",
  });
  const [projectCategoryForm, setProjectCategoryForm] = useState({
    name: "",
    description: "",
    icon: "",
  });
  const [skillForm, setSkillForm] = useState({
    name: "",
    category_id: "",
    description: "",
  });
  const [templateForm, setTemplateForm] = useState({
    category_id: "",
    title: "",
    description: "",
    default_budget_range: "",
    estimated_duration: "",
  });

  // Assessment Builder State
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({
    skill_id: "",
    title: "",
    description: "",
    passing_score: 70,
    time_limit: 30,
    questions: [],
  });
  const [currentQuestion, setCurrentQuestion] = useState({
    question_text: "",
    question_type: "single",
    points: 1,
    explanation: "",
    options: [
      { option_text: "", is_correct: false },
      { option_text: "", is_correct: false },
      { option_text: "", is_correct: false },
      { option_text: "", is_correct: false },
    ],
  });

  // Feedback
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  // Get auth token
  const getAuthToken = () => localStorage.getItem("access_token");

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getAuthToken()}`,
  });

  useEffect(() => {
    if (user?.user_type !== "admin") {
      navigate("/dashboard");
      return;
    }
    loadAllData();
  }, [user, navigate]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadSkillCategories(),
        loadProjectCategories(),
        loadSkills(),
        loadAssessments(),
        loadTemplates(),
      ]);
    } catch (err) {
      setError("Failed to load dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats/`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  const loadSkillCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/skill-categories/`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setSkillCategories(data || []);
      }
    } catch (err) {
      console.error("Error loading skill categories:", err);
    }
  };

  const loadProjectCategories = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/project-categories/`,
        {
          headers: getAuthHeaders(),
        },
      );
      if (response.ok) {
        const data = await response.json();
        setProjectCategories(data || []);
      }
    } catch (err) {
      console.error("Error loading project categories:", err);
    }
  };

  const loadSkills = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/skills/`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setSkills(data || []);
      }
    } catch (err) {
      console.error("Error loading skills:", err);
    }
  };

  const loadAssessments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/skill-assessments/`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setAssessments(data || []);
      }
    } catch (err) {
      console.error("Error loading assessments:", err);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/project-templates/`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setTemplates(data || []);
      }
    } catch (err) {
      console.error("Error loading templates:", err);
    }
  };

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: "", message: "" }), 5000);
  };

  // Skill Category Handlers
  const handleCreateSkillCategory = async (e) => {
    e.preventDefault();
    if (!skillCategoryForm.name.trim()) {
      showFeedback("danger", "Please enter a category name");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/skill-categories/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(skillCategoryForm),
      });
      if (response.ok) {
        showFeedback("success", "Skill category created successfully!");
        setSkillCategoryForm({ name: "", description: "" });
        loadSkillCategories();
      } else {
        showFeedback("danger", "Failed to create skill category");
      }
    } catch (err) {
      showFeedback("danger", "Error creating skill category");
    } finally {
      setSubmitting(false);
    }
  };

  // Project Category Handlers
  const handleCreateProjectCategory = async (e) => {
    e.preventDefault();
    if (!projectCategoryForm.name.trim()) {
      showFeedback("danger", "Please enter a category name");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/project-categories/`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(projectCategoryForm),
        },
      );
      if (response.ok) {
        showFeedback("success", "Project category created successfully!");
        setProjectCategoryForm({ name: "", description: "", icon: "" });
        loadProjectCategories();
      } else {
        showFeedback("danger", "Failed to create project category");
      }
    } catch (err) {
      showFeedback("danger", "Error creating project category");
    } finally {
      setSubmitting(false);
    }
  };

  // Skill Handlers
  const handleCreateSkill = async (e) => {
    e.preventDefault();
    if (!skillForm.name.trim() || !skillForm.category_id) {
      showFeedback("danger", "Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/skills/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: skillForm.name,
          category_id: parseInt(skillForm.category_id),
          description: skillForm.description,
          is_verified: true,
        }),
      });
      if (response.ok) {
        showFeedback("success", "Skill created successfully!");
        setSkillForm({ name: "", category_id: "", description: "" });
        loadSkills();
      } else {
        showFeedback("danger", "Failed to create skill");
      }
    } catch (err) {
      showFeedback("danger", "Error creating skill");
    } finally {
      setSubmitting(false);
    }
  };

  // Template Handlers
  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!templateForm.category_id || !templateForm.title.trim()) {
      showFeedback("danger", "Please fill in required fields");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/project-templates/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          category_id: parseInt(templateForm.category_id),
          title: templateForm.title,
          description: templateForm.description,
          default_budget_range: templateForm.default_budget_range,
          estimated_duration: templateForm.estimated_duration,
          is_active: true,
        }),
      });
      if (response.ok) {
        showFeedback("success", "Project template created successfully!");
        setTemplateForm({
          category_id: "",
          title: "",
          description: "",
          default_budget_range: "",
          estimated_duration: "",
        });
        loadTemplates();
      } else {
        showFeedback("danger", "Failed to create template");
      }
    } catch (err) {
      showFeedback("danger", "Error creating template");
    } finally {
      setSubmitting(false);
    }
  };

  // Assessment Handlers
  const resetAssessmentForm = () => {
    setAssessmentForm({
      skill_id: "",
      title: "",
      description: "",
      passing_score: 70,
      time_limit: 30,
      questions: [],
    });
    resetCurrentQuestion();
  };

  const resetCurrentQuestion = () => {
    setCurrentQuestion({
      question_text: "",
      question_type: "single",
      points: 1,
      explanation: "",
      options: [
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
      ],
    });
  };

  const handleAddQuestion = () => {
    if (!currentQuestion.question_text.trim()) {
      showFeedback("danger", "Please enter a question");
      return;
    }

    const filledOptions = currentQuestion.options.filter((o) =>
      o.option_text.trim(),
    );
    if (filledOptions.length < 2) {
      showFeedback("danger", "Please add at least 2 options");
      return;
    }

    const hasCorrect = filledOptions.some((o) => o.is_correct);
    if (!hasCorrect) {
      showFeedback("danger", "Please mark at least one correct answer");
      return;
    }

    const newQuestion = {
      ...currentQuestion,
      options: filledOptions,
      order: assessmentForm.questions.length + 1,
    };

    setAssessmentForm((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));

    resetCurrentQuestion();
    showFeedback("success", "Question added!");
  };

  const handleRemoveQuestion = (index) => {
    setAssessmentForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleOptionChange = (index, field, value) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === index ? { ...opt, [field]: value } : opt,
      ),
    }));
  };

  const handleCorrectOptionChange = (index) => {
    if (currentQuestion.question_type === "single") {
      // For single choice, only one can be correct
      setCurrentQuestion((prev) => ({
        ...prev,
        options: prev.options.map((opt, i) => ({
          ...opt,
          is_correct: i === index,
        })),
      }));
    } else {
      // For multiple choice, toggle the option
      setCurrentQuestion((prev) => ({
        ...prev,
        options: prev.options.map((opt, i) =>
          i === index ? { ...opt, is_correct: !opt.is_correct } : opt,
        ),
      }));
    }
  };

  const handleCreateAssessment = async () => {
    if (!assessmentForm.skill_id) {
      showFeedback("danger", "Please select a skill");
      return;
    }
    if (!assessmentForm.title.trim()) {
      showFeedback("danger", "Please enter an assessment title");
      return;
    }
    if (assessmentForm.questions.length === 0) {
      showFeedback("danger", "Please add at least one question");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/skill-assessments/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          skill_id: parseInt(assessmentForm.skill_id),
          title: assessmentForm.title,
          description: assessmentForm.description,
          passing_score: assessmentForm.passing_score,
          total_questions: assessmentForm.questions.length,
          time_limit: assessmentForm.time_limit,
          is_active: true,
          questions: assessmentForm.questions,
        }),
      });

      if (response.ok) {
        showFeedback("success", "Skill assessment created successfully!");
        setShowAssessmentModal(false);
        resetAssessmentForm();
        loadAssessments();
      } else {
        const errorData = await response.json();
        showFeedback(
          "danger",
          errorData.error || "Failed to create assessment",
        );
      }
    } catch (err) {
      showFeedback("danger", "Error creating assessment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssessment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this assessment?")) {
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/skill-assessments/${id}/`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );
      if (response.ok) {
        showFeedback("success", "Assessment deleted");
        loadAssessments();
      }
    } catch (err) {
      showFeedback("danger", "Error deleting assessment");
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm("Are you sure you want to delete this template?")) {
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/project-templates/${id}/`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );
      if (response.ok) {
        showFeedback("success", "Template deleted");
        loadTemplates();
      }
    } catch (err) {
      showFeedback("danger", "Error deleting template");
    }
  };

  // Chart colors
  const CHART_COLORS = [
    "#6366f1",
    "#8b5cf6",
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ec4899",
  ];

  // Sample KPI data for charts
  const userGrowthData = [
    { name: "Jan", users: 120, providers: 45, clients: 75 },
    { name: "Feb", users: 180, providers: 68, clients: 112 },
    { name: "Mar", users: 250, providers: 95, clients: 155 },
    { name: "Apr", users: 320, providers: 125, clients: 195 },
    { name: "May", users: 410, providers: 160, clients: 250 },
    { name: "Jun", users: 520, providers: 200, clients: 320 },
  ];

  const projectStatusData = [
    { name: "Open", value: stats?.projects?.published || 35, color: "#6366f1" },
    {
      name: "In Progress",
      value: stats?.projects?.in_progress || 28,
      color: "#06b6d4",
    },
    {
      name: "Completed",
      value: stats?.projects?.completed || 67,
      color: "#10b981",
    },
    {
      name: "Cancelled",
      value: stats?.projects?.cancelled || 8,
      color: "#ef4444",
    },
  ];

  const revenueData = [
    { name: "Week 1", revenue: 2400, transactions: 24 },
    { name: "Week 2", revenue: 3200, transactions: 32 },
    { name: "Week 3", revenue: 2800, transactions: 28 },
    { name: "Week 4", revenue: 4100, transactions: 41 },
  ];

  const categoryDistribution = [
    { name: "Web Dev", projects: 45 },
    { name: "Design", projects: 32 },
    { name: "Writing", projects: 28 },
    { name: "Marketing", projects: 22 },
    { name: "Video", projects: 18 },
    { name: "Tutoring", projects: 15 },
  ];

  // Export data function
  const handleExportData = (dataType) => {
    let data;
    let filename;

    switch (dataType) {
      case "users":
        data = { stats: stats?.users, growth: userGrowthData };
        filename = "user_data.json";
        break;
      case "projects":
        data = { stats: stats?.projects, distribution: projectStatusData };
        filename = "project_data.json";
        break;
      case "all":
        data = {
          stats,
          userGrowth: userGrowthData,
          projects: projectStatusData,
          revenue: revenueData,
        };
        filename = "skillix_admin_data.json";
        break;
      default:
        data = stats;
        filename = "data.json";
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showFeedback("success", `Data exported successfully as ${filename}`);
  };

  // Send report via email (mock)
  const handleSendReport = () => {
    const email = prompt("Enter email address to send the report:");
    if (email) {
      // In production, this would call an API endpoint
      showFeedback("success", `Report sent successfully to ${email}`);
    }
  };

  if (user?.user_type !== "admin") {
    return null;
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              margin: "0 auto 24px",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "pulse 2s infinite",
            }}
          >
            <span style={{ fontSize: "2.5rem" }}>⚙️</span>
          </div>
          <Spinner animation="border" variant="primary" />
          <p style={{ marginTop: "16px", color: "#64748b" }}>
            Loading admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        paddingTop: "100px",
        paddingBottom: "40px",
      }}
    >
      <Container fluid style={{ maxWidth: "1400px" }}>
        {/* Page Header */}
        <div
          style={{
            marginBottom: "32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                color: "#1e293b",
                marginBottom: "4px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <span
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                  boxShadow: "0 8px 20px rgba(99, 102, 241, 0.3)",
                }}
              >
                ⚙️
              </span>
              Skillix Admin Dashboard
            </h2>
            <p style={{ color: "#64748b", margin: 0 }}>
              Monitor and manage your platform
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <Button
              variant="outline-primary"
              onClick={() => handleExportData("all")}
              style={{
                borderRadius: "12px",
                padding: "10px 20px",
                fontWeight: 600,
              }}
            >
              📥 Export Data
            </Button>
            <Button
              onClick={handleSendReport}
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                border: "none",
                borderRadius: "12px",
                padding: "10px 20px",
                fontWeight: 600,
              }}
            >
              📧 Send Report
            </Button>
          </div>
        </div>

        {/* Global Feedback */}
        {feedback.message && (
          <Alert
            variant={feedback.type}
            dismissible
            onClose={() => setFeedback({ type: "", message: "" })}
            style={{ borderRadius: "16px", marginBottom: "24px" }}
          >
            {feedback.message}
          </Alert>
        )}

        {error && (
          <Alert variant="danger" style={{ borderRadius: "16px" }}>
            {error}
          </Alert>
        )}

        {/* KPI Statistics Cards */}
        <Row className="mb-4 g-4">
          <Col lg={3} md={6}>
            <Card
              style={{
                borderRadius: "20px",
                border: "none",
                boxShadow: "0 10px 40px rgba(99, 102, 241, 0.15)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "6px",
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                }}
              />
              <Card.Body style={{ padding: "24px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <p
                      style={{
                        color: "#64748b",
                        fontSize: "0.875rem",
                        marginBottom: "8px",
                        fontWeight: 500,
                      }}
                    >
                      Total Users
                    </p>
                    <h3
                      style={{
                        fontSize: "2rem",
                        fontWeight: 800,
                        color: "#1e293b",
                        marginBottom: "4px",
                      }}
                    >
                      {stats?.users?.total || 0}
                    </h3>
                    <Badge
                      style={{
                        background: "rgba(16, 185, 129, 0.1)",
                        color: "#10b981",
                        padding: "4px 10px",
                        borderRadius: "50px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      +{stats?.users?.new_today || 0} today
                    </Badge>
                  </div>
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "16px",
                      background:
                        "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.5rem",
                    }}
                  >
                    👥
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6}>
            <Card
              style={{
                borderRadius: "20px",
                border: "none",
                boxShadow: "0 10px 40px rgba(16, 185, 129, 0.15)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "6px",
                  background:
                    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                }}
              />
              <Card.Body style={{ padding: "24px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <p
                      style={{
                        color: "#64748b",
                        fontSize: "0.875rem",
                        marginBottom: "8px",
                        fontWeight: 500,
                      }}
                    >
                      Total Projects
                    </p>
                    <h3
                      style={{
                        fontSize: "2rem",
                        fontWeight: 800,
                        color: "#1e293b",
                        marginBottom: "4px",
                      }}
                    >
                      {stats?.projects?.total || 0}
                    </h3>
                    <Badge
                      style={{
                        background: "rgba(6, 182, 212, 0.1)",
                        color: "#06b6d4",
                        padding: "4px 10px",
                        borderRadius: "50px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      {stats?.projects?.published || 0} published
                    </Badge>
                  </div>
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "16px",
                      background:
                        "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.5rem",
                    }}
                  >
                    📋
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6}>
            <Card
              style={{
                borderRadius: "20px",
                border: "none",
                boxShadow: "0 10px 40px rgba(6, 182, 212, 0.15)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "6px",
                  background:
                    "linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)",
                }}
              />
              <Card.Body style={{ padding: "24px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <p
                      style={{
                        color: "#64748b",
                        fontSize: "0.875rem",
                        marginBottom: "8px",
                        fontWeight: 500,
                      }}
                    >
                      Total Proposals
                    </p>
                    <h3
                      style={{
                        fontSize: "2rem",
                        fontWeight: 800,
                        color: "#1e293b",
                        marginBottom: "4px",
                      }}
                    >
                      {stats?.proposals?.total || 0}
                    </h3>
                    <Badge
                      style={{
                        background: "rgba(16, 185, 129, 0.1)",
                        color: "#10b981",
                        padding: "4px 10px",
                        borderRadius: "50px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      {stats?.proposals?.accepted || 0} accepted
                    </Badge>
                  </div>
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "16px",
                      background:
                        "linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(14, 165, 233, 0.1) 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.5rem",
                    }}
                  >
                    📝
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6}>
            <Card
              style={{
                borderRadius: "20px",
                border: "none",
                boxShadow: "0 10px 40px rgba(245, 158, 11, 0.15)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "6px",
                  background:
                    "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                }}
              />
              <Card.Body style={{ padding: "24px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <p
                      style={{
                        color: "#64748b",
                        fontSize: "0.875rem",
                        marginBottom: "8px",
                        fontWeight: 500,
                      }}
                    >
                      Assessments
                    </p>
                    <h3
                      style={{
                        fontSize: "2rem",
                        fontWeight: 800,
                        color: "#1e293b",
                        marginBottom: "4px",
                      }}
                    >
                      {stats?.skills?.total_assessments || 0}
                    </h3>
                    <Badge
                      style={{
                        background: "rgba(139, 92, 246, 0.1)",
                        color: "#8b5cf6",
                        padding: "4px 10px",
                        borderRadius: "50px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      {stats?.skills?.certified_users || 0} certified
                    </Badge>
                  </div>
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "16px",
                      background:
                        "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.5rem",
                    }}
                  >
                    🏆
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* KPI Charts Row */}
        <Row className="mb-4 g-4">
          <Col lg={8}>
            <Card
              style={{
                borderRadius: "20px",
                border: "none",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
              }}
            >
              <Card.Header
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "24px 24px 0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h5
                    style={{
                      fontWeight: 700,
                      color: "#1e293b",
                      marginBottom: "4px",
                    }}
                  >
                    User Growth Analytics
                  </h5>
                  <p
                    style={{
                      color: "#64748b",
                      fontSize: "0.875rem",
                      margin: 0,
                    }}
                  >
                    Monthly user registration trends
                  </p>
                </div>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => handleExportData("users")}
                  style={{ borderRadius: "8px" }}
                >
                  📥 Export
                </Button>
              </Card.Header>
              <Card.Body style={{ padding: "24px" }}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={userGrowthData}>
                    <defs>
                      <linearGradient
                        id="colorUsers"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#6366f1"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#6366f1"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorProviders"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="#6366f1"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorUsers)"
                      name="Total Users"
                    />
                    <Area
                      type="monotone"
                      dataKey="providers"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorProviders)"
                      name="Providers"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4}>
            <Card
              style={{
                borderRadius: "20px",
                border: "none",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
                height: "100%",
              }}
            >
              <Card.Header
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "24px 24px 0",
                }}
              >
                <h5
                  style={{
                    fontWeight: 700,
                    color: "#1e293b",
                    marginBottom: "4px",
                  }}
                >
                  Project Status
                </h5>
                <p
                  style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}
                >
                  Current distribution
                </p>
              </Card.Header>
              <Card.Body
                style={{
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "12px",
                    justifyContent: "center",
                    marginTop: "16px",
                  }}
                >
                  {projectStatusData.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <div
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: item.color,
                        }}
                      />
                      <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                        {item.name}: {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Second Charts Row */}
        <Row className="mb-4 g-4">
          <Col lg={6}>
            <Card
              style={{
                borderRadius: "20px",
                border: "none",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
              }}
            >
              <Card.Header
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "24px 24px 0",
                }}
              >
                <h5
                  style={{
                    fontWeight: 700,
                    color: "#1e293b",
                    marginBottom: "4px",
                  }}
                >
                  Revenue Overview
                </h5>
                <p
                  style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}
                >
                  Weekly platform revenue
                </p>
              </Card.Header>
              <Card.Body style={{ padding: "24px" }}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                      }}
                      formatter={(value) => [`$${value}`, "Revenue"]}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#6366f1"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={6}>
            <Card
              style={{
                borderRadius: "20px",
                border: "none",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
              }}
            >
              <Card.Header
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "24px 24px 0",
                }}
              >
                <h5
                  style={{
                    fontWeight: 700,
                    color: "#1e293b",
                    marginBottom: "4px",
                  }}
                >
                  Projects by Category
                </h5>
                <p
                  style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}
                >
                  Distribution across categories
                </p>
              </Card.Header>
              <Card.Body style={{ padding: "24px" }}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={categoryDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#64748b" fontSize={12} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#64748b"
                      fontSize={12}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Bar dataKey="projects" radius={[0, 8, 8, 0]}>
                      {categoryDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Management Tabs */}
        <Card
          style={{
            borderRadius: "20px",
            border: "none",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
          }}
        >
          <Card.Body style={{ padding: "24px" }}>
            <Tabs defaultActiveKey="categories" className="mb-4">
              {/* Categories Tab */}
              <Tab eventKey="categories" title="📁 Categories">
                <Row className="mt-3">
                  <Col lg={6} className="mb-4">
                    <Card>
                      <Card.Header className="bg-primary text-white">
                        <h5 className="mb-0">Skill Categories</h5>
                      </Card.Header>
                      <Card.Body>
                        <Form onSubmit={handleCreateSkillCategory}>
                          <Form.Group className="mb-3">
                            <Form.Label>Category Name *</Form.Label>
                            <Form.Control
                              value={skillCategoryForm.name}
                              onChange={(e) =>
                                setSkillCategoryForm({
                                  ...skillCategoryForm,
                                  name: e.target.value,
                                })
                              }
                              placeholder="e.g., Web Development"
                            />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={2}
                              value={skillCategoryForm.description}
                              onChange={(e) =>
                                setSkillCategoryForm({
                                  ...skillCategoryForm,
                                  description: e.target.value,
                                })
                              }
                            />
                          </Form.Group>
                          <Button type="submit" disabled={submitting}>
                            {submitting
                              ? "Creating..."
                              : "Create Skill Category"}
                          </Button>
                        </Form>

                        <hr />
                        <h6>Existing Categories ({skillCategories.length})</h6>
                        <ListGroup
                          variant="flush"
                          style={{ maxHeight: "200px", overflowY: "auto" }}
                        >
                          {skillCategories.length === 0 ? (
                            <ListGroup.Item className="text-muted">
                              No categories yet
                            </ListGroup.Item>
                          ) : (
                            skillCategories.map((cat) => (
                              <ListGroup.Item key={cat.id}>
                                <strong>{cat.name}</strong>
                                {cat.description && (
                                  <small className="text-muted d-block">
                                    {cat.description}
                                  </small>
                                )}
                              </ListGroup.Item>
                            ))
                          )}
                        </ListGroup>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col lg={6} className="mb-4">
                    <Card>
                      <Card.Header className="bg-success text-white">
                        <h5 className="mb-0">Project Categories</h5>
                      </Card.Header>
                      <Card.Body>
                        <Form onSubmit={handleCreateProjectCategory}>
                          <Form.Group className="mb-3">
                            <Form.Label>Category Name *</Form.Label>
                            <Form.Control
                              value={projectCategoryForm.name}
                              onChange={(e) =>
                                setProjectCategoryForm({
                                  ...projectCategoryForm,
                                  name: e.target.value,
                                })
                              }
                              placeholder="e.g., Marketing"
                            />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={2}
                              value={projectCategoryForm.description}
                              onChange={(e) =>
                                setProjectCategoryForm({
                                  ...projectCategoryForm,
                                  description: e.target.value,
                                })
                              }
                            />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label>Icon (emoji)</Form.Label>
                            <Form.Control
                              value={projectCategoryForm.icon}
                              onChange={(e) =>
                                setProjectCategoryForm({
                                  ...projectCategoryForm,
                                  icon: e.target.value,
                                })
                              }
                              placeholder="e.g., 📱"
                            />
                          </Form.Group>
                          <Button
                            type="submit"
                            variant="success"
                            disabled={submitting}
                          >
                            {submitting
                              ? "Creating..."
                              : "Create Project Category"}
                          </Button>
                        </Form>

                        <hr />
                        <h6>
                          Existing Categories ({projectCategories.length})
                        </h6>
                        <ListGroup
                          variant="flush"
                          style={{ maxHeight: "200px", overflowY: "auto" }}
                        >
                          {projectCategories.length === 0 ? (
                            <ListGroup.Item className="text-muted">
                              No categories yet
                            </ListGroup.Item>
                          ) : (
                            projectCategories.map((cat) => (
                              <ListGroup.Item key={cat.id}>
                                <strong>
                                  {cat.icon} {cat.name}
                                </strong>
                                {cat.description && (
                                  <small className="text-muted d-block">
                                    {cat.description}
                                  </small>
                                )}
                              </ListGroup.Item>
                            ))
                          )}
                        </ListGroup>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab>

              {/* Skills Tab */}
              <Tab eventKey="skills" title="🎯 Skills">
                <Row className="mt-3">
                  <Col lg={6} className="mb-4">
                    <Card>
                      <Card.Header className="bg-info text-white">
                        <h5 className="mb-0">Create New Skill</h5>
                      </Card.Header>
                      <Card.Body>
                        <Form onSubmit={handleCreateSkill}>
                          <Form.Group className="mb-3">
                            <Form.Label>Skill Category *</Form.Label>
                            <Form.Select
                              value={skillForm.category_id}
                              onChange={(e) =>
                                setSkillForm({
                                  ...skillForm,
                                  category_id: e.target.value,
                                })
                              }
                              required
                            >
                              <option value="">Select category</option>
                              {skillCategories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label>Skill Name *</Form.Label>
                            <Form.Control
                              value={skillForm.name}
                              onChange={(e) =>
                                setSkillForm({
                                  ...skillForm,
                                  name: e.target.value,
                                })
                              }
                              placeholder="e.g., React Development"
                              required
                            />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={2}
                              value={skillForm.description}
                              onChange={(e) =>
                                setSkillForm({
                                  ...skillForm,
                                  description: e.target.value,
                                })
                              }
                            />
                          </Form.Group>
                          <Button
                            type="submit"
                            variant="info"
                            disabled={submitting}
                          >
                            {submitting ? "Creating..." : "Create Skill"}
                          </Button>
                        </Form>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col lg={6} className="mb-4">
                    <Card>
                      <Card.Header>
                        <h5 className="mb-0">
                          Existing Skills ({skills.length})
                        </h5>
                      </Card.Header>
                      <Card.Body
                        style={{ maxHeight: "400px", overflowY: "auto" }}
                      >
                        {skills.length === 0 ? (
                          <p className="text-muted">No skills created yet</p>
                        ) : (
                          <ListGroup variant="flush">
                            {skills.map((skill) => (
                              <ListGroup.Item
                                key={skill.id}
                                className="d-flex justify-content-between align-items-center"
                              >
                                <div>
                                  <strong>{skill.name}</strong>
                                  <Badge bg="secondary" className="ms-2">
                                    {skill.category_name ||
                                      skill.category?.name}
                                  </Badge>
                                  {skill.description && (
                                    <small className="text-muted d-block">
                                      {skill.description}
                                    </small>
                                  )}
                                </div>
                              </ListGroup.Item>
                            ))}
                          </ListGroup>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab>

              {/* Assessments Tab */}
              <Tab eventKey="assessments" title="📝 Skill Assessments">
                <Row className="mt-3">
                  <Col lg={12} className="mb-4">
                    <Card>
                      <Card.Header className="bg-warning">
                        <div className="d-flex justify-content-between align-items-center">
                          <h5 className="mb-0">🧪 Skill Assessments</h5>
                          <Button
                            variant="dark"
                            onClick={() => {
                              resetAssessmentForm();
                              setShowAssessmentModal(true);
                            }}
                          >
                            + Create New Assessment
                          </Button>
                        </div>
                      </Card.Header>
                      <Card.Body>
                        {assessments.length === 0 ? (
                          <div className="text-center py-5">
                            <h4>📋 No Assessments Yet</h4>
                            <p className="text-muted">
                              Create your first skill assessment to help
                              providers get certified.
                            </p>
                            <Button
                              variant="primary"
                              onClick={() => {
                                resetAssessmentForm();
                                setShowAssessmentModal(true);
                              }}
                            >
                              Create Assessment
                            </Button>
                          </div>
                        ) : (
                          <Table responsive striped hover>
                            <thead>
                              <tr>
                                <th>Title</th>
                                <th>Skill</th>
                                <th>Questions</th>
                                <th>Passing Score</th>
                                <th>Time Limit</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {assessments.map((assessment) => (
                                <tr key={assessment.id}>
                                  <td>
                                    <strong>{assessment.title}</strong>
                                  </td>
                                  <td>{assessment.skill?.name || "N/A"}</td>
                                  <td>
                                    {assessment.total_questions ||
                                      assessment.questions?.length ||
                                      0}
                                  </td>
                                  <td>{assessment.passing_score}%</td>
                                  <td>{assessment.time_limit} mins</td>
                                  <td>
                                    <Badge
                                      bg={
                                        assessment.is_active
                                          ? "success"
                                          : "secondary"
                                      }
                                    >
                                      {assessment.is_active
                                        ? "Active"
                                        : "Inactive"}
                                    </Badge>
                                  </td>
                                  <td>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() =>
                                        handleDeleteAssessment(assessment.id)
                                      }
                                    >
                                      Delete
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab>

              {/* Templates Tab */}
              <Tab eventKey="templates" title="📄 Project Templates">
                <Row className="mt-3">
                  <Col lg={6} className="mb-4">
                    <Card>
                      <Card.Header
                        className="bg-purple text-white"
                        style={{ backgroundColor: "#6f42c1" }}
                      >
                        <h5 className="mb-0">Create Project Template</h5>
                      </Card.Header>
                      <Card.Body>
                        <p className="text-muted small">
                          Templates help requesters quickly create projects with
                          pre-filled information.
                        </p>
                        <Form onSubmit={handleCreateTemplate}>
                          <Form.Group className="mb-3">
                            <Form.Label>Project Category *</Form.Label>
                            <Form.Select
                              value={templateForm.category_id}
                              onChange={(e) =>
                                setTemplateForm({
                                  ...templateForm,
                                  category_id: e.target.value,
                                })
                              }
                              required
                            >
                              <option value="">Select category</option>
                              {projectCategories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label>Template Title *</Form.Label>
                            <Form.Control
                              value={templateForm.title}
                              onChange={(e) =>
                                setTemplateForm({
                                  ...templateForm,
                                  title: e.target.value,
                                })
                              }
                              placeholder="e.g., Social Media Marketing Campaign"
                              required
                            />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label>Description *</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={3}
                              value={templateForm.description}
                              onChange={(e) =>
                                setTemplateForm({
                                  ...templateForm,
                                  description: e.target.value,
                                })
                              }
                              placeholder="Describe what this template is for..."
                              required
                            />
                          </Form.Group>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Default Budget Range</Form.Label>
                                <Form.Control
                                  value={templateForm.default_budget_range}
                                  onChange={(e) =>
                                    setTemplateForm({
                                      ...templateForm,
                                      default_budget_range: e.target.value,
                                    })
                                  }
                                  placeholder="e.g., $100 - $500"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Estimated Duration</Form.Label>
                                <Form.Control
                                  value={templateForm.estimated_duration}
                                  onChange={(e) =>
                                    setTemplateForm({
                                      ...templateForm,
                                      estimated_duration: e.target.value,
                                    })
                                  }
                                  placeholder="e.g., 2 weeks"
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                          <Button
                            type="submit"
                            style={{
                              backgroundColor: "#6f42c1",
                              borderColor: "#6f42c1",
                            }}
                            disabled={submitting}
                          >
                            {submitting ? "Creating..." : "Create Template"}
                          </Button>
                        </Form>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col lg={6} className="mb-4">
                    <Card>
                      <Card.Header>
                        <h5 className="mb-0">
                          Existing Templates ({templates.length})
                        </h5>
                      </Card.Header>
                      <Card.Body
                        style={{ maxHeight: "500px", overflowY: "auto" }}
                      >
                        {templates.length === 0 ? (
                          <p className="text-muted">
                            No templates created yet. Create your first template
                            to help requesters get started quickly.
                          </p>
                        ) : (
                          <ListGroup variant="flush">
                            {templates.map((template) => (
                              <ListGroup.Item
                                key={template.id}
                                className="d-flex justify-content-between align-items-start"
                              >
                                <div className="flex-grow-1">
                                  <strong>{template.title}</strong>
                                  <Badge bg="info" className="ms-2">
                                    {template.category?.name}
                                  </Badge>
                                  <Badge
                                    bg={
                                      template.is_active
                                        ? "success"
                                        : "secondary"
                                    }
                                    className="ms-1"
                                  >
                                    {template.is_active ? "Active" : "Inactive"}
                                  </Badge>
                                  <p className="text-muted small mb-1 mt-1">
                                    {template.description?.substring(0, 100)}...
                                  </p>
                                  {template.default_budget_range && (
                                    <small className="text-muted">
                                      Budget: {template.default_budget_range}
                                    </small>
                                  )}
                                </div>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() =>
                                    handleDeleteTemplate(template.id)
                                  }
                                >
                                  Delete
                                </Button>
                              </ListGroup.Item>
                            ))}
                          </ListGroup>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab>
            </Tabs>

            {/* Assessment Creation Modal */}
            <Modal
              show={showAssessmentModal}
              onHide={() => setShowAssessmentModal(false)}
              size="xl"
            >
              <Modal.Header closeButton className="bg-warning">
                <Modal.Title>🧪 Create Skill Assessment</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Row>
                  <Col md={6}>
                    <h5>Assessment Details</h5>
                    <Form.Group className="mb-3">
                      <Form.Label>Select Skill *</Form.Label>
                      <Form.Select
                        value={assessmentForm.skill_id}
                        onChange={(e) =>
                          setAssessmentForm({
                            ...assessmentForm,
                            skill_id: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="">Choose a skill</option>
                        {skills.map((skill) => (
                          <option key={skill.id} value={skill.id}>
                            {skill.name} (
                            {skill.category_name ||
                              skill.category?.name ||
                              "Uncategorized"}
                            )
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Assessment Title *</Form.Label>
                      <Form.Control
                        value={assessmentForm.title}
                        onChange={(e) =>
                          setAssessmentForm({
                            ...assessmentForm,
                            title: e.target.value,
                          })
                        }
                        placeholder="e.g., React Development Assessment"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={assessmentForm.description}
                        onChange={(e) =>
                          setAssessmentForm({
                            ...assessmentForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Describe what this assessment covers..."
                      />
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Passing Score (%)</Form.Label>
                          <Form.Control
                            type="number"
                            min="1"
                            max="100"
                            value={assessmentForm.passing_score}
                            onChange={(e) =>
                              setAssessmentForm({
                                ...assessmentForm,
                                passing_score: parseInt(e.target.value),
                              })
                            }
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Time Limit (minutes)</Form.Label>
                          <Form.Control
                            type="number"
                            min="1"
                            value={assessmentForm.time_limit}
                            onChange={(e) =>
                              setAssessmentForm({
                                ...assessmentForm,
                                time_limit: parseInt(e.target.value),
                              })
                            }
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <hr />
                    <h5>Add Question</h5>
                    <Form.Group className="mb-3">
                      <Form.Label>Question Text *</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={currentQuestion.question_text}
                        onChange={(e) =>
                          setCurrentQuestion({
                            ...currentQuestion,
                            question_text: e.target.value,
                          })
                        }
                        placeholder="Enter your question here..."
                      />
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Question Type</Form.Label>
                          <Form.Select
                            value={currentQuestion.question_type}
                            onChange={(e) =>
                              setCurrentQuestion({
                                ...currentQuestion,
                                question_type: e.target.value,
                              })
                            }
                          >
                            <option value="single">Single Choice</option>
                            <option value="multiple">Multiple Choice</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Points</Form.Label>
                          <Form.Control
                            type="number"
                            min="1"
                            value={currentQuestion.points}
                            onChange={(e) =>
                              setCurrentQuestion({
                                ...currentQuestion,
                                points: parseInt(e.target.value),
                              })
                            }
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <h6>Answer Options (mark correct answers)</h6>
                    {currentQuestion.options.map((option, index) => (
                      <div
                        key={index}
                        className="d-flex align-items-center mb-2"
                      >
                        <Form.Check
                          type={
                            currentQuestion.question_type === "single"
                              ? "radio"
                              : "checkbox"
                          }
                          name="correct_option"
                          checked={option.is_correct}
                          onChange={() => handleCorrectOptionChange(index)}
                          className="me-2"
                        />
                        <Form.Control
                          size="sm"
                          value={option.option_text}
                          onChange={(e) =>
                            handleOptionChange(
                              index,
                              "option_text",
                              e.target.value,
                            )
                          }
                          placeholder={`Option ${index + 1}`}
                        />
                      </div>
                    ))}

                    <Form.Group className="mb-3">
                      <Form.Label>Explanation (shown after answer)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={currentQuestion.explanation}
                        onChange={(e) =>
                          setCurrentQuestion({
                            ...currentQuestion,
                            explanation: e.target.value,
                          })
                        }
                        placeholder="Explain why the correct answer is right..."
                      />
                    </Form.Group>

                    <Button
                      variant="outline-primary"
                      onClick={handleAddQuestion}
                    >
                      + Add This Question
                    </Button>
                  </Col>

                  <Col md={6}>
                    <h5>Questions Added ({assessmentForm.questions.length})</h5>
                    {assessmentForm.questions.length === 0 ? (
                      <Alert variant="info">
                        No questions added yet. Add questions using the form on
                        the left.
                      </Alert>
                    ) : (
                      <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                        <Accordion>
                          {assessmentForm.questions.map((q, index) => (
                            <Accordion.Item
                              key={index}
                              eventKey={index.toString()}
                            >
                              <Accordion.Header>
                                <span className="me-2">Q{index + 1}.</span>
                                {q.question_text.substring(0, 50)}...
                                <Badge bg="primary" className="ms-2">
                                  {q.points} pts
                                </Badge>
                              </Accordion.Header>
                              <Accordion.Body>
                                <p>
                                  <strong>Question:</strong> {q.question_text}
                                </p>
                                <p>
                                  <strong>Type:</strong>{" "}
                                  {q.question_type === "single"
                                    ? "Single Choice"
                                    : "Multiple Choice"}
                                </p>
                                <p>
                                  <strong>Options:</strong>
                                </p>
                                <ul>
                                  {q.options.map((opt, optIdx) => (
                                    <li
                                      key={optIdx}
                                      className={
                                        opt.is_correct
                                          ? "text-success fw-bold"
                                          : ""
                                      }
                                    >
                                      {opt.option_text} {opt.is_correct && "✓"}
                                    </li>
                                  ))}
                                </ul>
                                {q.explanation && (
                                  <p>
                                    <strong>Explanation:</strong>{" "}
                                    {q.explanation}
                                  </p>
                                )}
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleRemoveQuestion(index)}
                                >
                                  Remove Question
                                </Button>
                              </Accordion.Body>
                            </Accordion.Item>
                          ))}
                        </Accordion>
                      </div>
                    )}
                  </Col>
                </Row>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="secondary"
                  onClick={() => setShowAssessmentModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="success"
                  onClick={handleCreateAssessment}
                  disabled={
                    submitting ||
                    !assessmentForm.skill_id ||
                    !assessmentForm.title ||
                    assessmentForm.questions.length === 0
                  }
                >
                  {submitting
                    ? "Creating..."
                    : `Create Assessment (${assessmentForm.questions.length} questions)`}
                </Button>
              </Modal.Footer>
            </Modal>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default AdminDashboard;
