const Register = require("../models/registermodel");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Signup
const createUser = async (req, res) => {
    console.log(req.body);
    const { name, email, password } = req.body;

    try {
        const existingUser = await Register.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new Register({ name, email, password: hashedPassword });
        await newUser.save();
        
        //console.log(newUser);

        res.status(200).json({ message: "User registered successfully!" });
    } catch (error) {
        console.log("error :", error.message);
        res.status(500).json({ message: error.message });
    }
};

//login
const userLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const userDetails = await Register.findOne({ email });
        if (!userDetails) {
            return res.status(404).json({ message: "Invalid email" });
        }

        const isPasswordValid = await bcrypt.compare(password, userDetails.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }
        console.log(userDetails._id.toString())
        console.log("User logged in successfully");

        const jwtToken = jwt.sign({userId: userDetails._id.toString(), email }, process.env.JWT_SECRET || "JWT_SECRET", { expiresIn: '1h' });
        
        return res.status(200).json({ message: "Login successful" , jwtToken});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error :" + error.message });
    }
};

//authentication
const authentication = async (req, res, next) => {
    let jwtToken;
    const authHeader = req.headers["authorization"];
    if(authHeader !== undefined){
        jwtToken = authHeader.split(' ')[1];
    }

    if (jwtToken === undefined){
        return res.status(401).json({message: "Invalid Jwt Token"})
    }

    try{
        const payload = jwt.verify(jwtToken, process.env.JWT_SECRET || "JWT_SECRET");
        console.log(payload.userId);
        req.userId = payload.userId;
        next();

    }catch(error){
        console.log(error.message);
        return res.status(500).json({error: error.message})
    }

}

module.exports = {
    createUser,
    userLogin,
    authentication,
};