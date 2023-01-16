import * as express from "express";
var path = require("path");

const router = express.Router();

/* GET home page. */
// router.get("/", function (req, res, next) {
//   res.send("Hello Boy!!");
// });

// router.get("/static/*", async (req, res) => {
//   res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'build', req.url))
// })

// router.get("/*", async (req, res) => {
//   res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'build', req.url))
// });

router.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'build', 'index.html'))
});

module.exports = router;
