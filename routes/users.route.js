import express from "express";
import bcrypt from "bcrypt";
import { addUser, getUserByUsername, updateactivationById, updateUser, updateUserByemail } from "../services/users.service.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import rn from "random-number";
import { auth } from "../middlewares/auth.js";
const clienturl = "https://resilient-alfajores-4a4f33.netlify.app"

const options = {
    min: 1000,
    max: 9999,
    integer: true
}

const router = express.Router();

async function generateHashedPassword(password) {
    const NO_OF_ROUNDS = 10;
    const salt = await bcrypt.genSalt(NO_OF_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    // console.log(salt);
    // console.log(hashedPassword);
    return hashedPassword;
}


router.post("/register", async function (request, response) {

    const { firstname, lastname, email, password } = request.body;
    const userFromDB = await getUserByUsername(email);
    // console.log(userFromDB);
    if (userFromDB) {
        response.status(400).send({ message: "username already exist try others" })
    } else if (password.length < 8) {
        response.status(400).send({ message: "password min 8 characters required" })
    } else {

        const hashedPassword = await generateHashedPassword(password);

        const result = await addUser({ firstname: firstname, lastname: lastname, email: email, password: hashedPassword, activation: false });
        const user = await getUserByUsername(email);
        if (user) {
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                host: "smtp.gmail.com",
                secure: false,
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.PASSWORD,
                }
            });
            var mailOptions = {
                from: process.env.EMAIL,
                to: user.email,
                subject: "Activate the account",
                text: "Hi",
                html: `<h1>Hiii ${user.firstname} <a href="${clienturl}/user/activation/${user._id}">please click the link and activate your account</a> </h1>`,
            };
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                    response.json({
                        message: "Error"
                    })
                } else {
                    console.log('Email sent: ' + info.response);
                    response.json({
                        message: "Email sent"
                    })
                }
            });

            response.json({ message: "check your email for activation" });
        } else {
            response.status(500).json({ message: "User not found" });
        }
    }


})
//account activation
router.put("/activation/:id", async (request, response) => {
    try {
        const { id } = request.params;
        const user = await updateactivationById(id);
        response.json({ message: "Your account activated" });
    } catch (error) {
        response.status(400).json({ message: "Something went wrong" });
    }

});

router.post("/login", async function (request, response) {

    const { email, password } = request.body;

    const userFromDB = await getUserByUsername(email);
    // console.log(userFromDB);

    if (!userFromDB) {
        response.status(401).send({ message: "invalid credentials try again" })
    } else {
        if (!userFromDB.activation) {
            response.status(401).send({ message: "Activate your account" })
        } else {
            const storedDBPassword = userFromDB.password;
            const isPasswordCheck = await bcrypt.compare(password, storedDBPassword);

            if (isPasswordCheck) {
                const token = jwt.sign({ id: userFromDB._id }, process.env.SECRET_KEY);
                response.send({ message: "Successful Login", token: token, email: userFromDB.email });
            } else {
                response.status(401).send({ message: "invalid credentials try again" })
            }
        }
    }

})
router.post('/sendmail', async function (request, response) {
    try {
        const email = request.body.email;
        const user = await getUserByUsername(email);
        if (user) {
            let randomnum = rn(options);
            console.log("body", request.body.email);
            await updateUser({ email: request.body.email, randomnum: randomnum });
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                host: "smtp.gmail.com",
                secure: false,
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.PASSWORD,
                }
            });

            var mailOptions = {
                from: process.env.EMAIL,
                to: `${request.body.email}`,
                subject: 'User verification',
                text: `${randomnum}`,
                //html: `<h2>Password : ${req.body.Password}</h2>`
            };

            await transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                    response.json({
                        message: "Error"
                    })
                } else {
                    console.log('Email sent: ' + info.response);
                    response.json({
                        message: "Email sent"
                    })
                }
            });
        }
        else {
            response.status(400).json({ message: 'User not found' })
        }
    }
    catch (error) {
        console.log(error);
    }
})
// verify 

router.post("/verify", async (request, response) => {
    try {
        const { email, vercode } = request.body;
        const user = await getUserByUsername(email);

        if (user.rnm === vercode) {
            response.status(200).json(user)
        }
        else {
            response.status(400).json({ message: "Invalid Verification Code" })
        }
    } catch (error) {
        console.log(error);
    }
})
// update password
router.post('/changepassword/:email', auth, async function (request, response) {
    try {
        let { password } = request.body;
        const { email } = request.params;
        const hashedPassword = await generateHashedPassword(password);
        password = hashedPassword;
        const result = await updateUserByemail({ email, password });
        if (result) {
            response.json({ message: "Reset the password successfully" });
        } else {
            response.json({ message: "Something went wrong" });
        }
    } catch (error) {
        console.log(error);
    }
})



export default router;