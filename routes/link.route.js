import express from "express";
const router = express.Router();
import ShortUniqueId from "short-unique-id";
import { findlongurl, storeurl, getlongurl, updatecount, geturls } from "../services/link.service.js";
import { getUserByUsername } from "../services/users.service.js";
import { ObjectId } from "mongodb";
import { auth } from "../middlewares/auth.js";




router.post("/createlink", auth, async function (request, response) {
    const { longurl, email } = request.body;
    // console.log("url is", lUrl); //if url already there in short give the existing
    const url = await findlongurl(longurl);
    if (url) {
        response
            .status(400)
            .send({ message: "this URL already exist", shorturl: url.shorturl });
    } else {
        const uid = new ShortUniqueId({ length: 5 });
        // console.log("received token is", request.headers.logintoken);
        const shorturl = uid();
        // console.log("short url is", shortStr);
        const user = await getUserByUsername(email);
        // console.log("user obj is", user);
        // console.log("user id is", user_id);
        await storeurl({
            shorturl: shorturl,
            longurl: longurl,
            clickedcount: 0,
            generatedBy: user.email,
        });
        response.send({
            message: "Short URL generated Successfully", shorturl: shorturl
        });
    }
});

router.get("/getlongurl/:userid", auth, async function (request, response) {
    const { userid } = request.params;

    await updatecount(userid);
    const url = await getlongurl(userid);
    // console.log("url obj is", urlObj);


    if (url) {

        response.send({ message: "url found", longurl: url.longurl });
    } else {
        response.status(400).send({ message: "url not found" });
    }
});
router.get("/geturls/:userid", auth, async function (request, response) {
    const { userid } = request.params;


    const urls = await geturls(userid);


    if (urls) {

        response.send({ message: "list urls found", newData: urls });
    } else {
        response.status(400).send({ message: "url not found" });
    }
});




export default router;