const express = require ('express');
const router = express.Router();

router.get('/', (req,res) => {
    res.send("hello owner router");
});



module.exports = router;