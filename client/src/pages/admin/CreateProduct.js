import React, { useState, useEffect } from "react";
import Layout from "./../../components/Layout";
import AdminMenu from "./../../components/AdminMenu";
import toast from "react-hot-toast";
import axios from "axios";
import { Select } from "antd";
import { useNavigate } from "react-router-dom";
const { Option } = Select;

const CreateProduct = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [shipping, setShipping] = useState(null);
  const [photo, setPhoto] = useState("");
  const [loading, setLoading] = useState(false);

  // Validation state
  const [errors, setErrors] = useState({});

  //get all category
  const getAllCategory = async () => {
    try {
      const { data } = await axios.get("/api/v1/category/get-category");
      if (data?.success) {
        setCategories(data?.category);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong in getting category");
    }
  };

  useEffect(() => {
    getAllCategory();
  }, []);

  // Validate form fields
  const validateForm = () => {
    const newErrors = {}

    // If all required fields are empty, show a single generic message
  if (!name && !description && !price && !quantity && 
    !category && !shipping) {
  toast.error("Please input your details");
  return false;
}

    if (!name.trim()) newErrors.name = "Name is required"
    if (!description.trim()) newErrors.description = "Description is required"
    if (!price) newErrors.price = "Price is required"
    if (!quantity) newErrors.quantity = "Quantity is required"
    if (!category) newErrors.category = "Please select a category"
    if (!shipping) newErrors.shipping = "Please select a shipping option"

  // Constraints for price and quantity
  if (!price || price === "0" || parseFloat(price) <= 0) {
    newErrors.price = "Price must be greater than zero";
  } else {
    const priceNum = parseFloat(price);
    // Check if the number has more than 2 decimal places
    if ((priceNum.toString().split('.')[1] || '').length > 2) {
      newErrors.price = "Price can only be up to 2 decimal places";
    }
  }
  if (quantity && parseInt(quantity) < 0) newErrors.quantity = "Quantity cannot be negative"

  // Image constraints
  if (photo) {
    if (photo.size > 1024 * 1024) {
      newErrors.photo = "Image size should be less than 1MB"
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(photo.type)) {
      newErrors.photo = "Please upload an image file"
    }
  }

  setErrors(newErrors)
  return Object.keys(newErrors).length === 0 //if it returns true, the form is valid
}

  // Handle image change
  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 1024 * 1024) {
      toast.error("Image size should be less than 1MB");
      return;
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload an image file");
      return;
    }
  
      setPhoto(file);
    
  }

  //create product function
  const handleCreate = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstError = Object.values(errors)[0]
      if (firstError) toast.error(firstError);
      return
    }
    setLoading(true)
    
    try {
      const productData = new FormData();
      productData.append("name", name);
      productData.append("description", description);
      productData.append("price", price);
      productData.append("quantity", quantity);
      productData.append("photo", photo);
      productData.append("category", category);
      productData.append("shipping", shipping);

      const { data } = await axios.post(
        "/api/v1/product/create-product",
        productData
      );

      if (data?.success) {
        setTimeout(() => {
          toast.success("Product Created Successfully");
        }, 1000);
        resetForm()
        navigate("/dashboard/admin/products");
      } else {
        toast.error(data?.message || "Failed to create product");
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false)
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setQuantity("");
    setCategory("");
    setShipping("");
    setPhoto("");
    setErrors({});
  };

  return (
    <Layout title={"Dashboard - Create Product"}>
      <div className="container-fluid m-3 p-3">
        <div className="row">
          <div className="col-md-3">
            <AdminMenu />
          </div>
          <div className="col-md-9">
            <h1>Create Product</h1>
            <div className="m-1 w-75">
              <Select
                variant={false}
                placeholder="Select a category"
                size="large"
                showSearch
                className={`form-select mb-3 ${errors.category ? 'border-danger' : ''}`}
                value = {category || undefined}
                onChange={(value) => {
                  setCategory(value);
                  setErrors({...errors, category: null})
                }}
              >
                {categories?.map((c) => (
                  <Option key={c._id} value={c._id}>
                    {c.name}
                  </Option>
                ))}
              </Select>
              {errors.category && <div className="text-danger">{errors.category}</div>}

              <div className="mb-3">
               <label className={`btn btn-outline-secondary col-md-12 ${errors.photo ? 'border-danger' : ''}`}>
                  {photo ? photo.name : "Upload Photo"}
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    hidden
                  />
                </label>
                {errors.photo && <div className="text-danger">{errors.photo}</div>}
              </div>
              <div className="mb-3">
                {photo && (
                  <div className="text-center">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt="product_photo"
                      height={"200px"}
                      className="img img-responsive"
                    />
                  </div>
                )}
              </div>
              <div className="mb-3">
                <input
                  type="text"
                  value={name}
                  placeholder="Enter a name"
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrors({...errors, name: null});
                  }}
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>
              <div className="mb-3">
                <textarea
                  type="text"
                  value={description}
                  placeholder="Enter a description"
                  className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setErrors({...errors, description: null});
                  }}
                />
                {errors.description && <div className="invalid-feedback">{errors.description}</div>}
              </div>

              <div className="mb-3">
                <input
                  type="number"
                  value={price}
                  placeholder="Enter a price"
                  className={`form-control ${errors.price ? 'is-invalid' : ''}`}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    setErrors({...errors, price: null});
                  }}
                />
                {errors.price && <div className="invalid-feedback">{errors.price}</div>}
              </div>
              <div className="mb-3">
                <input
                  type="number"
                  value={quantity}
                  placeholder="Enter a quantity"
                  className={`form-control ${errors.quantity ? 'is-invalid' : ''}`}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    setErrors({...errors, quantity: null});
                  }}
                />
                {errors.quantity && <div className="invalid-feedback">{errors.quantity}</div>}
              </div>
              <div className="mb-3">
                <Select
                  variant={false}
                  placeholder="Select shipping option"
                  data-testid="shipping-select"
                  size="large"
                  showSearch
                  className={`form-select mb-3 ${errors.shipping ? 'border-danger' : ''}`}
                  onChange={(value) => {
                    setShipping(value);
                    setErrors({...errors, shipping: null});
                  }}
                  value={shipping}
                >
                  <Option value="0">No</Option>
                  <Option value="1">Yes</Option>
                </Select>
                {errors.shipping && <div className="text-danger">{errors.shipping}</div>}
              </div>
              <div className="mb-3">
                <button className="btn btn-primary" onClick={handleCreate} disabled = {loading}>
                {loading ? "CREATING..." : "CREATE PRODUCT"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateProduct;