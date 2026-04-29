const bcrypt = require("bcrypt");
const Admin = require("../models/adminSchema.js");

// Password validation function
function validatePassword(password) {
  const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;
  return passwordRegex.test(password);
}

const adminRegister = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      role,
      schoolName,
    } = req.body;

    // 🔍 DEBUG (remove later if you want)
    console.log("REGISTER BODY:", req.body);

    // Basic validation
    if (!name || !email || !password || !confirmPassword || !schoolName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Password strength validation
    if (!validatePassword(password)) {
      return res
        .status(400)
        .json({ message: "Password does not meet the criteria." });
    }

    // ✅ PASSWORD MATCH CHECK (FIXED)
    if (password.trim() !== confirmPassword.trim()) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check existing admin
    const existingAdminByEmail = await Admin.findOne({ email });
    if (existingAdminByEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const existingSchool = await Admin.findOne({ schoolName });
    if (existingSchool) {
      return res.status(400).json({ message: "School name already exists" });
    }

    // Hash password AFTER comparison
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new Admin({
      name,
      email,
      password: hashedPassword,
      role,
      schoolName,
    });

    const result = await admin.save();
    result.password = undefined;

    res.status(201).json({
      message: "Admin registered successfully",
      admin: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const adminLogIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    admin.password = undefined;
    res.json(admin);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { adminRegister, adminLogIn };
