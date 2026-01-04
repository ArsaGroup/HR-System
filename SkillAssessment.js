import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Form,
  Button,
  Alert,
  ProgressBar,
  Badge,
  Row,
  Col,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { skillsAPI } from "../services/api";

const SkillAssessment = () => {
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  useEffect(() => {
    loadSkills();
  }, []);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && assessment && !submitted) {
      handleSubmit();
    }
  }, [timeLeft]);

  const loadSkills = async () => {
    try {
      setLoading(true);
      const response = await skillsAPI.getAvailableAssessments();
      const data = response.data || [];
      setSkills(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading assessments:", error);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  const startAssessment = async (assessmentId) => {
    try {
      setLoading(true);
      const response = await skillsAPI.getAssessmentQuestions(assessmentId);
      const assessmentData = response.data;

      // Check if assessment has questions
      if (!assessmentData.questions || assessmentData.questions.length === 0) {
        alert(
          "This assessment has no questions configured yet. Please try another assessment.",
        );
        setLoading(false);
        return;
      }

      // Ensure questions have proper IDs
      const questionsWithIds = assessmentData.questions.map((q, index) => ({
        ...q,
        id: q.id || index + 1,
      }));

      console.log("Assessment loaded:", {
        title: assessmentData.title,
        questionsCount: questionsWithIds.length,
        questions: questionsWithIds.map((q) => ({
          id: q.id,
          question: q.question?.substring(0, 50),
        })),
      });

      setAssessment({
        ...assessmentData,
        questions: questionsWithIds,
      });
      setSelectedSkill(assessmentId);
      setCurrentQuestion(0);
      setAnswers({});
      setTimeLeft(assessmentData.time_limit * 60); // Convert to seconds
      setSubmitted(false);
      setScore(null);
    } catch (error) {
      console.error("Error starting assessment:", error);
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Failed to load assessment. Please try again.";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, answerIndex) => {
    const qId = String(questionId);
    setAnswers((prev) => {
      const newAnswers = {
        ...prev,
        [qId]: answerIndex,
      };
      console.log("Answer selected:", {
        questionId: qId,
        answerIndex,
        answers: newAnswers,
      });
      return newAnswers;
    });
  };

  const handleNext = () => {
    if (currentQuestion < assessment.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (!assessment || !selectedSkill) {
      alert("Assessment data missing. Please start the assessment again.");
      return;
    }

    const answeredCount = Object.keys(answers).length;
    const totalQuestions = assessment.questions.length;

    if (answeredCount === 0) {
      if (
        !window.confirm("You haven't answered any questions. Submit anyway?")
      ) {
        return;
      }
    } else if (answeredCount < totalQuestions) {
      if (
        !window.confirm(
          `You've only answered ${answeredCount} of ${totalQuestions} questions. Submit anyway?`,
        )
      ) {
        return;
      }
    }

    try {
      setLoading(true);
      setSubmitted(true); // Prevent double submission

      // Format answers properly - ensure all question IDs are strings
      const formattedAnswers = {};
      assessment.questions.forEach((q, index) => {
        const qId = String(q.id || index + 1);
        if (answers[qId] !== undefined && answers[qId] !== null) {
          formattedAnswers[qId] = parseInt(answers[qId]);
        }
      });

      console.log("Submitting assessment:", {
        selectedSkill,
        answers: formattedAnswers,
      });

      const response = await skillsAPI.submitAssessment(
        selectedSkill,
        formattedAnswers,
      );
      const result = response.data;

      console.log("Assessment result:", result);

      setScore(result.score);

      // Reload user skills to show updated score
      setTimeout(() => {
        navigate("/profile");
      }, 3000);
    } catch (error) {
      console.error("Error submitting assessment:", error);
      console.error("Error details:", error.response?.data);
      setSubmitted(false); // Allow retry
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message ||
        "Failed to submit assessment";
      alert(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (submitted && score !== null) {
    return (
      <Container className="my-5">
        <Card>
          <Card.Body className="text-center py-5">
            <h2>Assessment Complete!</h2>
            <div className="my-4">
              <h1
                className={
                  score >= (assessment.passing_score || 70)
                    ? "text-success"
                    : "text-danger"
                }
              >
                {score.toFixed(1)}%
              </h1>
              <p className="lead">
                You answered {Object.keys(answers).length} out of{" "}
                {assessment.questions.length} questions
              </p>
            </div>
            {score >= (assessment.passing_score || 70) ? (
              <Alert variant="success">
                <h4>Congratulations! 🎉</h4>
                <p>
                  You passed the assessment with a score of {score.toFixed(1)}%
                </p>
                <p className="mb-0">
                  Your score has been saved to your profile!
                </p>
              </Alert>
            ) : (
              <Alert variant="warning">
                <h4>Keep Practicing!</h4>
                <p>
                  You scored {score.toFixed(1)}%. The passing score is{" "}
                  {assessment.passing_score || 70}%.
                </p>
                <p className="mb-0">
                  You can retake this assessment to improve your score.
                </p>
              </Alert>
            )}
            <div className="mt-4">
              <Button
                variant="primary"
                onClick={() => {
                  setAssessment(null);
                  setSelectedSkill(null);
                  setSubmitted(false);
                  setScore(null);
                }}
              >
                Take Another Assessment
              </Button>
              <Button
                variant="outline-secondary"
                className="ms-2"
                onClick={() => navigate("/skills")}
              >
                Back to Skills
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (assessment && assessment.questions && assessment.questions.length > 0) {
    const question = assessment.questions[currentQuestion];
    if (!question) {
      return (
        <Container className="my-5">
          <Alert variant="danger">
            Error loading question. Please try again.
          </Alert>
        </Container>
      );
    }

    console.log("Current question:", {
      id: question.id,
      question: question.question.substring(0, 50),
      currentAnswer: answers[String(question.id)],
      allAnswers: answers,
    });

    const progress =
      ((currentQuestion + 1) / assessment.questions.length) * 100;

    return (
      <Container className="my-5">
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <div>
              <h4>{assessment.title}</h4>
              <small className="text-muted">
                Question {currentQuestion + 1} of {assessment.questions.length}
              </small>
            </div>
            <div>
              <Badge bg="warning" className="me-2">
                Time: {formatTime(timeLeft)}
              </Badge>
              <Badge bg="info">{Math.round(progress)}% Complete</Badge>
            </div>
          </Card.Header>
          <Card.Body>
            <ProgressBar now={progress} className="mb-4" />

            <div className="mb-4">
              <h5 className="mb-3">{question.question}</h5>
              <div>
                {question.options.map((option, index) => {
                  const isSelected = answers[String(question.id)] === index;
                  return (
                    <div
                      key={index}
                      className={`mb-3 p-3 border rounded ${isSelected ? "border-primary bg-primary bg-opacity-10" : "bg-light"}`}
                      style={{
                        cursor: "pointer",
                        userSelect: "none",
                        transition: "all 0.2s",
                      }}
                      onClick={() => {
                        console.log("Option clicked:", {
                          questionId: question.id,
                          index,
                        });
                        handleAnswer(question.id, index);
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = "#e9ecef";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = "";
                        }
                      }}
                    >
                      <div className="form-check d-flex align-items-center">
                        <input
                          className="form-check-input me-3"
                          type="radio"
                          id={`option-${question.id}-${index}`}
                          name={`question-${question.id}`}
                          checked={isSelected}
                          onChange={() => {
                            console.log("Radio changed:", {
                              questionId: question.id,
                              index,
                            });
                            handleAnswer(question.id, index);
                          }}
                          style={{
                            cursor: "pointer",
                            width: "20px",
                            height: "20px",
                          }}
                        />
                        <label
                          className="form-check-label flex-grow-1"
                          htmlFor={`option-${question.id}-${index}`}
                          style={{ cursor: "pointer", fontSize: "16px" }}
                        >
                          {option}
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="d-flex justify-content-between">
              <Button
                variant="outline-secondary"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>
              {currentQuestion === assessment.questions.length - 1 ? (
                <Button variant="success" onClick={handleSubmit}>
                  Submit Assessment
                </Button>
              ) : (
                <Button variant="primary" onClick={handleNext}>
                  Next
                </Button>
              )}
            </div>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <Card>
        <Card.Header>
          <h2>Skill Assessment</h2>
        </Card.Header>
        <Card.Body>
          <Alert variant="info">
            <h5>Test Your Skills</h5>
            <p className="mb-0">
              Take assessments to validate your skills and improve your profile.
              Passing assessments can boost your Hustle Score and make you more
              attractive to clients. Your scores will be displayed on your
              profile.
            </p>
          </Alert>

          <h4 className="mt-4 mb-3">Available Skill Assessments</h4>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">
                Loading available assessments...
              </p>
            </div>
          ) : skills.length === 0 ? (
            <Alert variant="info">
              <h5>No assessments available</h5>
              <p className="mb-0">
                There are no skill assessments available at the moment. Check
                back later or <a href="/skills">add skills to your profile</a>{" "}
                first.
              </p>
            </Alert>
          ) : (
            <Row>
              {skills.map((assessment) => (
                <Col md={6} key={assessment.id} className="mb-3">
                  <Card className="h-100">
                    <Card.Body className="d-flex flex-column">
                      <Card.Title>{assessment.title}</Card.Title>
                      <Card.Text className="text-muted flex-grow-1">
                        {assessment.description ||
                          `Test your ${assessment.name} skills`}
                      </Card.Text>
                      <div className="mb-3">
                        <Badge bg="info" className="me-2">
                          {assessment.total_questions} Questions
                        </Badge>
                        <Badge bg="warning" className="me-2">
                          {assessment.time_limit} min
                        </Badge>
                        <Badge bg="secondary">
                          Pass: {assessment.passing_score}%
                        </Badge>
                      </div>
                      <Button
                        variant="primary"
                        onClick={() => startAssessment(assessment.id)}
                        disabled={loading}
                        className="w-100"
                      >
                        {loading ? "Loading..." : "Start Assessment"}
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          <div className="mt-4">
            <Button
              variant="outline-secondary"
              onClick={() => navigate("/skills")}
            >
              Back to Skills
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SkillAssessment;
