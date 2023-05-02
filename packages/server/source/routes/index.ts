import * as express from "express";
var path = require("path");

const router = express.Router();

router.get("/favicon.ico", async (req, res) => {
  return;
});

router.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'client', 'index.html'))
});

router.get("/*", async (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'client', req.url))
});



module.exports = router;
