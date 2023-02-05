import { client } from "../index.js";

export async function storeurl(data) {
    const { shorturl, longurl, generatedBy } = data;
    const formattedData = { ...data, createdAt: new Date() };
    return await client
        .db("urlshortener")
        .collection("urls")
        .insertOne(formattedData);
}
export async function findlongurl(longurl) {
    return await client
        .db("urlshortener")
        .collection("urls")
        .findOne({ longurl: longurl });
}
export async function getlongurl(userid) {
    return await client
        .db("urlshortener")
        .collection("urls")
        .findOne({ shorturl: userid });
}
export async function updatecount(userid) {
    return await client
        .db("urlshortener")
        .collection("urls")
        .updateOne({ shorturl: userid }, { $inc: { clickedcount: 1 } });
}
export async function geturls(userid) {
    return await client
        .db("urlshortener")
        .collection("urls")
        .find({ generatedBy: userid })
        .toArray();
}