import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Badge,
  Spinner,
  Modal,
  ProgressBar,
  Alert,
  Tab,
  Nav,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { userAPI, skillsAPI, aiAPI } from "../services/api";

const Teams = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [recommendedTeam, setRecommendedTeam] = useState([]);
  const [skillCategories, setSkillCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [userSkills, setUserSkills] = useState("");
  const [userInterests, setUserInterests] = useState("");
  const [projectType, setProjectType] = useState("");
  const [teamSize, setTeamSize] = useState("3-5");
  const [matchResults, setMatchResults] = useState([]);
  const [activeTab, setActiveTab] = useState("discover");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showTeamModal, setShowTeamModal] = useState(false);

  const resultsRef = useRef(null);

  // Sample teams data (in production, this would come from API)
  const sampleTeams = [
    {
      id: 1,
      name: "Web Wizards",
      description:
        "Full-stack web development experts specializing in React, Node.js, and cloud solutions.",
      category: "Web Development",
      memberCount: 5,
      projectsCompleted: 23,
      rating: 4.9,
      skills: ["React", "Node.js", "AWS", "MongoDB", "TypeScript"],
      avatar: "🌐",
      gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
      isOpen: true,
      members: [
        {
          id: 1,
          name: "Alex Chen",
          role: "Team Lead",
          avatar: "👨‍💻",
          skills: ["React", "Node.js"],
        },
        {
          id: 2,
          name: "Sarah Miller",
          role: "Frontend Dev",
          avatar: "👩‍💻",
          skills: ["React", "CSS"],
        },
        {
          id: 3,
          name: "James Wilson",
          role: "Backend Dev",
          avatar: "👨‍💼",
          skills: ["Node.js", "MongoDB"],
        },
        {
          id: 4,
          name: "Emma Davis",
          role: "DevOps",
          avatar: "👩‍🔧",
          skills: ["AWS", "Docker"],
        },
        {
          id: 5,
          name: "Michael Brown",
          role: "Full Stack",
          avatar: "🧑‍💻",
          skills: ["TypeScript", "React"],
        },
      ],
    },
    {
      id: 2,
      name: "Design Dreams",
      description:
        "Creative design team crafting beautiful user experiences and brand identities.",
      category: "Graphic Design",
      memberCount: 4,
      projectsCompleted: 45,
      rating: 4.8,
      skills: ["UI/UX", "Figma", "Adobe XD", "Illustration", "Branding"],
      avatar: "🎨",
      gradient: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
      isOpen: true,
      members: [
        {
          id: 6,
          name: "Lisa Park",
          role: "Creative Director",
          avatar: "👩‍🎨",
          skills: ["Branding", "UI/UX"],
        },
        {
          id: 7,
          name: "David Kim",
          role: "UI Designer",
          avatar: "👨‍🎨",
          skills: ["Figma", "Adobe XD"],
        },
        {
          id: 8,
          name: "Amy Johnson",
          role: "Illustrator",
          avatar: "🎨",
          skills: ["Illustration", "Photoshop"],
        },
        {
          id: 9,
          name: "Ryan Lee",
          role: "Motion Designer",
          avatar: "🎬",
          skills: ["After Effects", "Animation"],
        },
      ],
    },
    {
      id: 3,
      name: "Content Creators",
      description:
        "Professional writers and content strategists delivering compelling narratives.",
      category: "Content Writing",
      memberCount: 6,
      projectsCompleted: 67,
      rating: 4.7,
      skills: [
        "Copywriting",
        "SEO",
        "Blog Writing",
        "Technical Writing",
        "Editing",
      ],
      avatar: "✍️",
      gradient: "linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)",
      isOpen: false,
      members: [
        {
          id: 10,
          name: "Jennifer Smith",
          role: "Content Lead",
          avatar: "📝",
          skills: ["Strategy", "SEO"],
        },
        {
          id: 11,
          name: "Mark Thompson",
          role: "Senior Writer",
          avatar: "✏️",
          skills: ["Copywriting", "Blog"],
        },
        {
          id: 12,
          name: "Nina Garcia",
          role: "Technical Writer",
          avatar: "📚",
          skills: ["Documentation", "Tech"],
        },
        {
          id: 13,
          name: "Chris Evans",
          role: "Editor",
          avatar: "📖",
          skills: ["Editing", "Proofreading"],
        },
        {
          id: 14,
          name: "Sophie Turner",
          role: "SEO Specialist",
          avatar: "🔍",
          skills: ["SEO", "Analytics"],
        },
        {
          id: 15,
          name: "Tom Hardy",
          role: "Content Writer",
          avatar: "💻",
          skills: ["Blog Writing", "Social"],
        },
      ],
    },
    {
      id: 4,
      name: "Video Virtuosos",
      description:
        "Expert video production team creating stunning visual content for all platforms.",
      category: "Video Editing",
      memberCount: 4,
      projectsCompleted: 34,
      rating: 4.9,
      skills: [
        "Premiere Pro",
        "After Effects",
        "DaVinci Resolve",
        "Motion Graphics",
        "Color Grading",
      ],
      avatar: "🎬",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      isOpen: true,
      members: [
        {
          id: 16,
          name: "Jake Martinez",
          role: "Director",
          avatar: "🎥",
          skills: ["Directing", "Cinematography"],
        },
        {
          id: 17,
          name: "Emily White",
          role: "Editor",
          avatar: "✂️",
          skills: ["Premiere Pro", "Final Cut"],
        },
        {
          id: 18,
          name: "Carlos Ruiz",
          role: "Motion Designer",
          avatar: "🎞️",
          skills: ["After Effects", "Cinema 4D"],
        },
        {
          id: 19,
          name: "Mia Chen",
          role: "Colorist",
          avatar: "🌈",
          skills: ["DaVinci Resolve", "Color Grading"],
        },
      ],
    },
    {
      id: 5,
      name: "Marketing Mavens",
      description:
        "Data-driven marketing team specializing in growth strategies and brand building.",
      category: "Marketing",
      memberCount: 5,
      projectsCompleted: 52,
      rating: 4.6,
      skills: [
        "Digital Marketing",
        "Social Media",
        "Analytics",
        "PPC",
        "Email Marketing",
      ],
      avatar: "📢",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
      isOpen: true,
      members: [
        {
          id: 20,
          name: "Rachel Green",
          role: "Marketing Lead",
          avatar: "📊",
          skills: ["Strategy", "Analytics"],
        },
        {
          id: 21,
          name: "Joey Tribbiani",
          role: "Social Media Manager",
          avatar: "📱",
          skills: ["Social Media", "Content"],
        },
        {
          id: 22,
          name: "Monica Geller",
          role: "PPC Specialist",
          avatar: "💰",
          skills: ["Google Ads", "Facebook Ads"],
        },
        {
          id: 23,
          name: "Chandler Bing",
          role: "Email Marketer",
          avatar: "📧",
          skills: ["Email", "Automation"],
        },
        {
          id: 24,
          name: "Phoebe Buffay",
          role: "Content Creator",
          avatar: "🎸",
          skills: ["Creative", "Storytelling"],
        },
      ],
    },
    {
      id: 6,
      name: "Tutoring Titans",
      description:
        "Academic excellence team providing expert tutoring across multiple subjects.",
      category: "Tutoring",
      memberCount: 7,
      projectsCompleted: 89,
      rating: 4.9,
      skills: [
        "Mathematics",
        "Physics",
        "Chemistry",
        "Programming",
        "Languages",
      ],
      avatar: "📚",
      gradient: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
      isOpen: true,
      members: [
        {
          id: 25,
          name: "Dr. Alan Turing",
          role: "Math & CS Lead",
          avatar: "🧮",
          skills: ["Math", "Programming"],
        },
        {
          id: 26,
          name: "Marie Curie",
          role: "Science Tutor",
          avatar: "⚗️",
          skills: ["Physics", "Chemistry"],
        },
        {
          id: 27,
          name: "William Shakespeare",
          role: "English Tutor",
          avatar: "📜",
          skills: ["English", "Literature"],
        },
        {
          id: 28,
          name: "Isaac Newton",
          role: "Physics Tutor",
          avatar: "🍎",
          skills: ["Physics", "Calculus"],
        },
        {
          id: 29,
          name: "Ada Lovelace",
          role: "Programming Tutor",
          avatar: "💻",
          skills: ["Python", "Java"],
        },
        {
          id: 30,
          name: "Leonardo DaVinci",
          role: "Art & Design Tutor",
          avatar: "🎨",
          skills: ["Art", "Design"],
        },
        {
          id: 31,
          name: "Confucius",
          role: "Philosophy Tutor",
          avatar: "🎓",
          skills: ["Philosophy", "Ethics"],
        },
      ],
    },
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    filterTeams();
  }, [selectedCategory, searchQuery]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load skill categories
      const categoriesResponse = await skillsAPI.getSkillCategories();
      setSkillCategories(
        categoriesResponse.data?.results || categoriesResponse.data || [],
      );

      // Set initial teams
      setTeams(sampleTeams);
    } catch (err) {
      console.error("Error loading data:", err);
      setTeams(sampleTeams);
    } finally {
      setLoading(false);
    }
  };

  const filterTeams = () => {
    let filtered = [...sampleTeams];

    if (selectedCategory) {
      filtered = filtered.filter((team) =>
        team.category.toLowerCase().includes(selectedCategory.toLowerCase()),
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (team) =>
          team.name.toLowerCase().includes(query) ||
          team.description.toLowerCase().includes(query) ||
          team.skills.some((skill) => skill.toLowerCase().includes(query)),
      );
    }

    setTeams(filtered);
  };

  const startAIMatching = async () => {
    if (!userSkills && !userInterests && !projectType) {
      alert("Please provide at least one field for AI matching");
      return;
    }

    setAiAnalyzing(true);
    setAiProgress(0);

    // Simulate AI analysis with progress
    const progressInterval = setInterval(() => {
      setAiProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // Simulate AI matching (in production, call actual AI API)
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // Calculate match scores based on user input
      const results = sampleTeams
        .map((team) => {
          let score = 0;
          const reasons = [];

          // Match skills
          if (userSkills) {
            const userSkillsList = userSkills
              .toLowerCase()
              .split(",")
              .map((s) => s.trim());
            const matchedSkills = team.skills.filter((skill) =>
              userSkillsList.some(
                (us) =>
                  skill.toLowerCase().includes(us) ||
                  us.includes(skill.toLowerCase()),
              ),
            );
            if (matchedSkills.length > 0) {
              score += matchedSkills.length * 15;
              reasons.push(
                `${matchedSkills.length} skill${matchedSkills.length > 1 ? "s" : ""} matched`,
              );
            }
          }

          // Match interests/category
          if (userInterests) {
            if (
              team.category
                .toLowerCase()
                .includes(userInterests.toLowerCase()) ||
              team.description
                .toLowerCase()
                .includes(userInterests.toLowerCase())
            ) {
              score += 25;
              reasons.push("Matches your interests");
            }
          }

          // Match project type
          if (projectType) {
            if (
              team.category.toLowerCase().includes(projectType.toLowerCase()) ||
              team.skills.some((s) =>
                s.toLowerCase().includes(projectType.toLowerCase()),
              )
            ) {
              score += 20;
              reasons.push("Suitable for your project type");
            }
          }

          // Team availability bonus
          if (team.isOpen) {
            score += 10;
            reasons.push("Currently accepting members");
          }

          // Team size preference
          const [minSize, maxSize] = teamSize.split("-").map(Number);
          if (team.memberCount >= minSize && team.memberCount <= maxSize) {
            score += 10;
            reasons.push("Ideal team size");
          }

          // Rating bonus
          if (team.rating >= 4.8) {
            score += 15;
            reasons.push("Highly rated team");
          }

          return {
            ...team,
            matchScore: Math.min(score, 100),
            matchReasons: reasons,
          };
        })
        .filter((team) => team.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore);

      setAiProgress(100);

      setTimeout(() => {
        setMatchResults(results);
        setShowAIModal(false);
        setAiAnalyzing(false);
        setActiveTab("results");

        // Scroll to results
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }, 500);
    } catch (err) {
      console.error("AI matching error:", err);
      setAiAnalyzing(false);
    }
  };

  const handleViewTeam = (team) => {
    setSelectedTeam(team);
    setShowTeamModal(true);
  };

  const handleContactTeam = (team) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    // Navigate to messages with team lead
    navigate(
      `/messages?userId=${team.members[0]?.id}&subject=Team Inquiry: ${team.name}`,
    );
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "success";
    if (score >= 60) return "info";
    if (score >= 40) return "warning";
    return "secondary";
  };

  const getScoreGradient = (score) => {
    if (score >= 80) return "linear-gradient(135deg, #10b981 0%, #059669 100%)";
    if (score >= 60) return "linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)";
    if (score >= 40) return "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)";
    return "linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)";
  };

  return (
    <div
      className="teams-page"
      style={{ minHeight: "100vh", background: "var(--light-bg)" }}
    >
      {/* Hero Section */}
      <section
        style={{
          background:
            "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
          padding: "100px 0 80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
            pointerEvents: "none",
          }}
        />

        <Container style={{ position: "relative", zIndex: 1 }}>
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <Badge
                style={{
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  padding: "8px 20px",
                  borderRadius: "50px",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  marginBottom: "1.5rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>✨</span>
                AI-Powered Team Discovery
              </Badge>

              <h1
                style={{
                  fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
                  fontWeight: 800,
                  color: "white",
                  marginBottom: "1.5rem",
                  lineHeight: 1.1,
                }}
              >
                Find Your{" "}
                <span
                  style={{
                    background: "linear-gradient(to right, #fef08a, #fde047)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Dream Team
                </span>
              </h1>

              <p
                style={{
                  fontSize: "1.25rem",
                  color: "rgba(255,255,255,0.9)",
                  maxWidth: "600px",
                  margin: "0 auto 2rem",
                  lineHeight: 1.7,
                }}
              >
                Let our AI analyze your skills and interests to match you with
                the perfect team. Join forces with talented individuals and
                build something amazing together.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <Button
                  onClick={() => setShowAIModal(true)}
                  style={{
                    background: "white",
                    color: "#6366f1",
                    border: "none",
                    padding: "16px 32px",
                    borderRadius: "50px",
                    fontWeight: 700,
                    fontSize: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                    transition: "all 0.3s ease",
                  }}
                  className="hover-lift"
                >
                  <span style={{ fontSize: "1.25rem" }}>🤖</span>
                  Find My Perfect Team
                </Button>

                <Button
                  onClick={() => {
                    setActiveTab("discover");
                    document
                      .getElementById("teams-section")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  style={{
                    background: "transparent",
                    color: "white",
                    border: "2px solid rgba(255,255,255,0.5)",
                    padding: "14px 28px",
                    borderRadius: "50px",
                    fontWeight: 600,
                    fontSize: "1rem",
                    transition: "all 0.3s ease",
                  }}
                >
                  Browse All Teams
                </Button>
              </div>
            </Col>
          </Row>
        </Container>

        {/* Decorative floating elements */}
        <div
          className="animate-float"
          style={{
            position: "absolute",
            top: "20%",
            left: "10%",
            background: "white",
            borderRadius: "16px",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            animation: "float 4s ease-in-out infinite",
          }}
        >
          <span style={{ fontSize: "1.5rem" }}>👥</span>
          <span style={{ fontWeight: 600, color: "#1e293b" }}>
            Team Formed!
          </span>
        </div>

        <div
          className="animate-float"
          style={{
            position: "absolute",
            top: "60%",
            right: "10%",
            background: "white",
            borderRadius: "16px",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            animation: "float 4s ease-in-out infinite 0.5s",
          }}
        >
          <span style={{ fontSize: "1.5rem" }}>🎯</span>
          <span style={{ fontWeight: 600, color: "#1e293b" }}>98% Match</span>
        </div>
      </section>

      {/* Main Content Section */}
      <section
        id="teams-section"
        style={{ padding: "60px 0" }}
        ref={resultsRef}
      >
        <Container>
          {/* Tabs Navigation */}
          <Nav
            variant="pills"
            activeKey={activeTab}
            onSelect={setActiveTab}
            className="mb-4 justify-content-center"
            style={{ gap: "0.5rem" }}
          >
            <Nav.Item>
              <Nav.Link
                eventKey="discover"
                style={{
                  borderRadius: "50px",
                  padding: "12px 24px",
                  fontWeight: 600,
                  background:
                    activeTab === "discover"
                      ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                      : "white",
                  color: activeTab === "discover" ? "white" : "#64748b",
                  border:
                    activeTab === "discover" ? "none" : "1px solid #e2e8f0",
                  transition: "all 0.3s ease",
                }}
              >
                🔍 Discover Teams
              </Nav.Link>
            </Nav.Item>
            {matchResults.length > 0 && (
              <Nav.Item>
                <Nav.Link
                  eventKey="results"
                  style={{
                    borderRadius: "50px",
                    padding: "12px 24px",
                    fontWeight: 600,
                    background:
                      activeTab === "results"
                        ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                        : "white",
                    color: activeTab === "results" ? "white" : "#64748b",
                    border:
                      activeTab === "results" ? "none" : "1px solid #e2e8f0",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  ✨ AI Matches
                  <Badge
                    style={{
                      background: "rgba(255,255,255,0.3)",
                      color: activeTab === "results" ? "white" : "#6366f1",
                      borderRadius: "50px",
                    }}
                  >
                    {matchResults.length}
                  </Badge>
                </Nav.Link>
              </Nav.Item>
            )}
          </Nav>

          {/* Search and Filter Bar */}
          {activeTab === "discover" && (
            <Card
              style={{
                borderRadius: "24px",
                border: "none",
                boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
                marginBottom: "40px",
              }}
            >
              <Card.Body style={{ padding: "24px" }}>
                <Row className="g-3 align-items-end">
                  <Col md={5}>
                    <Form.Label
                      style={{
                        fontWeight: 600,
                        color: "#1e293b",
                        marginBottom: "8px",
                      }}
                    >
                      Search Teams
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Search by name, skills, or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        borderRadius: "12px",
                        padding: "14px 18px",
                        border: "2px solid #e2e8f0",
                        fontSize: "0.9375rem",
                      }}
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Label
                      style={{
                        fontWeight: 600,
                        color: "#1e293b",
                        marginBottom: "8px",
                      }}
                    >
                      Category
                    </Form.Label>
                    <Form.Select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      style={{
                        borderRadius: "12px",
                        padding: "14px 18px",
                        border: "2px solid #e2e8f0",
                        fontSize: "0.9375rem",
                      }}
                    >
                      <option value="">All Categories</option>
                      <option value="Web Development">
                        💻 Web Development
                      </option>
                      <option value="Graphic Design">🎨 Graphic Design</option>
                      <option value="Content Writing">
                        ✍️ Content Writing
                      </option>
                      <option value="Video Editing">🎬 Video Editing</option>
                      <option value="Marketing">📢 Marketing</option>
                      <option value="Tutoring">📚 Tutoring</option>
                    </Form.Select>
                  </Col>
                  <Col md={3}>
                    <Button
                      onClick={() => setShowAIModal(true)}
                      style={{
                        width: "100%",
                        background:
                          "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                        border: "none",
                        padding: "14px 20px",
                        borderRadius: "12px",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      <span>🤖</span> AI Match
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          {/* AI Match Results */}
          {activeTab === "results" && matchResults.length > 0 && (
            <>
              <Alert
                style={{
                  background:
                    "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  borderRadius: "16px",
                  padding: "20px 24px",
                  marginBottom: "30px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <span style={{ fontSize: "2rem" }}>✨</span>
                  <div>
                    <h5
                      style={{ margin: 0, fontWeight: 700, color: "#6366f1" }}
                    >
                      AI Found {matchResults.length} Perfect Matches!
                    </h5>
                    <p
                      style={{
                        margin: 0,
                        color: "#64748b",
                        fontSize: "0.9375rem",
                      }}
                    >
                      Based on your skills, interests, and preferences
                    </p>
                  </div>
                </div>
              </Alert>

              <Row>
                {matchResults.map((team, index) => (
                  <Col lg={6} key={team.id} className="mb-4">
                    <Card
                      className="hover-lift"
                      style={{
                        borderRadius: "24px",
                        border:
                          index === 0
                            ? "2px solid #6366f1"
                            : "1px solid #e2e8f0",
                        overflow: "hidden",
                        transition: "all 0.3s ease",
                        position: "relative",
                      }}
                    >
                      {index === 0 && (
                        <div
                          style={{
                            position: "absolute",
                            top: "16px",
                            right: "16px",
                            background:
                              "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                            color: "white",
                            padding: "6px 14px",
                            borderRadius: "50px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            zIndex: 10,
                          }}
                        >
                          👑 Best Match
                        </div>
                      )}

                      <div
                        style={{
                          height: "8px",
                          background: getScoreGradient(team.matchScore),
                        }}
                      />

                      <Card.Body style={{ padding: "24px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "16px",
                            marginBottom: "16px",
                          }}
                        >
                          <div
                            style={{
                              width: "64px",
                              height: "64px",
                              borderRadius: "16px",
                              background: team.gradient,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "1.75rem",
                              flexShrink: 0,
                            }}
                          >
                            {team.avatar}
                          </div>
                          <div style={{ flex: 1 }}>
                            <h5
                              style={{
                                margin: 0,
                                fontWeight: 700,
                                color: "#1e293b",
                              }}
                            >
                              {team.name}
                            </h5>
                            <p
                              style={{
                                margin: 0,
                                color: "#64748b",
                                fontSize: "0.875rem",
                              }}
                            >
                              {team.category}
                            </p>
                          </div>
                          <div
                            style={{
                              background: getScoreGradient(team.matchScore),
                              color: "white",
                              padding: "8px 16px",
                              borderRadius: "12px",
                              fontWeight: 700,
                              fontSize: "1.125rem",
                            }}
                          >
                            {team.matchScore}%
                          </div>
                        </div>

                        <p
                          style={{
                            color: "#64748b",
                            fontSize: "0.9375rem",
                            marginBottom: "16px",
                          }}
                        >
                          {team.description}
                        </p>

                        {/* Match Reasons */}
                        <div style={{ marginBottom: "16px" }}>
                          {team.matchReasons.map((reason, i) => (
                            <Badge
                              key={i}
                              style={{
                                background: "rgba(99, 102, 241, 0.1)",
                                color: "#6366f1",
                                padding: "6px 12px",
                                borderRadius: "50px",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                marginRight: "8px",
                                marginBottom: "8px",
                              }}
                            >
                              ✓ {reason}
                            </Badge>
                          ))}
                        </div>

                        {/* Skills */}
                        <div style={{ marginBottom: "16px" }}>
                          {team.skills.slice(0, 4).map((skill, i) => (
                            <Badge
                              key={i}
                              bg="light"
                              text="dark"
                              style={{
                                padding: "6px 12px",
                                borderRadius: "8px",
                                marginRight: "6px",
                                marginBottom: "6px",
                                fontSize: "0.8125rem",
                              }}
                            >
                              {skill}
                            </Badge>
                          ))}
                          {team.skills.length > 4 && (
                            <Badge
                              bg="secondary"
                              style={{
                                padding: "6px 12px",
                                borderRadius: "8px",
                              }}
                            >
                              +{team.skills.length - 4}
                            </Badge>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: "12px" }}>
                          <Button
                            variant="outline-primary"
                            onClick={() => handleViewTeam(team)}
                            style={{
                              flex: 1,
                              borderRadius: "12px",
                              padding: "12px",
                              fontWeight: 600,
                            }}
                          >
                            View Team
                          </Button>
                          <Button
                            onClick={() => handleContactTeam(team)}
                            style={{
                              flex: 1,
                              background:
                                "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                              border: "none",
                              borderRadius: "12px",
                              padding: "12px",
                              fontWeight: 600,
                            }}
                          >
                            Contact Team
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </>
          )}

          {/* Discover Teams Grid */}
          {activeTab === "discover" && (
            <>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner
                    animation="border"
                    variant="primary"
                    style={{ width: "3rem", height: "3rem" }}
                  />
                  <p className="mt-3 text-muted">Loading teams...</p>
                </div>
              ) : teams.length === 0 ? (
                <div className="text-center py-5">
                  <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>
                    🔍
                  </div>
                  <h4>No teams found</h4>
                  <p className="text-muted">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                <Row>
                  {teams.map((team) => (
                    <Col lg={4} md={6} key={team.id} className="mb-4">
                      <Card
                        className="hover-lift h-100"
                        style={{
                          borderRadius: "24px",
                          border: "1px solid #e2e8f0",
                          overflow: "hidden",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                        }}
                        onClick={() => handleViewTeam(team)}
                      >
                        {/* Card Header with Gradient */}
                        <div
                          style={{
                            height: "120px",
                            background: team.gradient,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "3.5rem",
                              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))",
                            }}
                          >
                            {team.avatar}
                          </span>
                          {team.isOpen && (
                            <Badge
                              style={{
                                position: "absolute",
                                top: "12px",
                                right: "12px",
                                background: "rgba(255,255,255,0.95)",
                                color: "#10b981",
                                padding: "6px 12px",
                                borderRadius: "50px",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                              }}
                            >
                              ✓ Open
                            </Badge>
                          )}
                        </div>

                        <Card.Body style={{ padding: "24px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: "8px",
                            }}
                          >
                            <h5
                              style={{
                                margin: 0,
                                fontWeight: 700,
                                color: "#1e293b",
                              }}
                            >
                              {team.name}
                            </h5>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                color: "#f59e0b",
                              }}
                            >
                              <span>⭐</span>
                              <span
                                style={{ fontWeight: 600, color: "#1e293b" }}
                              >
                                {team.rating}
                              </span>
                            </div>
                          </div>

                          <Badge
                            style={{
                              background: "rgba(99, 102, 241, 0.1)",
                              color: "#6366f1",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              marginBottom: "12px",
                            }}
                          >
                            {team.category}
                          </Badge>

                          <p
                            style={{
                              color: "#64748b",
                              fontSize: "0.875rem",
                              marginBottom: "16px",
                              lineHeight: 1.6,
                            }}
                          >
                            {team.description.length > 100
                              ? team.description.substring(0, 100) + "..."
                              : team.description}
                          </p>

                          {/* Stats Row */}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "12px 0",
                              borderTop: "1px solid #e2e8f0",
                              borderBottom: "1px solid #e2e8f0",
                              marginBottom: "16px",
                            }}
                          >
                            <div style={{ textAlign: "center" }}>
                              <div
                                style={{ fontWeight: 700, color: "#1e293b" }}
                              >
                                {team.memberCount}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                }}
                              >
                                Members
                              </div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                              <div
                                style={{ fontWeight: 700, color: "#1e293b" }}
                              >
                                {team.projectsCompleted}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                }}
                              >
                                Projects
                              </div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                              <div
                                style={{ fontWeight: 700, color: "#1e293b" }}
                              >
                                {team.skills.length}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                }}
                              >
                                Skills
                              </div>
                            </div>
                          </div>

                          {/* Skills Preview */}
                          <div>
                            {team.skills.slice(0, 3).map((skill, i) => (
                              <Badge
                                key={i}
                                bg="light"
                                text="dark"
                                style={{
                                  padding: "5px 10px",
                                  borderRadius: "6px",
                                  marginRight: "6px",
                                  marginBottom: "6px",
                                  fontSize: "0.75rem",
                                }}
                              >
                                {skill}
                              </Badge>
                            ))}
                            {team.skills.length > 3 && (
                              <Badge
                                bg="secondary"
                                style={{
                                  padding: "5px 10px",
                                  borderRadius: "6px",
                                  fontSize: "0.75rem",
                                }}
                              >
                                +{team.skills.length - 3}
                              </Badge>
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </>
          )}
        </Container>
      </section>

      {/* AI Matching Modal */}
      <Modal
        show={showAIModal}
        onHide={() => !aiAnalyzing && setShowAIModal(false)}
        centered
        size="lg"
      >
        <Modal.Header
          closeButton={!aiAnalyzing}
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            color: "white",
            border: "none",
          }}
        >
          <Modal.Title
            style={{
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>🤖</span>
            AI Team Matching
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "32px" }}>
          {aiAnalyzing ? (
            <div className="text-center py-4">
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  margin: "0 auto 24px",
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "pulse 2s infinite",
                }}
              >
                <span style={{ fontSize: "2.5rem" }}>🧠</span>
              </div>
              <h5 style={{ marginBottom: "8px" }}>
                AI is analyzing your profile...
              </h5>
              <p className="text-muted mb-4">
                Finding the best team matches for you
              </p>
              <ProgressBar
                now={aiProgress}
                animated
                style={{ height: "10px", borderRadius: "50px" }}
              />
              <p className="mt-2 text-muted" style={{ fontSize: "0.875rem" }}>
                {aiProgress < 30 && "Analyzing your skills..."}
                {aiProgress >= 30 &&
                  aiProgress < 60 &&
                  "Matching with team profiles..."}
                {aiProgress >= 60 &&
                  aiProgress < 90 &&
                  "Calculating compatibility scores..."}
                {aiProgress >= 90 && "Finalizing results..."}
              </p>
            </div>
          ) : (
            <>
              <p className="text-muted mb-4">
                Tell us about yourself and what you're looking for. Our AI will
                find the best team matches for you.
              </p>

              <Form>
                <Form.Group className="mb-4">
                  <Form.Label style={{ fontWeight: 600 }}>
                    Your Skills
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., React, Python, UI Design, Video Editing..."
                    value={userSkills}
                    onChange={(e) => setUserSkills(e.target.value)}
                    style={{
                      borderRadius: "12px",
                      padding: "14px 18px",
                      border: "2px solid #e2e8f0",
                    }}
                  />
                  <Form.Text className="text-muted">
                    Separate multiple skills with commas
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label style={{ fontWeight: 600 }}>
                    Your Interests
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., Web Development, Marketing, Education..."
                    value={userInterests}
                    onChange={(e) => setUserInterests(e.target.value)}
                    style={{
                      borderRadius: "12px",
                      padding: "14px 18px",
                      border: "2px solid #e2e8f0",
                    }}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label style={{ fontWeight: 600 }}>
                    Project Type
                  </Form.Label>
                  <Form.Select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    style={{
                      borderRadius: "12px",
                      padding: "14px 18px",
                      border: "2px solid #e2e8f0",
                    }}
                  >
                    <option value="">Select project type...</option>
                    <option value="Web Development">💻 Web Development</option>
                    <option value="Mobile App">📱 Mobile App</option>
                    <option value="Design">🎨 Design & Branding</option>
                    <option value="Content">✍️ Content Creation</option>
                    <option value="Video">🎬 Video Production</option>
                    <option value="Marketing">📢 Marketing Campaign</option>
                    <option value="Education">📚 Educational Project</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label style={{ fontWeight: 600 }}>
                    Preferred Team Size
                  </Form.Label>
                  <Form.Select
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    style={{
                      borderRadius: "12px",
                      padding: "14px 18px",
                      border: "2px solid #e2e8f0",
                    }}
                  >
                    <option value="2-3">Small (2-3 members)</option>
                    <option value="3-5">Medium (3-5 members)</option>
                    <option value="5-10">Large (5-10 members)</option>
                  </Form.Select>
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        {!aiAnalyzing && (
          <Modal.Footer style={{ border: "none", padding: "0 32px 32px" }}>
            <Button
              variant="outline-secondary"
              onClick={() => setShowAIModal(false)}
              style={{ borderRadius: "12px", padding: "12px 24px" }}
            >
              Cancel
            </Button>
            <Button
              onClick={startAIMatching}
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                border: "none",
                borderRadius: "12px",
                padding: "12px 32px",
                fontWeight: 600,
              }}
            >
              🔍 Find My Team
            </Button>
          </Modal.Footer>
        )}
      </Modal>

      {/* Team Details Modal */}
      <Modal
        show={showTeamModal}
        onHide={() => setShowTeamModal(false)}
        centered
        size="lg"
      >
        {selectedTeam && (
          <>
            <div
              style={{
                height: "160px",
                background: selectedTeam.gradient,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <Button
                variant="link"
                onClick={() => setShowTeamModal(false)}
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  color: "white",
                  fontSize: "1.5rem",
                  padding: "0",
                  lineHeight: 1,
                }}
              >
                ×
              </Button>
              <span
                style={{
                  fontSize: "5rem",
                  filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
                }}
              >
                {selectedTeam.avatar}
              </span>
            </div>

            <Modal.Body style={{ padding: "32px" }}>
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <h3 style={{ fontWeight: 800, marginBottom: "8px" }}>
                  {selectedTeam.name}
                </h3>
                <Badge
                  style={{
                    background: "rgba(99, 102, 241, 0.1)",
                    color: "#6366f1",
                    padding: "6px 14px",
                    borderRadius: "50px",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                  }}
                >
                  {selectedTeam.category}
                </Badge>
              </div>

              <p
                style={{
                  color: "#64748b",
                  textAlign: "center",
                  marginBottom: "24px",
                }}
              >
                {selectedTeam.description}
              </p>

              {/* Stats */}
              <Row className="mb-4">
                <Col xs={4}>
                  <div
                    style={{
                      textAlign: "center",
                      padding: "16px",
                      background: "#f8fafc",
                      borderRadius: "16px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1.75rem",
                        fontWeight: 800,
                        color: "#6366f1",
                      }}
                    >
                      {selectedTeam.memberCount}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#64748b" }}>
                      Members
                    </div>
                  </div>
                </Col>
                <Col xs={4}>
                  <div
                    style={{
                      textAlign: "center",
                      padding: "16px",
                      background: "#f8fafc",
                      borderRadius: "16px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1.75rem",
                        fontWeight: 800,
                        color: "#10b981",
                      }}
                    >
                      {selectedTeam.projectsCompleted}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#64748b" }}>
                      Projects
                    </div>
                  </div>
                </Col>
                <Col xs={4}>
                  <div
                    style={{
                      textAlign: "center",
                      padding: "16px",
                      background: "#f8fafc",
                      borderRadius: "16px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1.75rem",
                        fontWeight: 800,
                        color: "#f59e0b",
                      }}
                    >
                      ⭐ {selectedTeam.rating}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#64748b" }}>
                      Rating
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Skills */}
              <div style={{ marginBottom: "24px" }}>
                <h6 style={{ fontWeight: 700, marginBottom: "12px" }}>
                  Team Skills
                </h6>
                <div>
                  {selectedTeam.skills.map((skill, i) => (
                    <Badge
                      key={i}
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
                        color: "#6366f1",
                        padding: "8px 14px",
                        borderRadius: "8px",
                        marginRight: "8px",
                        marginBottom: "8px",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                      }}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Team Members */}
              <div>
                <h6 style={{ fontWeight: 700, marginBottom: "16px" }}>
                  Team Members
                </h6>
                <Row>
                  {selectedTeam.members.map((member) => (
                    <Col md={6} key={member.id} className="mb-3">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 16px",
                          background: "#f8fafc",
                          borderRadius: "12px",
                        }}
                      >
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "12px",
                            background:
                              "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.5rem",
                          }}
                        >
                          {member.avatar}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "#1e293b" }}>
                            {member.name}
                          </div>
                          <div
                            style={{ fontSize: "0.8125rem", color: "#64748b" }}
                          >
                            {member.role}
                          </div>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            </Modal.Body>

            <Modal.Footer style={{ border: "none", padding: "0 32px 32px" }}>
              <Button
                variant="outline-secondary"
                onClick={() => setShowTeamModal(false)}
                style={{ borderRadius: "12px", padding: "12px 24px" }}
              >
                Close
              </Button>
              {selectedTeam.isOpen && (
                <Button
                  onClick={() => handleContactTeam(selectedTeam)}
                  style={{
                    background:
                      "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    border: "none",
                    borderRadius: "12px",
                    padding: "12px 32px",
                    fontWeight: 600,
                  }}
                >
                  📩 Contact Team
                </Button>
              )}
            </Modal.Footer>
          </>
        )}
      </Modal>
    </div>
  );
};

export default Teams;
