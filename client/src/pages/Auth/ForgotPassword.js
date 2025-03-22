import React, { useState } from "react";
import Layout from "./../../components/Layout";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "../../styles/AuthStyles.css";

const ForgotPassword = () => {
    const [errors, setErrors] = useState({});
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const validateEmail = (email) => {
        if (!email) return "Email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return "Email is invalid";
        return "";
    };

    const validateNewPassword = (password) => {
        if (!password) return "Password is required";
        if (password.length < 6) return "Password must be at least 6 characters long";
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        if (!hasLetter || !hasNumber) return "Password must contain at least one letter and one number";
        return "";
    };

    const validateAnswer = (answer) => {
        if (!answer) return "Answer is required";
        if (answer.length < 4) return "Answer is too short";
        return "";
    };

    const handleChange = (setter, validator, field) => (e) => {
        const value = e.target.value;
        setter(value);
        if (errors[field]) {
            setErrors({ ...errors, [field]: "" });
        }
    };

    const handleBlur = (value, validator, field) => {
        const error = validator(value);
        setErrors({ ...errors, [field]: error });
    };

    const validateForm = () => {
        const newErrors = {
            email: validateEmail(email),
            newPassword: validateNewPassword(newPassword),
            answer: validateAnswer(answer),
        };
        
        setErrors(newErrors);
        
        return !Object.values(newErrors).some(error => error);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        
        if (!validateForm()) {
            return;
        }
        
        try {
            setLoading(true);
            const res = await axios.post("/api/v1/auth/forgot-password", {
                email,
                newPassword,
                answer,
            });

            if (res && res.data.success) {
                toast.success(res.data.message);
                setTimeout(() => {
                    navigate("/login");
                }, 1000);
            } else {    
                toast.error(res.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout title="Forgot Password - Ecommerce App">
          <div className="form-container" style={{ minHeight: "90vh" }}>
            <form onSubmit={handleSubmit}>
              <h4 className="title">RESET PASSWORD</h4>
    
              <div className="mb-3">
                <input
                  type="email"
                  value={email}
                  onChange={handleChange(setEmail, validateEmail, "email")}
                  onBlur={() => handleBlur(email, validateEmail, "email")}
                  className={`form-control ${errors.email ? "is-invalid" : ""}`}
                  id="exampleInputEmail1"
                  placeholder="Enter Your Email"
                  required
                  autoFocus
                />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>
              
              <div className="mb-3">
                <input
                  type="text"
                  value={answer}
                  onChange={handleChange(setAnswer, validateAnswer, "answer")}
                  onBlur={() => handleBlur(answer, validateAnswer, "answer")}
                  className={`form-control ${errors.answer ? "is-invalid" : ""}`}
                  id="exampleInputAnswer1"
                  placeholder="What is Your Favorite Sport?"
                  required
                />
                {errors.answer && <div className="invalid-feedback">{errors.answer}</div>}
              </div>
              
              <div className="mb-3">
                <input
                  type="password"
                  value={newPassword}
                  onChange={handleChange(setNewPassword, validateNewPassword, "newPassword")}
                  onBlur={() => handleBlur(newPassword, validateNewPassword, "newPassword")}
                  className={`form-control ${errors.newPassword ? "is-invalid" : ""}`}
                  id="exampleInputPassword1"
                  placeholder="Enter Your New Password"
                  required
                />
                {errors.newPassword && <div className="invalid-feedback">{errors.newPassword}</div>}
              </div>
    
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Processing..." : "RESET PASSWORD"}
              </button>
            </form>
          </div>
        </Layout>
      );
    };

export default ForgotPassword;