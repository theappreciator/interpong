import * as express from "express";
var path = require("path");

const router = express.Router();

/* GET home page. */
// router.get("/", function (req, res, next) {
//   res.send("Hello Boy!!");
// });

// router.get("/static/*", async (req, res) => {
//   res.sendFile(path.join(__dirname, '..', '..', 'client', 'distribution', req.url))
// })

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
