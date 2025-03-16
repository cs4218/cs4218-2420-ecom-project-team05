import React, { useState, useEffect } from "react";
import UserMenu from "../../components/UserMenu";
import Layout from "./../../components/Layout";
import { useAuth } from "../../context/auth";
import toast from "react-hot-toast";
import axios from "axios";
const Profile = () => {
  //context
  const [auth, setAuth] = useAuth();
  //state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  //get user data
  useEffect(() => {
    const { email, name, phone, address } = auth?.user;
    setName(name);
    setPhone(phone);
    setEmail(email);
    setAddress(address);
  }, [auth?.user]);

  // Validation functions
  const validateName = () => {
    if (name.length < 3) {
      toast.error("Name should be at least 3 characters long");
      return false;
    }
    if (/^\d+$/.test(name) || !/[a-zA-Z]/.test(name)) {
      toast.error("Name should contain letters, not just numbers or symbols");
      return false;
    }
    return true;
  };

  const validatePassword = () => {
    if (password === "") return true;
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return false;
    }
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      toast.error("Password must contain at least one letter and one number");
      return false;
    }
    return true;
  }

  const validatePhone = () => {
    const digitsOnly = phone.replace(/\D/g, "");
    
    if (/[a-zA-Z]/.test(phone)) {
      toast.error("Phone number should not contain letters");
      return false;
    }
    if (digitsOnly.length < 7){
      toast.error("Phone number is too short.");
      return false;
    } else if (digitsOnly.length > 15) {
      toast.error("Phone number is too long.")
      return false;
    } 
    return true;
  }

  const validateAddress = () => {
    if (!address || address.trim() === "") {
      toast.error("Address is required");
      return false;
    }
    return true;
  };

  const validateForm = () => {
    return (
      validateName() &&
      validatePassword() &&
      validatePhone() &&
      validateAddress()
    );
  };

  // form function
  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!validateForm()) return
    try {
      const { data } = await axios.put("/api/v1/auth/profile", {
        name,
        email,
        password,
        phone,
        address,
      });
      if (data?.error) {
        toast.error(data?.error);
      } else {
        setAuth({ ...auth, user: data?.updatedUser });
        let ls = localStorage.getItem("auth");
        ls = JSON.parse(ls);
        ls.user = data.updatedUser;
        localStorage.setItem("auth", JSON.stringify(ls));
        toast.success("Profile Updated Successfully");
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };
  return (
    <Layout title={"Your Profile"}>
      <div className="container-fluid m-3 p-3">
        <div className="row">
          <div className="col-md-3">
            <UserMenu />
          </div>
          <div className="col-md-9">
            <div className="form-container ">
              <form onSubmit={handleSubmit}>
                <h4 className="title">USER PROFILE</h4>
                <div className="mb-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-control"
                    id="exampleInputEmail1"
                    placeholder="Enter Your Name"
                    autoFocus
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control"
                    id="exampleInputEmail1"
                    placeholder="Enter Your Email "
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-control"
                    id="exampleInputPassword1"
                    placeholder="Enter Your Password"
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-control"
                    id="exampleInputEmail1"
                    placeholder="Enter Your Phone"
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="form-control"
                    id="exampleInputEmail1"
                    placeholder="Enter Your Address"
                  />
                </div>

                <button type="submit" className="btn btn-primary">
                  UPDATE
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;