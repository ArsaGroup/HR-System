import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../../services/api';

function Verification() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
      setMessage(location.state.message || 'We sent a verification code to your email.');
    } else {
      navigate('/register');
    }
  }, [location, navigate]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleCodeChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Auto-focus next input
      if (value && index < 5) {
        document.getElementById(`code-${index + 1}`).focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`).focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    
    const verificationCode = code.join('');
    if (verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.verifyCode({
        email,
        code: verificationCode,
        verification_type: 'email'
      });

      if (response.status === 200) {
        navigate('/login', { 
          state: { 
            message: 'Email verified successfully! Please login to continue.' 
          } 
        });
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Verification failed. Please try again.');
    }
    
    setLoading(false);
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setError('');

    try {
      await authAPI.sendVerification({
        email,
        verification_type: 'email'
      });
      setMessage('Verification code sent successfully!');
      setCountdown(60); // 60 seconds countdown
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    }
    
    setResendLoading(false);
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card className="shadow">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2>Verify Your Email</h2>
                <p className="text-muted">{message}</p>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleVerify}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-center w-100">
                    Enter 6-digit verification code
                  </Form.Label>
                  <div className="d-flex justify-content-between">
                    {code.map((digit, index) => (
                      <Form.Control
                        key={index}
                        id={`code-${index}`}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="text-center mx-1"
                        style={{ width: '45px', height: '60px', fontSize: '1.5rem' }}
                        required
                      />
                    ))}
                  </div>
                </Form.Group>

                <Button 
                  variant="primary" 
                  type="submit" 
                  className="w-100 mb-3" 
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </Button>

                <div className="text-center">
                  <p className="mb-2">
                    Didn't receive the code?{' '}
                    {countdown > 0 ? (
                      <span className="text-muted">
                        Resend in {countdown}s
                      </span>
                    ) : (
                      <Button
                        variant="link"
                        className="p-0 text-decoration-none"
                        onClick={handleResendCode}
                        disabled={resendLoading}
                      >
                        {resendLoading ? 'Sending...' : 'Resend Code'}
                      </Button>
                    )}
                  </p>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Verification;