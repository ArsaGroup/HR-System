import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Tab,
  Tabs,
  Image,
  Badge,
  ProgressBar,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { userAPI, skillsAPI } from "../services/api";

function Profile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({});
  const [userSkills, setUserSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile();
    fetchUserSkills();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      setProfile(response.data);
      setFormData(response.data);
    } catch (err) {
      setError("Failed to load profile");
    }
  };

  const fetchUserSkills = async () => {
    try {
      const response = await skillsAPI.getUserSkills();
      const data = response.data.results || response.data || [];
      setUserSkills(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load skills:", err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      // Filter out read-only and user fields - only send profile-specific data
      const profileData = {
        bio: formData.bio || "",
        date_of_birth: formData.date_of_birth || null,
        address: formData.address || "",
        city: formData.city || "",
        country: formData.country || "",
        provider_mode: formData.provider_mode || "offline",
        base_hourly_rate: formData.base_hourly_rate
          ? parseFloat(formData.base_hourly_rate)
          : null,
      };

      // Remove null/undefined values
      Object.keys(profileData).forEach((key) => {
        if (
          profileData[key] === null ||
          profileData[key] === undefined ||
          profileData[key] === ""
        ) {
          delete profileData[key];
        }
      });

      console.log("Updating profile with data:", profileData);

      const response = await userAPI.updateProfile(profileData);
      setProfile(response.data);
      setFormData(response.data);
      setMessage("Profile updated successfully!");

      // Update user context if needed
      if (updateUser) {
        updateUser({ profile: response.data });
      }
    } catch (err) {
      console.error("Profile update error:", err);
      // Show specific error message if available
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === "string") {
          setError(errorData);
        } else if (errorData.detail) {
          setError(errorData.detail);
        } else if (errorData.error) {
          setError(errorData.error);
        } else {
          // Show first field error
          const firstKey = Object.keys(errorData)[0];
          if (firstKey) {
            const firstError = Array.isArray(errorData[firstKey])
              ? errorData[firstKey][0]
              : errorData[firstKey];
            setError(`${firstKey}: ${firstError}`);
          } else {
            setError("Failed to update profile. Please try again.");
          }
        }
      } else {
        setError("Failed to update profile. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("profile_picture", file);

      try {
        setLoading(true);
        setError("");
        const response = await userAPI.updateProfile(formDataToSend);
        setProfile(response.data);
        setMessage("Profile picture updated successfully!");
        // Update user context
        if (updateUser) {
          updateUser({ profile: response.data });
        }
      } catch (err) {
        console.error("Upload error:", err);
        setError(
          err.response?.data?.profile_picture?.[0] ||
            err.response?.data?.detail ||
            "Failed to upload profile picture",
        );
      } finally {
        setLoading(false);
      }
    }
  };

  if (!profile) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <h1>Profile Management</h1>
          <p className="lead">
            Manage your personal information and preferences
          </p>
        </Col>
      </Row>

      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Tabs defaultActiveKey="personal" className="mb-4">
        <Tab eventKey="personal" title="Personal Information">
          <Row>
            <Col lg={8}>
              <Card>
                <Card.Body>
                  <Form onSubmit={handleSubmit}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Username</Form.Label>
                          <Form.Control
                            type="text"
                            value={user?.username}
                            disabled
                          />
                          <Form.Text className="text-muted">
                            Username cannot be changed
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            value={user?.email}
                            disabled
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Bio</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="bio"
                        value={formData.bio || ""}
                        onChange={handleChange}
                        placeholder="Tell us about yourself..."
                      />
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Date of Birth</Form.Label>
                          <Form.Control
                            type="date"
                            name="date_of_birth"
                            value={formData.date_of_birth || ""}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Phone</Form.Label>
                          <Form.Control
                            type="tel"
                            name="phone"
                            value={user?.phone || ""}
                            disabled
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Address</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="address"
                        value={formData.address || ""}
                        onChange={handleChange}
                        placeholder="Enter your address"
                      />
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>City</Form.Label>
                          <Form.Control
                            type="text"
                            name="city"
                            value={formData.city || ""}
                            onChange={handleChange}
                            placeholder="Enter your city"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Country</Form.Label>
                          <Form.Control
                            type="text"
                            name="country"
                            value={formData.country || ""}
                            onChange={handleChange}
                            placeholder="Enter your country"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    {user?.user_type === "service_provider" && (
                      <>
                        <hr />
                        <h5 className="mt-3">Provider Preferences</h5>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Availability Mode</Form.Label>
                              <Form.Select
                                name="provider_mode"
                                value={formData.provider_mode || "offline"}
                                onChange={handleChange}
                              >
                                <option value="online">
                                  Online / Remote (higher pay)
                                </option>
                                <option value="offline">
                                  Offline / On-site
                                </option>
                              </Form.Select>
                              <Form.Text className="text-muted">
                                Online providers automatically get a payout
                                multiplier.
                              </Form.Text>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Base Hourly Rate (USD)</Form.Label>
                              <Form.Control
                                type="number"
                                step="0.25"
                                min="0"
                                name="base_hourly_rate"
                                value={formData.base_hourly_rate || ""}
                                onChange={handleChange}
                              />
                              <Form.Text className="text-muted">
                                We automatically apply the online multiplier
                                when needed.
                              </Form.Text>
                            </Form.Group>
                          </Col>
                        </Row>
                      </>
                    )}

                    <Button variant="primary" type="submit" disabled={loading}>
                      {loading ? "Updating..." : "Update Profile"}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Card>
                <Card.Body className="text-center">
                  <div className="mb-3">
                    {profile.profile_picture ? (
                      <Image
                        src={profile.profile_picture}
                        roundedCircle
                        width="150"
                        height="150"
                        className="border"
                      />
                    ) : (
                      <div
                        className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center border"
                        style={{ width: "150px", height: "150px" }}
                      >
                        <span
                          className="text-muted"
                          style={{ fontSize: "3rem" }}
                        >
                          👤
                        </span>
                      </div>
                    )}
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label>Update Profile Picture</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </Form.Group>

                  <div className="mt-4">
                    <h5>Hustle Score</h5>
                    <div className="display-4 text-primary">
                      {profile.hustle_score || "0.00"}
                    </div>
                    <small className="text-muted">Your reputation score</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="skills" title="Skills & Assessments">
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5>My Skills & Assessment Scores</h5>
                <Button
                  variant="primary"
                  onClick={() => navigate("/skill-assessment")}
                >
                  Take Assessment
                </Button>
              </div>

              {userSkills.length === 0 ? (
                <Alert variant="info">
                  No skills added yet. <a href="/skills">Add skills</a> or{" "}
                  <a href="/skill-assessment">take assessments</a> to get
                  started.
                </Alert>
              ) : (
                <div>
                  {userSkills.map((userSkill) => (
                    <Card key={userSkill.id} className="mb-3">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h6>
                              {userSkill.skill_name || userSkill.skill?.name}
                            </h6>
                            <div className="mb-2">
                              <Badge bg="info" className="me-2">
                                {userSkill.level || "Intermediate"}
                              </Badge>
                              {userSkill.is_certified && (
                                <Badge bg="success">Certified</Badge>
                              )}
                            </div>

                            {userSkill.assessment_score !== null &&
                              userSkill.assessment_score !== undefined && (
                                <div className="mt-2">
                                  <div className="d-flex justify-content-between mb-1">
                                    <small>Assessment Score</small>
                                    <small>
                                      <strong>
                                        {parseFloat(
                                          userSkill.assessment_score,
                                        ).toFixed(1)}
                                        %
                                      </strong>
                                    </small>
                                  </div>
                                  <ProgressBar
                                    now={parseFloat(userSkill.assessment_score)}
                                    variant={
                                      parseFloat(userSkill.assessment_score) >=
                                      70
                                        ? "success"
                                        : "warning"
                                    }
                                    label={`${parseFloat(userSkill.assessment_score).toFixed(1)}%`}
                                  />
                                  {userSkill.last_assessment_date && (
                                    <small className="text-muted d-block mt-1">
                                      Last assessed:{" "}
                                      {new Date(
                                        userSkill.last_assessment_date,
                                      ).toLocaleDateString()}
                                    </small>
                                  )}
                                </div>
                              )}

                            {!userSkill.assessment_score && (
                              <Alert
                                variant="warning"
                                className="mt-2 mb-0 py-2"
                              >
                                <small>
                                  No assessment taken yet.{" "}
                                  <a href="/skill-assessment">
                                    Take assessment
                                  </a>{" "}
                                  to get certified.
                                </small>
                              </Alert>
                            )}
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="account" title="Account Settings">
          <Card>
            <Card.Body>
              <h5>Verification Status</h5>
              <ul className="list-unstyled">
                <li>
                  {user?.is_email_verified ? "✅" : "❌"} Email Verification
                </li>
                <li>
                  {user?.is_phone_verified ? "✅" : "❌"} Phone Verification
                </li>
              </ul>

              <h5 className="mt-4">User Type</h5>
              <p>
                <strong>
                  {user?.user_type === "service_provider"
                    ? "Service Provider"
                    : user?.user_type === "admin"
                      ? "Admin"
                      : "Service Requester"}
                </strong>
              </p>
              <small className="text-muted">
                Contact support to change your user type
              </small>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
}

export default Profile;
