import React, { useState } from "react";
import Layout from "./../../components/Layout";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "../../styles/AuthStyles.css";
const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [DOB, setDOB] = useState("");
  const [answer, setAnswer] = useState("");
  const navigate = useNavigate();

  // Validation error states
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    DOB: "",
    answer: "",
  });

  // Validation functions
  const validateName = (name) => {
    if (!name) return "Name is required.";
    if (name.length < 3) return "Name must be at least 3 characters long.";
    if (!/[a-zA-Z]/.test(name)) {
      // Check if it's only symbols or has numbers too
      if (/^[^a-zA-Z0-9]+$/.test(name)) {
        return "Name cannot contain only symbols.";
      }
      return "Name must contain at least one letter.";
    }
    return "";
  }
  
  const validateEmail = (email) => {
    if (!email) return "Email is required."
    const emailRegex =  /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return "Email is invalid"
    return ""
  }

  const validatePassword = (password) => {
    if (!password) return "Password is required."
    if (password.length < 6) return "Password must be at least 6 characters long."

    // checking for string passwords - needs to have letters and numbers minimally
    const hasLetter = /[a-zA-Z]/.test(password)
    const hasNumber = /\d/.test(password)

    if (!hasLetter || !hasNumber) return "Password must contain at least one letter and one number."
    return ""
  }

  const validatePhone = (phone) => {
    if (!phone) return "Phone number is required.";
  
    // Check if there are any invalid symbols (anything except digits, +, -, #)
    if (/[^0-9+\-#]/.test(phone)) return "Phone number contains invalid characters.";
  
    // Remove all non-digit characters (+, -, # are ignored for now)
    const digitsOnly = phone.replace(/[^0-9]/g, "");
  
    if (digitsOnly.length === 0) return "Phone number cannot contain only symbols."; // Ensure at least one digit
    if (digitsOnly.length < 7) return "Phone number is too short.";
    if (digitsOnly.length > 15) return "Phone number is too long.";
  
    return "";
  };  
  
  const validateAddress = (address) => {
    if (!address) return "Address is required";
    return "";
  }

  const validateDOB = (dob) => {
    if (!dob) return "Date of birth is required.";
  
    const dobDate = new Date(dob);
    const currentDate = new Date();
  
    // Set time to midnight to compare only the date portion
    dobDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);
  
    if (dobDate > currentDate) return "Date of birth cannot be in the future.";
    if (dobDate.getTime() === currentDate.getTime()) return "Date of birth cannot be today.";
  
    return "";
  };

  const validateAnswer = (answer) => {
    if (!answer) return "Favorite sport is required";
    if (answer.length < 4) return "Favorite sport is too short";
    return "";
  }

  // Handle input change with validation
  const handleChange = (setter, validator, field) => (e) => {
    const value = e.target.value;
    setter(value);
    
    // Clear error when typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  // Handle blur event for validation feedback
  const handleBlur = (value, validator, field) => {
    const error = validator(value);
    setErrors({ ...errors, [field]: error });
  };

  // Validate all fields
  const validateForm = () => {
    const newErrors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
      phone: validatePhone(phone),
      address: validateAddress(address),
      DOB: validateDOB(DOB),
      answer: validateAnswer(answer),
    };
    
    setErrors(newErrors);
    
    // Check if there are any errors
    return !Object.values(newErrors).some(error => error);
  };

  // form function
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return
    }

    try {
      const res = await axios.post("/api/v1/auth/register", {
        name,
        email,
        password,
        phone,
        address,
        DOB,
        answer,
      });
      if (res && res.data.success) {
        toast.success("Registered Successfully, Please Login!")
        navigate("/login");
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  return (
    <Layout title="Register - Ecommerce App">
      <div className="form-container" style={{ minHeight: "90vh" }}>
        <form onSubmit={handleSubmit}>
          <h4 className="title">REGISTER FORM</h4>
          <div className="mb-3">
          <input
              type="text"
              value={name}
              onChange={handleChange(setName, validateName, "name")}
              onBlur={() => handleBlur(name, validateName, "name")}
              className={`form-control ${errors.name ? "is-invalid" : ""}`}
              id="exampleInputName1"
              placeholder="Enter Your Name"
              required
              autoFocus
            />
            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
          </div>
          <div className="mb-3">
            <input
              type="email"
              value={email}
              onChange={handleChange(setEmail, validateEmail, "email")}
              onBlur={() => handleBlur(email, validateEmail, "email")}
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              id="exampleInputEmail1"
              placeholder="Enter Your Email "
              required
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>
          <div className="mb-3">
            <input
              type="password"
              value={password}
              onChange={handleChange(setPassword, validatePassword, "password")}
              onBlur={() => handleBlur(password, validatePassword, "password")}
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
              id="exampleInputPassword1"
              placeholder="Enter Your Password"
              required
            />
            {errors.password && <div className="invalid-feedback">{errors.password}</div>}
          </div>
          <div className="mb-3">
            <input
              type="text"
              value={phone}
              onChange={handleChange(setPhone, validatePhone, "phone")}
              onBlur={() => handleBlur(phone, validatePhone, "phone")}
              className={`form-control ${errors.phone ? "is-invalid" : ""}`}
              id="exampleInputPhone1"
              placeholder="Enter Your Phone"
              required
            />
            {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
          </div>
          <div className="mb-3">
            <input
              type="text"
              value={address}
              onChange={handleChange(setAddress, validateAddress, "address")}
              onBlur={() => handleBlur(address, validateAddress, "address")}
              className={`form-control ${errors.address ? "is-invalid" : ""}`}
              id="exampleInputaddress1"
              placeholder="Enter Your Address"
              required
            />
            {errors.address && <div className="invalid-feedback">{errors.address}</div>}
          </div>
          <div className="mb-3">
            <input
              type="Date"
              value={DOB}
              onChange={handleChange(setDOB, validateDOB, "DOB")}
              onBlur={() => handleBlur(DOB, validateDOB, "DOB")}
              className={`form-control ${errors.DOB ? "is-invalid" : ""}`}
              id="exampleInputDOB1"
              placeholder="Enter Your DOB"
              required
            />
            {errors.DOB && <div className="invalid-feedback">{errors.DOB}</div>}
          </div>
          <div className="mb-3">
            <input
              type="text"
              value={answer}
              onChange={handleChange(setAnswer, validateAnswer, "answer")}
              onBlur={() => handleBlur(answer, validateAnswer, "answer")}
              className={`form-control ${errors.answer ? "is-invalid" : ""}`}
              id="exampleInputanswer1"
              placeholder="What is Your Favorite Sport?"
              required
            />
            {errors.answer && <div className="invalid-feedback">{errors.answer}</div>}
          </div>
          <button type="submit" className="btn btn-primary">
            REGISTER
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default Register;